<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'
import RichTextEditor from '@/components/RichTextEditor.vue'
import MetaFieldModal from '@/components/MetaFieldModal.vue'

const route = useRoute()
const router = useRouter()
const { user, profile, waitForAuthReady } = useSupabaseAuth()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const title = ref('')
const subtitle = ref('')
const slug = ref('')
const status = ref<'active' | 'in-progress' | 'archived'>('in-progress')
const tagsInput = ref('')
const summary = ref('')
const descriptionHtml = ref('')
const linksInput = ref('[]')
const is_featured = ref(false)
const is_published = ref(false)
const hasCustomSlug = ref(false)
const wordCount = ref(0)

// Modal state
const modalVisible = ref(false)
const modalLabel = ref('')
const modalFieldKey = ref<'title' | 'subtitle' | 'slug' | 'status' | 'summary' | 'tags' | 'links'>('title')
const modalValue = ref('')

watch(title, (val) => {
  if (!hasCustomSlug.value) {
    slug.value = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }
})

function markCustomSlug() {
  hasCustomSlug.value = true
}

async function loadProject() {
  if (!isEdit.value) return
  loading.value = true
  await waitForAuthReady()
  if (!user.value) {
    loading.value = false
    return
  }
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', route.params.id)
    .eq('author_id', user.value.id)
    .single()
  if (error) {
    errorMessage.value = error.message
  } else if (data) {
    title.value = data.title || ''
    slug.value = data.slug || ''
    subtitle.value = data.subtitle || ''
    status.value = (data.status as any) || 'in-progress'
    tagsInput.value = (data.tags || []).join(', ')
    summary.value = data.summary || ''
    descriptionHtml.value = data.description || ''
    linksInput.value = JSON.stringify(data.links || [], null, 2)
    is_featured.value = !!data.is_featured
    is_published.value = !!data.is_published
  }
  loading.value = false
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function parseLinks(value: string) {
  if (!value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    throw new Error('Links must be valid JSON (array of { label, url }).')
  }
}

async function handleSubmit(e?: Event) {
  if (e) e.preventDefault()
  errorMessage.value = null
  await waitForAuthReady()
  if (!user.value) {
    errorMessage.value = 'You must be signed in.'
    return
  }
  if (!title.value.trim() || !slug.value.trim()) {
    errorMessage.value = 'Title and slug are required.'
    return
  }

  const payload: Record<string, any> = {
    title: title.value.trim(),
    slug: slug.value.trim(),
    subtitle: subtitle.value.trim(),
    status: status.value,
    tags: parseTags(tagsInput.value),
    summary: summary.value.trim(),
    description: descriptionHtml.value,
    links: parseLinks(linksInput.value),
    is_featured: is_featured.value,
    is_published: is_published.value,
  }

  loading.value = true
  if (isEdit.value) {
    const { error } = await supabase.from('projects').update(payload).eq('id', route.params.id)
    if (error) errorMessage.value = error.message
  } else {
    const { error } = await supabase.from('projects').insert([{ ...payload, author_id: user.value.id }])
    if (error) errorMessage.value = error.message
  }
  loading.value = false

  if (!errorMessage.value) {
    router.push('/admin')
  }
}

onMounted(() => {
  loadProject()
})

function fieldToValue(key: typeof modalFieldKey.value) {
  switch (key) {
    case 'title':
      return title.value
    case 'subtitle':
      return subtitle.value
    case 'slug':
      return slug.value
    case 'status':
      return status.value
    case 'summary':
      return summary.value
    case 'tags':
      return tagsInput.value
    case 'links':
      return linksInput.value
    default:
      return ''
  }
}

function setFieldFromModal(key: typeof modalFieldKey.value, value: string) {
  switch (key) {
    case 'title':
      title.value = value
      break
    case 'subtitle':
      subtitle.value = value
      break
    case 'slug':
      slug.value = value
      hasCustomSlug.value = !!value
      break
    case 'status':
      status.value = value as any
      break
    case 'summary':
      summary.value = value
      break
    case 'tags':
      tagsInput.value = value
      break
    case 'links':
      linksInput.value = value
      break
  }
}

function openFieldModal(key: typeof modalFieldKey.value, label: string) {
  modalFieldKey.value = key
  modalLabel.value = label
  modalValue.value = fieldToValue(key) || ''
  modalVisible.value = true
}

function handleModalSave(val: string) {
  setFieldFromModal(modalFieldKey.value, val)
  modalVisible.value = false
}

function handleModalClose() {
  modalVisible.value = false
}
</script>

<template>
  <section class="page">
    <section class="editor-column">
      <div class="section-heading">
        <h1 class="section-title">{{ title || (isEdit ? 'Edit project' : 'New project') }}</h1>
        <button class="back-link" type="button" @click="router.back()">< Back</button>
      </div>
      <div class="editor-intro">
        <h2 class="editor-title">{{ subtitle || 'Project body' }}</h2>
        <p class="editor-subtitle">
          <span class="author-line">{{ profile?.username || user?.email || user?.id || 'Author' }}</span>
          <span v-if="tagsInput" class="tags-line"> · {{ tagsInput }}</span>
        </p>
      </div>
      <section class="editor-sheet">
        <div class="editor-body">
          <RichTextEditor
            v-model="descriptionHtml"
            placeholder="Describe this project, its goals, progress, and notes."
            @word-count="(count: number) => (wordCount = count)"
          />
        </div>
        <div class="word-count">{{ wordCount }} words</div>
      </section>
    </section>

    <aside class="sidebar">
      <div class="sidebar-header">
        <p class="eyebrow">Metadata</p>
        <h3 class="sidebar-title">Project details</h3>
      </div>
      <div class="sidebar-list">
        <button class="sidebar-item" type="button" @click="openFieldModal('title', 'Title')">
          <span class="sidebar-item-label">Title</span>
          <span class="sidebar-item-icon">›</span>
        </button>
        <button class="sidebar-item" type="button" @click="openFieldModal('subtitle', 'Subtitle')">
          <span class="sidebar-item-label">Subtitle</span>
          <span class="sidebar-item-icon">›</span>
        </button>
        <button class="sidebar-item" type="button" @click="openFieldModal('slug', 'Slug')">
          <span class="sidebar-item-label">Slug</span>
          <span class="sidebar-item-icon">›</span>
        </button>
        <button class="sidebar-item" type="button" @click="openFieldModal('status', 'Status')">
          <span class="sidebar-item-label">Status</span>
          <span class="sidebar-item-icon">›</span>
        </button>
        <button class="sidebar-item" type="button" @click="openFieldModal('summary', 'Summary')">
          <span class="sidebar-item-label">Summary</span>
          <span class="sidebar-item-icon">›</span>
        </button>
        <button class="sidebar-item" type="button" @click="openFieldModal('tags', 'Tags')">
          <span class="sidebar-item-label">Tags</span>
          <span class="sidebar-item-icon">›</span>
        </button>
        <button class="sidebar-item" type="button" @click="openFieldModal('links', 'Links (JSON)')">
          <span class="sidebar-item-label">Links (JSON)</span>
          <span class="sidebar-item-icon">›</span>
        </button>
      </div>

      <div class="sidebar-checkboxes">
        <label class="checkbox">
          <input type="checkbox" v-model="is_featured" />
          <span>Featured</span>
        </label>
        <label class="checkbox">
          <input type="checkbox" v-model="is_published" />
          <span>Published</span>
        </label>
        <label class="checkbox">
          <span class="sidebar-item-label">Author</span>
          <input :value="user?.email || user?.id || ''" type="text" class="mini-input" disabled />
        </label>
      </div>

      <button class="save-button" type="button" :disabled="loading" @click="handleSubmit">
        {{ loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create project' }}
      </button>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    </aside>

    <MetaFieldModal
      :visible="modalVisible"
      :label="modalLabel"
      v-model="modalValue"
      :type="modalFieldKey === 'summary' || modalFieldKey === 'links' ? 'textarea' : 'text'"
      @update:modelValue="handleModalSave"
      @close="handleModalClose"
    />
  </section>
</template>

<style scoped>
.page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 4rem;
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 2rem;
}
@media (max-width: 960px) {
  .page {
    grid-template-columns: 1fr;
  }
}
.editor-column {
  display: grid;
  gap: 0.75rem;
}
.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}
.section-title {
  font-size: 1.6rem;
  font-weight: 600;
}
.back-link {
  border: none;
  background: transparent;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;
}
.editor-intro {
  margin-bottom: 0.25rem;
}
.editor-title {
  margin: 0;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}
.editor-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: #555;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.author-line {
  font-weight: 600;
}
.tags-line {
  opacity: 0.85;
}
.editor-sheet {
  background: #ffffffee;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0.75rem 0.75rem 0.5rem;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.editor-body {
  flex: 1;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 1rem;
  line-height: 1.6;
}
.editor-body :deep(.pp-editor) {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.editor-body :deep(.pp-editor-toolbar) {
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0.4rem 0.5rem;
}
.editor-body :deep(.pp-editor-surface) {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  min-height: 500px;
}
.word-count {
  margin-top: 0.1rem;
  text-align: right;
  font-size: 0.8rem;
  color: #777;
}
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  opacity: 0.7;
}
.sidebar {
  background: rgba(246, 236, 213, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  padding: 1rem 1.25rem;
  position: sticky;
  top: 2rem;
  height: fit-content;
  display: grid;
  gap: 0.75rem;
}
.sidebar-header {
  display: grid;
  gap: 0.15rem;
}
.sidebar-title {
  font-family: var(--font-serif, Georgia, 'Times New Roman', serif);
  font-size: 1.1rem;
}
.sidebar-list {
  display: grid;
  gap: 0.1rem;
}
.sidebar-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 0.9rem;
  background: transparent;
}
.sidebar-item-label {
  font-variant: small-caps;
  letter-spacing: 0.03em;
}
.sidebar-item-icon {
  font-size: 1rem;
  opacity: 0.5;
}
.sidebar-checkboxes {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}
.checkbox input {
  accent-color: #2b2b2b;
}
.mini-input {
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.85);
}
.save-button {
  margin-top: 1rem;
  width: 100%;
  padding: 0.5rem;
  background: #2f4d2f;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}
.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error-text {
  color: #c0392b;
  font-size: 0.9rem;
}
.btn-primary,
.btn-secondary {
  padding: 0.3rem 0.9rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
}
.btn-primary {
  background: #2f4d2f;
  color: #fff;
  border: 1px solid #2f4d2f;
}
.btn-secondary {
  background: transparent;
  color: #333;
  border: 1px solid rgba(0, 0, 0, 0.3);
}
</style>
