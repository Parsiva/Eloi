<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import Frame from '@/components/layout/Frame.vue'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

const router = useRouter()
const { user, profile, refreshProfile, signOut, isLoading, isAuthReady } = useSupabaseAuth()

const saving = ref(false)
const saveMessage = ref('')
const errorMessage = ref('')

const isReady = computed(() => isAuthReady.value && !isLoading.value)

watch(
  () => [isAuthReady.value, user.value],
  ([ready, currentUser]) => {
    if (ready && !currentUser) {
      router.push({ path: '/login', query: { redirect: '/account' } })
    }
  },
  { immediate: true }
)

async function handleSave(e: Event) {
  e.preventDefault()
  if (!user.value || !profile.value) return
  saving.value = true
  saveMessage.value = ''
  errorMessage.value = ''

  const { error } = await supabase
    .from('profiles')
    .update({
      username: profile.value.username,
      can_manage_projects: !!profile.value.can_manage_projects,
    })
    .eq('id', user.value.id)

  if (error) {
    errorMessage.value = error.message
  } else {
    saveMessage.value = 'Profile updated'
    await refreshProfile()
  }
  saving.value = false
}

async function handleSignOut() {
  await signOut()
  router.push('/')
}
</script>

<template>
  <div class="content-width page-stack">
    <Frame configKey="panel-frame" class="account-panel">
      <header class="account-heading">
        <p class="lede-eyebrow">Account</p>
        <h1 class="lede-title">Profile & permissions</h1>
      </header>

      <p v-if="!isReady" class="center-note">Loading account...</p>
      <p v-else-if="!user" class="helper-text">
        You need to log in to view this page.
        <RouterLink class="link-inline" to="/login">Go to login</RouterLink>.
      </p>

      <form v-else-if="profile" class="form-stack" @submit="handleSave">
        <div class="field">
          <label class="form-label" for="email">Email</label>
          <input id="email" class="form-control" type="email" :value="user.email" readonly />
        </div>

        <div class="field">
          <label class="form-label" for="username">Username</label>
          <input id="username" class="form-control" v-model="profile.username" placeholder="your-handle" />
        </div>

        <label class="checkbox">
          <input type="checkbox" v-model="profile.can_manage_projects" />
          <span>Can manage projects</span>
        </label>

        <div class="actions">
          <button class="btn" type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save changes' }}
          </button>
          <span v-if="saveMessage" class="helper-text">{{ saveMessage }}</span>
          <span v-if="errorMessage" class="text-error">{{ errorMessage }}</span>
        </div>

        <button type="button" class="link-inline sign-out" @click="handleSignOut">
          Sign out
        </button>
      </form>

      <p v-else class="helper-text">Profile could not be loaded right now.</p>
    </Frame>
  </div>
</template>

<style scoped>
.account-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 620px;
}
.account-heading {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.form-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.95rem;
}
.checkbox input {
  accent-color: color-mix(in srgb, var(--ink) 80%, transparent);
}
.actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.link-inline {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.sign-out {
  text-align: left;
  padding: 0;
  background: none;
  border: none;
}
.helper-text {
  font-size: 0.9rem;
  opacity: 0.78;
  margin: 0;
}
.text-error {
  color: color-mix(in srgb, #a1271f 90%, var(--ink) 10%);
}
.center-note {
  text-align: center;
  opacity: 0.76;
}
</style>
