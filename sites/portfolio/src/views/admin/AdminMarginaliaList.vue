<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/dates'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

// Admin list for marginalia
const entries = ref([])
const projects = ref([])
const loading = ref(true)
const errorMessage = ref('')
const router = useRouter()
const { user } = useSupabaseAuth()

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  if (!user.value) {
    loading.value = false
    return
  }

  const [{ data: entryData, error: entryErr }, { data: projectData, error: projErr }] = await Promise.all([
    supabase
      .from('marginalia_entries')
      .select('*')
      .eq('author_id', user.value.id)
      .order('date', { ascending: false }),
    supabase.from('projects').select('id,title'),
  ])

  if (entryErr || projErr) {
    errorMessage.value = entryErr?.message || projErr?.message || 'Failed to load'
  } else {
    entries.value = entryData || []
    projects.value = projectData || []
  }
  loading.value = false
}

function projectTitle(id) {
  return projects.value.find(p => p.id === id)?.title || ''
}

async function handleDelete(id) {
  if (!confirm('Delete this entry?')) return
  const { error } = await supabase.from('marginalia_entries').delete().eq('id', id)
  if (error) {
    alert(error.message)
    return
  }
  await loadData()
}

onMounted(loadData)
</script>

<template>
  <section class="mx-auto max-w-[1120px] px-4 pb-14 space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="uppercase tracking-[0.1em] text-xs opacity-70">Admin</p>
        <h1 class="font-serif text-2xl">Marginalia</h1>
      </div>
      <button class="button" type="button" @click="router.push('/admin/marginalia/new')">
        New Entry
      </button>
    </header>

    <article class="card space-y-3">
      <p v-if="loading" class="opacity-70">Loading entries...</p>
      <p v-else-if="errorMessage" class="text-red-500 text-sm">{{ errorMessage }}</p>
      <p v-else-if="!entries.length" class="opacity-70">No entries yet.</p>

      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-black/10 text-left">
              <th class="py-2 pr-4">Title</th>
              <th class="py-2 pr-4">Type</th>
              <th class="py-2 pr-4">Published</th>
              <th class="py-2 pr-4">Project</th>
              <th class="py-2 pr-4">Date</th>
              <th class="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in entries" :key="entry.id" class="border-b border-black/5">
              <td class="py-2 pr-4">{{ entry.title }}</td>
              <td class="py-2 pr-4 uppercase tracking-[0.08em] text-xs opacity-80">{{ entry.type }}</td>
              <td class="py-2 pr-4 text-xs">{{ entry.is_published ? 'Yes' : 'No' }}</td>
              <td class="py-2 pr-4 text-xs opacity-80">{{ projectTitle(entry.project_id) }}</td>
              <td class="py-2 pr-4 text-xs opacity-80">
                {{ formatDate(entry.date) }}
              </td>
              <td class="py-2 pr-4 space-x-2 whitespace-nowrap">
                <button class="underline" type="button" @click="router.push(`/admin/marginalia/${entry.id}`)">Edit</button>
                <button class="underline text-red-500" type="button" @click="handleDelete(entry.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <p v-if="user" class="text-xs opacity-70">Signed in as {{ user.email }}</p>
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
@media (max-width: 768px) {
  .card { padding: 1rem; }
}
</style>
