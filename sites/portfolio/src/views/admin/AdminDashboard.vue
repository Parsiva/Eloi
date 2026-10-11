<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/dates'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

const router = useRouter()
const { user, profile, waitForAuthReady } = useSupabaseAuth()

const projects = ref([])
const marginalia = ref([])
const loading = ref(false)
const errorMessage = ref('')

const canManageProjects = computed(() => profile.value?.can_manage_projects === true)

async function loadData() {
  if (!user.value) return
  loading.value = true
  errorMessage.value = ''

  const [projectsRes, marginaliaRes] = await Promise.all([
    canManageProjects.value
      ? supabase
          .from('projects')
          .select('*')
          .eq('author_id', user.value.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('marginalia_entries')
      .select('*')
      .eq('author_id', user.value.id)
      .order('date', { ascending: false }),
  ])

  if (projectsRes.error || marginaliaRes.error) {
    errorMessage.value = projectsRes.error?.message || marginaliaRes.error?.message || 'Failed to load dashboard.'
  }

  projects.value = projectsRes.data || []
  marginalia.value = marginaliaRes.data || []
  loading.value = false
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) {
    alert(error.message)
    return
  }
  loadData()
}

async function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return
  const { error } = await supabase.from('marginalia_entries').delete().eq('id', id)
  if (error) {
    alert(error.message)
    return
  }
  loadData()
}

onMounted(async () => {
  await waitForAuthReady()
  await loadData()
})
</script>

<template>
  <section class="mx-auto max-w-[1120px] px-4 pb-14 space-y-6">
    <header class="space-y-2">
      <p class="uppercase tracking-[0.1em] text-xs opacity-70">Admin</p>
      <h1 class="font-serif text-2xl">Dashboard</h1>
      <p class="text-[15px] leading-7 opacity-90">
        Manage projects and marginalia from one place.
      </p>
    </header>

    <p v-if="loading" class="opacity-70">Loading dashboard...</p>
    <p v-else-if="errorMessage" class="text-red-500 text-sm">{{ errorMessage }}</p>

    <div v-else class="space-y-6">
      <article v-if="canManageProjects" class="card space-y-3">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p class="uppercase tracking-[0.1em] text-xs opacity-70">Projects</p>
            <h2 class="font-serif text-xl">Your projects</h2>
          </div>
          <div class="flex items-center gap-2">
            <button class="button" type="button" @click="router.push('/admin/projects/new')">New project</button>
            <button class="button" type="button" @click="loadData">Refresh</button>
          </div>
        </header>

        <div v-if="!projects.length" class="text-sm opacity-80">No projects yet.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-black/10 text-left">
                <th class="py-2 pr-4">Title</th>
                <th class="py-2 pr-4">Status</th>
                <th class="py-2 pr-4">Published</th>
                <th class="py-2 pr-4">Created</th>
                <th class="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="proj in projects" :key="proj.id" class="border-b border-black/5">
                <td class="py-2 pr-4">{{ proj.title }}</td>
                <td class="py-2 pr-4 uppercase tracking-[0.08em] text-xs opacity-80">{{ proj.status }}</td>
                <td class="py-2 pr-4 text-xs">{{ proj.is_published ? 'Yes' : 'No' }}</td>
                <td class="py-2 pr-4 text-xs opacity-80">
                  {{ proj.created_at ? new Date(proj.created_at).toLocaleDateString() : '' }}
                </td>
                <td class="py-2 pr-4 space-x-2 whitespace-nowrap">
                  <button class="underline" type="button" @click="router.push(`/admin/projects/${proj.id}`)">Edit</button>
                  <button class="underline text-red-500" type="button" @click="deleteProject(proj.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="card space-y-3">
        <header class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p class="uppercase tracking-[0.1em] text-xs opacity-70">Marginalia</p>
            <h2 class="font-serif text-xl">Your entries</h2>
          </div>
          <div class="flex items-center gap-2">
            <button class="button" type="button" @click="router.push('/admin/marginalia/new')">New entry</button>
            <button class="button" type="button" @click="loadData">Refresh</button>
          </div>
        </header>

        <div v-if="!marginalia.length" class="text-sm opacity-80">No entries yet.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-black/10 text-left">
                <th class="py-2 pr-4">Title</th>
                <th class="py-2 pr-4">Type</th>
                <th class="py-2 pr-4">Published</th>
                <th class="py-2 pr-4">Date</th>
                <th class="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in marginalia" :key="entry.id" class="border-b border-black/5">
                <td class="py-2 pr-4">{{ entry.title }}</td>
                <td class="py-2 pr-4 uppercase tracking-[0.08em] text-xs opacity-80">{{ entry.type }}</td>
                <td class="py-2 pr-4 text-xs">{{ entry.is_published ? 'Yes' : 'No' }}</td>
                <td class="py-2 pr-4 text-xs opacity-80">
                  {{ formatDate(entry.date) }}
                </td>
                <td class="py-2 pr-4 space-x-2 whitespace-nowrap">
                  <button class="underline" type="button" @click="router.push(`/admin/marginalia/${entry.id}`)">Edit</button>
                  <button class="underline text-red-500" type="button" @click="deleteEntry(entry.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <p v-if="user" class="text-xs opacity-70">Signed in as {{ user.email }}</p>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: rgba(246, 236, 213, 0.94);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 1.25rem;
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.04);
}
.button {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 999px;
  font-size: 0.95rem;
  background: rgba(0, 0, 0, 0.03);
  transition: background 160ms ease, transform 160ms ease;
}
.button:hover { background: rgba(0, 0, 0, 0.06); transform: translateY(-1px); }
.button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
@media (max-width: 768px) {
  .card { padding: 1rem; }
}
</style>
