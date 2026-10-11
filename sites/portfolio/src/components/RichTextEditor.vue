<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Heading from '@tiptap/extension-heading'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'word-count', value: number): void
}>()

const fontSize = ref<'12' | '14' | '18'>('14')
const editor = ref<Editor | null>(null)
const wordCount = ref(0)

function updateWordCount(html: string) {
  const text = editor.value?.getText() || ''
  const count = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
  wordCount.value = count
  emit('word-count', count)
  emit('update:modelValue', html)
}

editor.value = new Editor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({ openOnClick: false }),
    Image,
    Heading.configure({ levels: [1, 2, 3] }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ],
  content: props.modelValue || '',
  onUpdate({ editor }) {
    const html = editor.getHTML()
    if (html !== props.modelValue) {
      updateWordCount(html)
    }
  },
  editorProps: {
    attributes: {
      class: 'pp-editor-prose',
      placeholder: props.placeholder || 'Start typing...',
    },
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (!editor.value) return
    const current = editor.value.getHTML()
    if (val !== current) {
      editor.value.commands.setContent(val || '', false)
      updateWordCount(val || '')
    }
  }
)

function setParagraph() {
  editor.value?.chain().focus().setParagraph().run()
}
function setHeading(level: number) {
  editor.value?.chain().focus().toggleHeading({ level }).run()
}
function toggleBold() {
  editor.value?.chain().focus().toggleBold().run()
}
function toggleItalic() {
  editor.value?.chain().focus().toggleItalic().run()
}
function toggleUnderline() {
  editor.value?.chain().focus().toggleUnderline().run()
}
function toggleBulletList() {
  editor.value?.chain().focus().toggleBulletList().run()
}
function toggleOrderedList() {
  editor.value?.chain().focus().toggleOrderedList().run()
}
function setAlign(value: 'left' | 'center' | 'right') {
  editor.value?.chain().focus().setTextAlign(value).run()
}
function setLink() {
  const url = window.prompt('Link URL', 'https://')
  if (url) {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  } else {
    editor.value?.chain().focus().unsetLink().run()
  }
}
function addImage() {
  const url = window.prompt('Image URL')
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run()
  }
}
function undo() {
  editor.value?.chain().focus().undo().run()
}
function redo() {
  editor.value?.chain().focus().redo().run()
}

const surfaceClass = computed(() => ({
  'pp-font-12': fontSize.value === '12',
  'pp-font-14': fontSize.value === '14',
  'pp-font-18': fontSize.value === '18',
}))

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="pp-editor">
    <div class="pp-editor-toolbar">
      <div class="toolbar-group">
        <label class="toolbar-label">Font</label>
        <select v-model="fontSize" class="toolbar-select">
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="18">18</option>
        </select>
      </div>

      <div class="toolbar-group">
        <label class="toolbar-label">Block</label>
        <select class="toolbar-select" @change="(e: Event) => {
          const value = (e.target as HTMLSelectElement).value
          if (value === 'p') setParagraph()
          if (value === 'h2') setHeading(2)
          if (value === 'h3') setHeading(3)
        }">
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>

      <div class="toolbar-group">
        <button type="button" class="toolbar-button" @click="toggleBold">Bold</button>
        <button type="button" class="toolbar-button" @click="toggleItalic">Italic</button>
        <button type="button" class="toolbar-button" @click="toggleUnderline">Underline</button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="toolbar-button" @click="toggleBulletList">Bullets</button>
        <button type="button" class="toolbar-button" @click="toggleOrderedList">Numbers</button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="toolbar-button" @click="() => setAlign('left')">Left</button>
        <button type="button" class="toolbar-button" @click="() => setAlign('center')">Center</button>
        <button type="button" class="toolbar-button" @click="() => setAlign('right')">Right</button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="toolbar-button" @click="setLink">Link</button>
        <button type="button" class="toolbar-button" @click="addImage">Image</button>
      </div>

      <div class="toolbar-group">
        <button type="button" class="toolbar-button" @click="undo">Undo</button>
        <button type="button" class="toolbar-button" @click="redo">Redo</button>
      </div>
    </div>

    <div class="pp-editor-surface" :class="surfaceClass">
      <EditorContent :editor="editor" />
    </div>

    <div class="pp-editor-footer">
      <div class="pp-editor-footer-left" />
      <div class="pp-editor-footer-right">
        <span class="pp-editor-wordcount">{{ wordCount }} words</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pp-editor {
  display: grid;
  gap: 8px;
}
.pp-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px;
  background: #f7f7f7;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
}
.toolbar-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.toolbar-label {
  font-size: 12px;
  color: #555;
}
.toolbar-select {
  padding: 4px 6px;
  border: 1px solid #c6c6c6;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
}
.toolbar-button {
  padding: 4px 8px;
  border: 1px solid #c6c6c6;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}
.toolbar-button:hover {
  background: #ececec;
}
.pp-editor-surface {
  min-height: 320px;
  padding: 12px;
  background: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
}
.pp-editor-surface:focus-within {
  border-color: #999;
}
.pp-editor-surface :deep(.ProseMirror) {
  outline: none;
}
.pp-font-12 :deep(.ProseMirror) { font-size: 12px; }
.pp-font-14 :deep(.ProseMirror) { font-size: 14px; }
.pp-font-18 :deep(.ProseMirror) { font-size: 18px; }

.pp-editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px;
  border-top: 1px solid #e4e4e4;
  font-size: 12px;
  color: #555;
}
.pp-editor-wordcount {
  opacity: 0.8;
}
</style>
