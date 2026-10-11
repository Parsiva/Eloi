<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { todayISODate } from '@/lib/dates'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

// Simple block type structure for the editor
const BlockTypes = {
  HEADING: 'heading',
  PARAGRAPH: 'paragraph',
  IMAGE: 'image',
}

const router = useRouter()
const { user, profile } = useSupabaseAuth()

const currentStep = ref(1)
const entryId = ref(null)
const isPublished = ref(false)

const metadata = reactive({
  title: '',
  slug: '',
  date: todayISODate(),
  type: 'note',
  category: '',
  project_id: '',
  summary: '',
})
const slugEditedManually = ref(false)

const contentBlocks = ref([])
const projects = ref([])

const isSaving = ref(false)
const saveError = ref('')
const stepError = ref('')

const authorDisplay = computed(() => profile.value?.username || user.value?.email || 'Unknown author')
const metadataLocked = computed(() => !!entryId.value)

watch(
  () => metadata.title,
  (value) => {
    if (!slugEditedManually.value) {
      metadata.slug = slugify(value)
    }
  }
)

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function loadProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id,title,slug')
    .order('title', { ascending: true })

  if (!error && data) {
    projects.value = data
  }
}

function ensureInitialBlocks() {
  if (contentBlocks.value.length) return
  contentBlocks.value = [
    { id: newBlockId(), type: BlockTypes.HEADING, level: 2, text: '' },
    { id: newBlockId(), type: BlockTypes.PARAGRAPH, text: '' },
  ]
}

function newBlockId() {
  return `blk-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`
}

function addBlock(type) {
  if (type === BlockTypes.PARAGRAPH) {
    contentBlocks.value.push({ id: newBlockId(), type, text: '' })
  } else if (type === BlockTypes.HEADING) {
    contentBlocks.value.push({ id: newBlockId(), type, level: 2, text: '' })
  } else if (type === BlockTypes.IMAGE) {
    contentBlocks.value.push({
      id: newBlockId(),
      type,
      url: '',
      alt: '',
      caption: '',
      layout: 'full',
    })
  }
}

function moveBlock(index, direction) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= contentBlocks.value.length) return
  const blocks = [...contentBlocks.value]
  const [block] = blocks.splice(index, 1)
  blocks.splice(targetIndex, 0, block)
  contentBlocks.value = blocks
}

function removeBlock(index) {
  contentBlocks.value.splice(index, 1)
}

async function handleStepOneNext() {
  stepError.value = ''
  saveError.value = ''
  if (!metadata.title || !metadata.slug || !metadata.type) {
    stepError.value = 'Title, slug, and type are required.'
    return
  }
  if (!user.value) {
    stepError.value = 'You must be signed in.'
    return
  }
  isSaving.value = true
  const payload = {
    title: metadata.title,
    slug: metadata.slug,
    date: metadata.date,
    type: metadata.type,
    category: metadata.category,
    project_id: metadata.project_id || null,
    summary: metadata.summary,
    is_published: false,
    author_id: user.value.id,
    content_blocks: [],
  }
  const { data, error } = await supabase
    .from('marginalia_entries')
    .insert([payload])
    .select('id')
    .single()

  if (error) {
    stepError.value = error.message || 'Could not save draft.'
    isSaving.value = false
    return
  }

  entryId.value = data.id
  isPublished.value = false
  isSaving.value = false
  currentStep.value = 2
  ensureInitialBlocks()
}

async function saveContentBlocks() {
  if (!entryId.value) return
  isSaving.value = true
  saveError.value = ''
  const { error } = await supabase
    .from('marginalia_entries')
    .update({
      content_blocks: contentBlocks.value,
      summary: metadata.summary,
    })
    .eq('id', entryId.value)
    .eq('author_id', user.value?.id || '')

  if (error) {
    saveError.value = error.message || 'Could not save draft.'
  }
  isSaving.value = false
}

async function goToReview() {
  await saveContentBlocks()
  if (!saveError.value) {
    currentStep.value = 3
  }
}

async function handlePublishSave() {
  if (!entryId.value) return
  isSaving.value = true
  saveError.value = ''
  const { error } = await supabase
    .from('marginalia_entries')
    .update({
      content_blocks: contentBlocks.value,
      summary: metadata.summary,
      is_published: isPublished.value,
    })
    .eq('id', entryId.value)
    .eq('author_id', user.value?.id || '')

  if (error) {
    saveError.value = error.message || 'Could not save.'
    isSaving.value = false
    return
  }

  isSaving.value = false
}

function blockPreview(block) {
  if (block.type === BlockTypes.PARAGRAPH) return block.text
  if (block.type === BlockTypes.HEADING) return block.text
  if (block.type === BlockTypes.IMAGE) return block.caption || block.url
  return ''
}

function goBackToList() {
  router.push('/marginalia')
}

onMounted(() => {
  loadProjects()
})
</script>

<template>
  <section class="mx-auto max-w-[1100px] px-4 pb-16 space-y-6">
    <header class="space-y-1">
      <p class="uppercase tracking-[0.1em] text-xs opacity-70">Marginalia</p>
      <h1 class="font-serif text-3xl">New post wizard</h1>
    </header>

    <div class="steps flex items-center gap-2 text-xs uppercase tracking-[0.08em]">
      <span :class="['step', currentStep === 1 ? 'active' : '']">1. Details</span>
      <span class="divider">/</span>
      <span :class="['step', currentStep === 2 ? 'active' : '']">2. Write</span>
      <span class="divider">/</span>
      <span :class="['step', currentStep === 3 ? 'active' : '']">3. Review</span>
    </div>

    <!-- Step 1: Details -->
    <article v-if="currentStep === 1" class="card space-y-5">
      <header class="space-y-1">
        <h2 class="font-serif text-xl">Step 1: Details / Utilities</h2>
        <p class="text-sm opacity-80">Set the essentials. Author is fixed from your account.</p>
      </header>

      <div class="grid gap-4">
        <div class="grid grid-cols-3 gap-3 items-start">
          <div class="col-span-2 space-y-1">
            <label for="title" class="field-label">Title</label>
            <input
              id="title"
              v-model="metadata.title"
              class="input"
              :disabled="metadataLocked"
              placeholder="Title for this post"
            />
          </div>
          <div class="space-y-1">
            <label class="field-label">Author</label>
            <input class="input" :value="authorDisplay" disabled />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 items-start">
          <div class="space-y-1">
            <label for="slug" class="field-label">Slug</label>
            <input
              id="slug"
              v-model="metadata.slug"
              class="input"
              :disabled="metadataLocked"
              @input="slugEditedManually = true"
              placeholder="my-new-post"
            />
          </div>
          <div class="space-y-1">
            <label for="date" class="field-label">Date</label>
            <input
              id="date"
              type="date"
              v-model="metadata.date"
              class="input"
              :disabled="metadataLocked"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 items-start">
          <div class="space-y-1">
            <label for="type" class="field-label">Type</label>
            <select id="type" v-model="metadata.type" class="input" :disabled="metadataLocked">
              <option value="essay">Essay</option>
              <option value="logbook">Logbook</option>
              <option value="ai-recap">AI Recap</option>
              <option value="note">Note</option>
            </select>
          </div>
          <div class="space-y-1">
            <label for="category" class="field-label">Category</label>
            <input
              id="category"
              v-model="metadata.category"
              class="input"
              :disabled="metadataLocked"
              placeholder="city-planning"
            />
          </div>
          <div class="space-y-1">
            <label for="project" class="field-label">Project</label>
            <select id="project" v-model="metadata.project_id" class="input" :disabled="metadataLocked">
              <option value="">None</option>
              <option v-for="proj in projects" :key="proj.id" :value="proj.id">
                {{ proj.title }}
              </option>
            </select>
          </div>
        </div>

        <div class="space-y-1">
          <label for="summary" class="field-label">Summary (optional)</label>
          <textarea
            id="summary"
            v-model="metadata.summary"
            class="input"
            rows="2"
            :disabled="metadataLocked"
            placeholder="A short abstract for this post."
          />
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="text-sm text-red-500" v-if="stepError">{{ stepError }}</div>
        <div class="flex items-center gap-2">
          <button class="ghost-button" type="button" @click="goBackToList">Cancel</button>
          <button class="button" type="button" :disabled="isSaving" @click="handleStepOneNext">
            {{ isSaving ? 'Saving...' : 'Next: Content' }}
          </button>
        </div>
      </div>
    </article>

    <!-- Step 2: Editor -->
    <article v-else-if="currentStep === 2" class="card space-y-5">
      <header class="space-y-1">
        <h2 class="font-serif text-xl">Step 2: Write</h2>
        <p class="text-sm opacity-80">Blocks are saved to the draft; details are locked.</p>
        <div class="locked-meta">
          <div>
            <p class="text-sm opacity-70 uppercase tracking-[0.08em]">Title</p>
            <p class="font-serif text-xl">{{ metadata.title }}</p>
          </div>
          <div>
            <p class="text-sm opacity-70 uppercase tracking-[0.08em]">Author</p>
            <p>{{ authorDisplay }}</p>
          </div>
          <div>
            <p class="text-sm opacity-70 uppercase tracking-[0.08em]">Date</p>
            <p>{{ metadata.date }}</p>
          </div>
          <div>
            <p class="text-sm opacity-70 uppercase tracking-[0.08em]">Type / Category</p>
            <p>{{ metadata.type }} <span v-if="metadata.category">- {{ metadata.category }}</span></p>
          </div>
        </div>
      </header>

      <div class="space-y-3">
        <h3 class="section-heading">Content blocks</h3>
        <div class="space-y-4">
          <div v-for="(block, index) in contentBlocks" :key="block.id" class="block-editor">
            <div class="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.08em]">
              <span class="opacity-70">{{ block.type }}</span>
              <div class="flex items-center gap-2">
                <button class="mini-button" type="button" @click="moveBlock(index, -1)">↑</button>
                <button class="mini-button" type="button" @click="moveBlock(index, 1)">↓</button>
                <button class="mini-button danger" type="button" @click="removeBlock(index)">Delete</button>
              </div>
            </div>

            <div v-if="block.type === BlockTypes.HEADING" class="space-y-2">
              <select v-model="block.level" class="input">
                <option :value="1">H1</option>
                <option :value="2">H2</option>
                <option :value="3">H3</option>
              </select>
              <textarea v-model="block.text" class="input" rows="2" placeholder="Heading text" />
            </div>

            <div v-else-if="block.type === BlockTypes.PARAGRAPH">
              <textarea v-model="block.text" class="input" rows="4" placeholder="Paragraph text" />
            </div>

            <div v-else-if="block.type === BlockTypes.IMAGE" class="grid gap-2">
              <input v-model="block.url" class="input" placeholder="Image URL" />
              <input v-model="block.alt" class="input" placeholder="Alt text" />
              <input v-model="block.caption" class="input" placeholder="Caption" />
              <select v-model="block.layout" class="input">
                <option value="full">Full width</option>
                <option value="float-left">Float left</option>
                <option value="float-right">Float right</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button class="mini-button" type="button" @click="addBlock(BlockTypes.PARAGRAPH)">Add paragraph</button>
          <button class="mini-button" type="button" @click="addBlock(BlockTypes.HEADING)">Add heading</button>
          <button class="mini-button" type="button" @click="addBlock(BlockTypes.IMAGE)">Add image</button>
        </div>
      </div>

      <div class="space-y-2">
        <label class="field-label" for="summary2">Summary</label>
        <textarea id="summary2" v-model="metadata.summary" class="input" rows="2" placeholder="Optional summary" />
      </div>

      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="text-sm text-red-500" v-if="saveError">{{ saveError }}</div>
        <div class="flex items-center gap-2">
          <button class="ghost-button" type="button" @click="goBackToList">Cancel</button>
          <button class="button" type="button" :disabled="isSaving" @click="saveContentBlocks">
            {{ isSaving ? 'Saving...' : 'Save draft' }}
          </button>
          <button class="button" type="button" :disabled="isSaving" @click="goToReview">
            Next: Review
          </button>
        </div>
      </div>
    </article>

    <!-- Step 3: Review & Publish -->
    <article v-else class="card space-y-5">
      <header class="space-y-1">
        <h2 class="font-serif text-xl">Step 3: Review & Publish</h2>
        <p class="text-sm opacity-80">Preview your post and publish when ready.</p>
      </header>

      <div class="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div class="space-y-4">
          <div class="space-y-1">
            <p class="uppercase tracking-[0.08em] text-xs opacity-70">Title</p>
            <h1 class="font-serif text-3xl leading-tight">{{ metadata.title }}</h1>
          </div>
          <p class="text-sm opacity-80">
            By {{ authorDisplay }} - {{ metadata.date }} - {{ metadata.type }}<span v-if="metadata.category"> / {{ metadata.category }}</span>
          </p>
          <p v-if="metadata.project_id" class="text-sm opacity-80">
            Project:
            <span class="underline">
              {{ projects.find(p => p.id === metadata.project_id)?.title || 'Project' }}
            </span>
          </p>
          <p v-if="metadata.summary" class="text-[15px] leading-7 opacity-90">{{ metadata.summary }}</p>

          <div class="space-y-6">
            <template v-for="block in contentBlocks" :key="block.id">
              <component :is="'div'">
                <h1 v-if="block.type === BlockTypes.HEADING && block.level === 1" class="font-serif text-3xl leading-tight">
                  {{ block.text }}
                </h1>
                <h2 v-else-if="block.type === BlockTypes.HEADING && block.level === 2" class="font-serif text-2xl leading-tight">
                  {{ block.text }}
                </h2>
                <h3 v-else-if="block.type === BlockTypes.HEADING && block.level === 3" class="font-serif text-xl leading-tight">
                  {{ block.text }}
                </h3>
                <p v-else-if="block.type === BlockTypes.PARAGRAPH" class="text-[15px] leading-7 opacity-90">
                  {{ block.text }}
                </p>
                <figure
                  v-else-if="block.type === BlockTypes.IMAGE"
                  :class="['image-block', block.layout]"
                >
                  <div class="image-frame" v-if="block.url">
                    <img :src="block.url" :alt="block.alt || ''" class="w-full" />
                  </div>
                  <figcaption class="text-sm opacity-80" v-if="block.caption">{{ block.caption }}</figcaption>
                </figure>
              </component>
            </template>
          </div>
        </div>

        <aside class="space-y-4">
          <div class="space-y-2">
            <label class="field-label inline-flex items-center gap-2">
              <input type="checkbox" v-model="isPublished" />
              <span>Publish now</span>
            </label>
            <p class="text-xs opacity-70">Leave unchecked to keep this as a draft.</p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button class="button" type="button" :disabled="isSaving" @click="handlePublishSave">
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
            <button class="ghost-button" type="button" @click="goBackToList">Back to marginalia</button>
            <RouterLink
              v-if="isPublished"
              class="underline text-sm opacity-80 hover:opacity-100"
              :to="`/marginalia/${metadata.slug}`"
            >
              View live page
            </RouterLink>
          </div>

          <p v-if="saveError" class="text-sm text-red-500">{{ saveError }}</p>
        </aside>
      </div>
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
.input {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.02);
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
.ghost-button {
  padding: 0.55rem 1rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  text-decoration: underline;
}
.field-label {
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.8;
}
.steps .step {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
}
.steps .step.active {
  background: rgba(0, 0, 0, 0.1);
}
.steps .divider {
  opacity: 0.5;
}
.locked-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
}
.block-editor {
  padding: 0.9rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.01);
}
.mini-button {
  padding: 0.3rem 0.6rem;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.02);
  font-size: 0.8rem;
}
.mini-button:hover { background: rgba(0, 0, 0, 0.06); }
.mini-button.danger {
  border-color: rgba(180, 60, 60, 0.6);
  color: #b23b3b;
}
.section-heading {
  font-family: var(--font-serif, Georgia, 'Times New Roman', serif);
  font-size: 1.15rem;
}
.image-block {
  display: grid;
  gap: 0.35rem;
}
.image-block.full img { width: 100%; }
.image-block.float-left img { float: left; margin: 0 12px 12px 0; max-width: 60%; }
.image-block.float-right img { float: right; margin: 0 0 12px 12px; max-width: 60%; }
.image-frame {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}
</style>
