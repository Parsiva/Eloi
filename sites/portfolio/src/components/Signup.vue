<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Frame from '@/components/layout/Frame.vue'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const router = useRouter()
const { signUp } = useSupabaseAuth()

async function handleSubmit(e: Event) {
  e.preventDefault()
  loading.value = true
  errorMessage.value = ''
  try {
    await signUp(email.value, password.value)
    router.push('/account')
  } catch (err: any) {
    errorMessage.value = err?.message || 'Sign up failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="content-width page-stack">
    <Frame configKey="panel-frame" class="form-panel">
      <h1 class="lede-title">Sign up</h1>
      <p class="lede-subtitle">Create an account to save drafts and publish from the studio.</p>

      <form class="form-stack" @submit="handleSubmit">
        <label class="form-label" for="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          class="form-control"
          v-model="email"
          placeholder="you@example.com"
        />

        <label class="form-label" for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          class="form-control"
          v-model="password"
          placeholder="Create a password"
        />

        <button type="submit" class="btn" :disabled="loading">
          {{ loading ? 'Signing up...' : 'Sign up' }}
        </button>
      </form>

      <p v-if="errorMessage" class="text-error">{{ errorMessage }}</p>
      <p class="helper-text">
        Already have an account?
        <RouterLink class="link-inline" to="/login">Log in</RouterLink>.
      </p>
    </Frame>
  </div>
</template>

<style scoped>
.form-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 520px;
}
.form-stack {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.link-inline {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.helper-text {
  font-size: 0.9rem;
  opacity: 0.78;
  margin: 0;
}
.text-error {
  color: color-mix(in srgb, #a1271f 90%, var(--ink) 10%);
  margin: 0;
}
</style>
