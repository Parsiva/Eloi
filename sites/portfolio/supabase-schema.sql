-- Supabase schema for Parkington Programs
-- Paste this into the Supabase SQL editor. No secrets included.

-- Ensure pgcrypto is available for gen_random_uuid
create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  can_manage_projects boolean not null default false,
  created_at timestamptz default now()
);

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  status text check (status in ('active', 'in-progress', 'archived')) default 'in-progress',
  tags text[] default '{}',
  summary text,
  description text,
  links jsonb default '[]'::jsonb,
  meta jsonb default '{}'::jsonb,
  is_featured boolean default false,
  is_published boolean default false,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Marginalia entries
create table if not exists public.marginalia_entries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  date date default current_date,
  type text check (type in ('essay', 'logbook', 'ai-recap', 'note')) default 'note',
  category text,
  project_id uuid references public.projects (id) on delete set null,
  tags text[] default '{}',
  summary text,
  content text,
  is_published boolean default false,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.marginalia_entries enable row level security;

-- Policies: public read only published
drop policy if exists "Public read published projects" on public.projects;
create policy "Public read published projects" on public.projects
  for select using (is_published = true);

drop policy if exists "Public read published marginalia" on public.marginalia_entries;
create policy "Public read published marginalia" on public.marginalia_entries
  for select using (is_published = true);

-- Authenticated users can read their own drafts/unpublished
drop policy if exists "Auth read own projects" on public.projects;
create policy "Auth read own projects" on public.projects
  for select to authenticated using (author_id = auth.uid());

drop policy if exists "Auth read own marginalia" on public.marginalia_entries;
create policy "Auth read own marginalia" on public.marginalia_entries
  for select to authenticated using (author_id = auth.uid());

-- Authenticated users can insert their own rows (marginalia)
drop policy if exists "Auth insert marginalia" on public.marginalia_entries;
create policy "Auth insert marginalia" on public.marginalia_entries
  for insert to authenticated
  with check (author_id = auth.uid() or author_id is null);

-- Authenticated users can update their own rows (marginalia)
drop policy if exists "Auth update marginalia" on public.marginalia_entries;
create policy "Auth update marginalia" on public.marginalia_entries
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Authenticated users can delete their own rows (marginalia)
drop policy if exists "Auth delete marginalia" on public.marginalia_entries;
create policy "Auth delete marginalia" on public.marginalia_entries
  for delete to authenticated using (author_id = auth.uid());

-- Project permissions use the can_manage_projects flag on profiles
drop policy if exists "Auth insert projects" on public.projects;
drop policy if exists "Auth update projects" on public.projects;
drop policy if exists "Auth delete projects" on public.projects;

create policy "Project admins insert projects" on public.projects
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.can_manage_projects = true
    )
  );

create policy "Project admins update projects" on public.projects
  for update to authenticated
  using (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.can_manage_projects = true
    )
  )
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.can_manage_projects = true
    )
  );

create policy "Project admins delete projects" on public.projects
  for delete to authenticated
  using (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.can_manage_projects = true
    )
  );

-- Helper index for flag lookups
create index if not exists profiles_can_manage_projects_idx on public.profiles (can_manage_projects);

-- Migration: add structured content blocks for marginalia (run in Supabase SQL editor)
-- Adds a JSONB column to hold block-based content while keeping legacy `content` intact.
alter table public.marginalia_entries
  add column if not exists content_blocks jsonb;
