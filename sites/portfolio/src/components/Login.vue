<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Frame from '@/components/layout/Frame.vue'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const route = useRoute()
const router = useRouter()
const { signIn } = useSupabaseAuth()

async function handleSubmit(e: Event) {
  e.preventDefault()
  loading.value = true
  errorMessage.value = ''
  try {
    await signIn(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'
    router.push(redirect)
  } catch (err: any) {
    errorMessage.value = err?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="content-width page-stack">
    <Frame configKey="panel-frame" class="form-panel">
      <h1 class="lede-title">Login</h1>
      <p class="lede-subtitle">Sign in to manage your marginalia or projects.</p>

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
          placeholder="********"
        />

        <button type="submit" class="btn" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p v-if="errorMessage" class="text-error">{{ errorMessage }}</p>
      <p class="helper-text">
        Don't have an account?
        <RouterLink class="link-inline" to="/signup">Sign up</RouterLink>.
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
