<script setup lang="ts">
import { watch, ref } from 'vue'

interface Props {
  modelValue: string
  label: string
  type?: 'text' | 'textarea'
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'close'): void
}>()

const localValue = ref(props.modelValue)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      localValue.value = props.modelValue
    }
  }
)

function handleSave() {
  emit('update:modelValue', localValue.value)
  emit('close')
}

function handleCancel() {
  emit('close')
}
</script>

<template>
  <div v-if="visible" class="modal-backdrop" @click.self="handleCancel">
    <div class="modal-panel">
      <h2 class="modal-title">Edit {{ label }}</h2>

      <div class="modal-body">
        <input
          v-if="type !== 'textarea'"
          v-model="localValue"
          type="text"
          class="modal-input"
        />
        <textarea
          v-else
          v-model="localValue"
          class="modal-textarea"
          rows="4"
        ></textarea>
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" type="button" @click="handleCancel">Cancel</button>
        <button class="btn-primary" type="button" @click="handleSave">Save ✓</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 4rem;
  z-index: 999;
}
.modal-panel {
  background: #faf8f0;
  border-radius: 6px;
  padding: 1.5rem;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(0, 0, 0, 0.18);
}
.modal-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.modal-body {
  display: grid;
  gap: 0.75rem;
}
.modal-input,
.modal-textarea {
  width: 100%;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
  font-family: inherit;
  font-size: 0.95rem;
  background: #fff;
}
.modal-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
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
