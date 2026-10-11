<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { todayISODate } from '@/lib/dates'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

// Create/edit marginalia entry
const route = useRoute()
const router = useRouter()
const { user } = useSupabaseAuth()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const errorMessage = ref('')
const projects = ref([])

const form = ref({
  title: '',
  slug: '',
  date: todayISODate(),
  type: 'note',
  category: '',
  project_id: '',
  tagsInput: '',
  summary: '',
  content: '',
  is_published: false,
})

function parseTags(value) {
  return value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
}

async function loadProjects() {
  const { data, error } = await supabase.from('projects').select('id,title').order('title', { ascending: true })
  if (!error && data) projects.value = data
}

async function loadEntry() {
  if (!isEdit.value) return
  if (!user.value) return
  const { data, error } = await supabase
    .from('marginalia_entries')
    .select('*')
    .eq('id', route.params.id)
    .eq('author_id', user.value.id)
    .single()
  if (error) {
    errorMessage.value = error.message
    return
  }
  form.value = {
    title: data.title || '',
    slug: data.slug || '',
    date: data.date || todayISODate(),
    type: data.type || 'note',
    category: data.category || '',
    project_id: data.project_id || '',
    tagsInput: (data.tags || []).join(', '),
    summary: data.summary || '',
    content: data.content || '',
    is_published: !!data.is_published,
  }
}

async function handleSubmit(e) {
  e.preventDefault()
  errorMessage.value = ''
  if (!user.value) {
    errorMessage.value = 'You must be signed in.'
    return
  }
  const payload = {
    title: form.value.title,
    slug: form.value.slug,
    date: form.value.date,
    type: form.value.type,
    category: form.value.category,
    project_id: form.value.project_id || null,
    tags: parseTags(form.value.tagsInput),
    summary: form.value.summary,
    content: form.value.content,
    is_published: form.value.is_published,
  }
  if (!payload.title || !payload.slug) {
    errorMessage.value = 'Title and slug are required.'
    return
  }

  loading.value = true
  if (isEdit.value) {
    const { error } = await supabase.from('marginalia_entries').update(payload).eq('id', route.params.id)
    if (error) errorMessage.value = error.message
  } else {
    const { error } = await supabase
      .from('marginalia_entries')
      .insert([{ ...payload, author_id: user.value?.id || null }])
    if (error) errorMessage.value = error.message
  }
  loading.value = false

  if (!errorMessage.value) {
    router.push('/admin/marginalia')
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadProjects(), loadEntry()])
  loading.value = false
})
</script>

<template>
  <section class="mx-auto max-w-[820px] px-4 pb-14 space-y-4">
    <header class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <p class="uppercase tracking-[0.1em] text-xs opacity-70">Admin</p>
        <h1 class="font-serif text-2xl">{{ isEdit ? 'Edit marginalia' : 'New marginalia' }}</h1>
      </div>
      <button class="button" type="button" @click="router.push('/admin/marginalia')">Back</button>
    </header>

    <article class="card space-y-4">
      <p v-if="loading" class="opacity-70">Loading...</p>

      <form v-else class="space-y-3" @submit="handleSubmit">
        <div class="field">
          <label for="title">Title</label>
          <input id="title" v-model="form.title" class="input" required />
        </div>

        <div class="field">
          <label for="slug">Slug</label>
          <input id="slug" v-model="form.slug" class="input" required />
        </div>

        <div class="field">
          <label for="date">Date</label>
          <input id="date" type="date" v-model="form.date" class="input" />
        </div>

        <div class="field">
          <label for="type">Type</label>
          <select id="type" v-model="form.type" class="input">
            <option value="essay">Essay</option>
            <option value="logbook">Logbook</option>
            <option value="ai-recap">AI Recap</option>
            <option value="note">Note</option>
          </select>
        </div>

        <div class="field">
          <label for="category">Category</label>
          <input id="category" v-model="form.category" class="input" placeholder="city-planning" />
        </div>

        <div class="field">
          <label for="project">Project</label>
          <select id="project" v-model="form.project_id" class="input">
            <option value="">None</option>
            <option v-for="proj in projects" :key="proj.id" :value="proj.id">{{ proj.title }}</option>
          </select>
        </div>

        <div class="field">
          <label for="tags">Tags (comma-separated)</label>
          <input id="tags" v-model="form.tagsInput" class="input" />
        </div>

        <div class="field">
          <label for="summary">Summary</label>
          <textarea id="summary" v-model="form.summary" class="input" rows="3"></textarea>
        </div>

        <div class="field">
          <label for="content">Content</label>
          <textarea id="content" v-model="form.content" class="input" rows="6"></textarea>
        </div>

        <label class="checkbox">
          <input type="checkbox" v-model="form.is_published" />
          <span>Published</span>
        </label>

        <div class="flex items-center gap-2">
          <button type="submit" class="button" :disabled="loading">
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
          <span v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</span>
        </div>
      </form>
    </article>
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
.field { display: grid; gap: 0.35rem; }
label { font-size: 0.9rem; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.8; }
.input {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.02);
}
.checkbox { display: inline-flex; align-items: center; gap: 0.35rem; }
.checkbox input { accent-color: #2b2b2b; }
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
