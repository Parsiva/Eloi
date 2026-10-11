<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Frame from '@/components/layout/Frame.vue'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/dates'
import { projects as projectCatalog, getProjectBySlug } from '@/data/projects'
import { marginaliaEntries as seedEntries } from '@/data/marginalia'

const entries = ref([])
const loading = ref(true)
const errorMessage = ref('')

const search = ref('')
const tagFilter = ref('all')
const sortMode = ref('newest')

const router = useRouter()
const projectMap = ref(new Map(projectCatalog.map(p => [p.id || p.slug, p])))
let retryTimer = null
const RETRY_DELAY = 2500
const FETCH_TIMEOUT = 8000

const allTags = computed(() => {
  const set = new Set()
  entries.value.forEach(e => (e.tags || []).forEach(t => set.add(t)))
  return Array.from(set).sort()
})

const filteredEntries = computed(() => {
  const term = search.value.trim().toLowerCase()
  const list = entries.value.filter(entry => {
    const matchesSearch =
      !term ||
      entry.title?.toLowerCase().includes(term) ||
      (entry.summary || '').toLowerCase().includes(term) ||
      (entry.content || '').toLowerCase().includes(term) ||
      (entry.tags || []).some(t => t.toLowerCase().includes(term))
    const matchesTag = tagFilter.value === 'all' || (entry.tags || []).includes(tagFilter.value)
    return matchesSearch && matchesTag
  })

  return list.sort((a, b) => {
    const dateA = new Date(a.updated_at || a.date || 0).getTime()
    const dateB = new Date(b.updated_at || b.date || 0).getTime()
    if (sortMode.value === 'oldest') return dateA - dateB
    if (sortMode.value === 'recently-edited') return dateB - dateA
    return dateB - dateA
  })
})

function projectTitleFromSlug(slug) {
  return getProjectBySlug(slug)?.title || ''
}

function excerpt(entry) {
  if (entry.summary) return entry.summary
  if (entry.content) {
    const text = Array.isArray(entry.content) ? entry.content.join(' ') : entry.content
    return text.slice(0, 160) + (text.length > 160 ? '…' : '')
  }
  return ''
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const fetchEntries = supabase
      .from('marginalia_entries')
      .select('*')
      .eq('is_published', true)
      .order('date', { ascending: false })

    const fetchProjects = supabase.from('projects').select('id,slug,title').eq('is_published', true)

    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), FETCH_TIMEOUT))
    const [entryRes, projectRes] = await Promise.all([
      Promise.race([fetchEntries, timeout]),
      Promise.race([fetchProjects, timeout]),
    ])

    const entryErr = entryRes?.error
    const entryData = entryRes?.data
    const projectData = projectRes?.data
    const projErr = projectRes?.error

    if (projErr) {
      console.warn('Project lookup failed for marginalia index', projErr)
    } else if (projectData) {
      projectMap.value = new Map([
        ...projectMap.value.entries(),
        ...projectData.map(p => [p.id, p]),
        ...projectData.map(p => [p.slug, p]),
      ])
    }

    if (entryErr) {
      errorMessage.value = entryErr.message || 'Failed to load entries'
      entries.value = seedEntries
      scheduleRetry()
    } else {
      const base = entryData || []
      const normalized = base.map(e => ({
        ...e,
        projectSlug: e.project_slug || e.projectSlug || (projectMap.value.get(e.project_id)?.slug ?? null),
      }))
      entries.value = normalized.length ? normalized : seedEntries
      clearRetry()
      loading.value = false
      return
    }
  } catch (err) {
    console.error(err)
    entries.value = seedEntries
    errorMessage.value = 'Failed to load entries; showing seed examples.'
    scheduleRetry()
  } finally {
    if (!retryTimer) loading.value = false
  }
}

function openCreate() {
  router.push('/marginalia/new')
}

onMounted(loadData)

function scheduleRetry() {
  clearRetry()
  loading.value = true
  retryTimer = setTimeout(() => {
    loadData()
  }, RETRY_DELAY)
}

function clearRetry() {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

onBeforeUnmount(() => {
  clearRetry()
})
</script>

<template>
  <div class="content-width page-stack marginalia-page">
    <header class="page-lede">
      <p class="lede-eyebrow">Marginalia</p>
      <h1 class="lede-title">Essays, notes, logbooks, and AI recaps</h1>
      <p class="lede-subtitle">
        The ledger for everything written: city-planning essays, studio notes, dev logs, and AI-generated recaps.
      </p>
    </header>

    <div class="toolbar">
      <Frame configKey="panel-frame" class="filter-panel">
        <div class="filter-bar">
          <label class="filter-label sr-only" for="search">Search marginalia</label>
          <input
            id="search"
            v-model="search"
            class="form-control search-input"
            type="search"
            placeholder="Search title, tags, excerpt..."
          />
          <div class="filter-group tags">
            <span class="filter-label">Tags</span>
            <div class="filter-options">
              <button
                class="filter-chip"
                :class="{ active: tagFilter === 'all' }"
                type="button"
                @click="tagFilter = 'all'"
              >
                All
              </button>
              <button
                v-for="tag in allTags"
                :key="tag"
                class="filter-chip"
                :class="{ active: tagFilter === tag }"
                type="button"
                @click="tagFilter = tag"
              >
                {{ tag }}
              </button>
            </div>
          </div>
          <div class="filter-group sort">
            <label class="filter-label" for="sortMode">Sort</label>
            <select id="sortMode" v-model="sortMode" class="form-select filter-select">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="recently-edited">Recently Edited</option>
            </select>
          </div>
        </div>
      </Frame>
      <button type="button" class="btn new-btn" @click="openCreate">New Marginalia</button>
    </div>

    <p v-if="loading" class="center-note">Loading entries...</p>
    <p v-else-if="errorMessage" class="center-note error">{{ errorMessage }}</p>

    <div v-else class="entries-grid">
      <RouterLink
        v-for="entry in filteredEntries"
        :key="entry.slug || entry.id"
        :to="`/marginalia/${entry.slug}`"
        class="entry-link"
      >
        <Frame configKey="panel-frame" class="entry-card">
          <div class="card-open" aria-hidden="true">
            <svg viewBox="0 0 16 16" role="presentation">
              <path d="M4 4h8v1.5H6.5V12H5V4z" fill="currentColor" />
              <path d="M9 4h1.5v5.5H16V11H9z" fill="currentColor" />
            </svg>
          </div>
          <div class="entry-card__body">
            <div class="entry-meta">
              <span class="type-pill" :data-type="entry.type">
                <template v-if="entry.type === 'logbook'">Dev Log</template>
                <template v-else-if="entry.type === 'ai-recap'">AI Recap</template>
                <template v-else>{{ entry.type }}</template>
              </span>
              <span>{{ formatDate(entry.updated_at || entry.date) }}</span>
            </div>
            <h2 class="entry-title">{{ entry.title }}</h2>
            <p v-if="entry.projectSlug" class="entry-project">
              {{ projectTitleFromSlug(entry.projectSlug) }}
            </p>
            <p class="entry-summary">{{ excerpt(entry) }}</p>
            <div class="tag-row">
              <span v-for="tag in entry.tags || []" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </Frame>
      </RouterLink>
    </div>

    <p v-if="!loading && !errorMessage && !filteredEntries.length" class="center-note">
      No entries match that filter yet.
    </p>
  </div>
</template>

<style scoped>
.marginalia-page {
  gap: calc(var(--gutter) * 0.9);
}
.toolbar {
  display: flex;
  align-items: flex-start;
  gap: var(--gutter);
  flex-wrap: wrap;
  justify-content: space-between;
}
.filter-panel {
  flex: 1;
  min-width: 260px;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--gutter) * 0.5);
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-sans);
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.filter-group.tags {
  flex: 1;
  flex-wrap: wrap;
}
.filter-label {
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.filter-options {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.filter-chip {
  padding: 0.35rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--ink) 28%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--paper) 78%, #ffffff 22%);
  font-size: 0.9rem;
  transition: background 140ms ease, transform 140ms ease, box-shadow 140ms ease;
}
.filter-chip:hover {
  background: color-mix(in srgb, var(--paper) 72%, #ffffff 28%);
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}
.filter-chip.active {
  background: color-mix(in srgb, var(--ink) 8%, var(--paper) 92%);
  border-color: color-mix(in srgb, var(--ink) 32%, transparent);
}
.filter-select {
  min-width: 160px;
}
.search-input {
  min-width: 220px;
  max-width: 320px;
}
.new-btn {
  align-self: stretch;
}
.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--gutter);
}
.entry-link {
  text-decoration: none;
  color: inherit;
  outline: none;
}
.entry-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
  transition: transform 160ms ease, box-shadow 180ms ease;
}
.entry-card:hover,
.entry-link:focus-visible .entry-card {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}
.entry-link:focus-visible .entry-card {
  outline: 2px solid color-mix(in srgb, var(--ink) 32%, transparent);
  outline-offset: 4px;
}
.entry-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.entry-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.82;
}
.entry-title {
  font-family: var(--font-display);
  font-size: 1.2rem;
  letter-spacing: 0.06em;
  margin: 0;
}
.entry-project {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.82;
}
.entry-summary {
  margin: 0;
  opacity: 0.92;
  line-height: 1.45;
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
.card-open {
  position: absolute;
  top: calc(var(--frame-thickness) + var(--frame-inner-pad) - 2px);
  right: calc(var(--frame-thickness) + var(--frame-inner-pad) - 2px);
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--ink) 30%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--paper) 78%, #ffffff 22%);
  color: color-mix(in srgb, var(--ink) 82%, #000 18%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  pointer-events: none;
}
.card-open svg {
  width: 14px;
  height: 14px;
}
.center-note {
  text-align: center;
  opacity: 0.76;
}
.center-note.error {
  color: color-mix(in srgb, #a1271f 90%, var(--ink) 10%);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .search-input {
    width: 100%;
  }
  .new-btn {
    width: 100%;
  }
}
</style>
