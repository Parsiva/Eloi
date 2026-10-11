<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import Frame from '@/components/layout/Frame.vue'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/dates'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'
import { getProjectBySlug } from '@/data/projects'
import { marginaliaEntries as seedEntries } from '@/data/marginalia'

const route = useRoute()
const router = useRouter()
const entry = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const { user } = useSupabaseAuth()
const isLoggedIn = computed(() => !!user.value)

const relatedProject = computed(() =>
  entry.value?.projectSlug ? getProjectBySlug(entry.value.projectSlug) : null
)

const contentParagraphs = computed(() => {
  if (!entry.value) return []
  const raw = entry.value.content
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    return raw.split('\n').filter(Boolean)
  }
  return []
})

async function loadEntry() {
  loading.value = true
  errorMessage.value = ''
  const slug = route.params.slug

  const { data, error } = await supabase
    .from('marginalia_entries')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!error && data) {
    let projectSlug = data.project_slug || data.projectSlug || null
    if (!projectSlug && data.project_id) {
      const { data: proj } = await supabase.from('projects').select('slug,title').eq('id', data.project_id).single()
      projectSlug = proj?.slug || null
    }
    entry.value = { ...data, projectSlug }
    loading.value = false
    return
  }

  const seed = seedEntries.find(e => e.slug === slug)
  if (seed) {
    entry.value = seed
    loading.value = false
    return
  }

  errorMessage.value = error?.message || 'Entry not found'
  entry.value = null
  loading.value = false
}

async function handleDelete() {
  if (!entry.value?.id || entry.value?.isSeed) return
  const confirmed = window.confirm('Delete this marginalia entry?')
  if (!confirmed) return
  const { error } = await supabase.from('marginalia_entries').delete().eq('id', entry.value.id)
  if (error) {
    errorMessage.value = error.message || 'Failed to delete entry'
  } else {
    router.push('/marginalia')
  }
}

function goToEdit() {
  if (!entry.value?.id || entry.value?.isSeed) return
  router.push(`/admin/marginalia/${entry.value.id}`)
}

watch(() => route.params.slug, loadEntry)
onMounted(loadEntry)
</script>

<template>
  <div class="content-width page-stack">
    <template v-if="entry">
      <Frame configKey="panel-frame" class="entry-hero">
        <header class="entry-heading">
          <div class="entry-top">
            <RouterLink to="/marginalia" class="back-link">Back to Marginalia</RouterLink>
            <div class="actions" v-if="isLoggedIn && !entry.isSeed && entry.id">
              <button class="btn ghost" type="button" @click="goToEdit">Edit</button>
              <button class="btn ghost" type="button" @click="handleDelete">Delete</button>
            </div>
          </div>
          <h1 class="entry-title">{{ entry.title }}</h1>
          <div class="entry-meta">
            <span class="type-pill" :data-type="entry.type">
              <template v-if="entry.type === 'logbook'">Dev Log</template>
              <template v-else-if="entry.type === 'ai-recap'">AI Recap</template>
              <template v-else>{{ entry.type }}</template>
            </span>
            <span>{{ formatDate(entry.date || entry.updated_at) }}</span>
            <span v-if="entry.updated_at" class="meta-separator">&middot;</span>
            <span v-if="entry.updated_at" class="meta-project">
              Last edited: {{ formatDate(entry.updated_at) }}
            </span>
            <span v-if="relatedProject" class="meta-separator">&middot;</span>
            <RouterLink v-if="relatedProject" :to="`/projects/${relatedProject.slug}`" class="link-inline">
              {{ relatedProject.title }}
            </RouterLink>
          </div>
          <div class="tag-row">
            <span v-for="tag in entry.tags || []" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </header>
      </Frame>

      <Frame configKey="panel-frame" class="entry-body-frame">
        <div class="entry-body reading">
          <p v-for="(para, idx) in contentParagraphs" :key="idx">
            {{ para }}
          </p>
        </div>
      </Frame>
    </template>

    <p v-else-if="loading" class="center-note">Loading...</p>
    <p v-else-if="errorMessage" class="center-note error">{{ errorMessage }}</p>
    <p v-else class="center-note">Entry not found.</p>
  </div>
</template>

<style scoped>
.entry-hero,
.entry-body-frame {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.entry-heading {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.entry-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.82;
  flex-wrap: wrap;
}
.entry-title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  letter-spacing: 0.08em;
  margin: 0;
}
.entry-body {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  line-height: 1.65;
  font-size: 1rem;
  max-width: 900px;
  margin: 0 auto;
}
.tag-row {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.tag {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent);
  background: color-mix(in srgb, var(--paper) 82%, #ffffff 18%);
  font-size: 0.8rem;
}
.type-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ink) 12%, transparent);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.75rem;
}
.link-inline {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}
.back-link {
  text-decoration: none;
  font-family: var(--font-sans);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.82rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 32%, transparent);
  padding-bottom: 0.15rem;
}
.actions {
  display: flex;
  gap: 0.35rem;
}
.btn.ghost {
  background: color-mix(in srgb, var(--paper) 85%, #ffffff 15%);
}
.meta-separator {
  opacity: 0.6;
}
.center-note {
  text-align: center;
  opacity: 0.76;
}
.center-note.error {
  color: color-mix(in srgb, #a1271f 90%, var(--ink) 10%);
}
@media (max-width: 720px) {
  .entry-title {
    font-size: 1.4rem;
  }
}
</style>
