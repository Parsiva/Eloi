import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

type Profile = {
  id: string
  username: string | null
  can_manage_projects: boolean
  created_at?: string | null
}

const user = ref<User | null>(null)
const profile = ref<Profile | null>(null)
const isLoading = ref(true)
const isAuthReady = ref(false)

let initialized = false
let initPromise: Promise<void> | null = null

async function ensureProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  profile.value = data as Profile
  return profile.value
}

async function refreshProfile() {
  if (!user.value) {
    profile.value = null
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .maybeSingle()

  if (error) {
    // If the profile row does not exist yet, create it.
    if ((error as any).code === 'PGRST116') {
      return ensureProfile(user.value.id)
    }
    console.error('Failed to load profile', error)
    profile.value = null
    return null
  }

  if (!data) {
    return ensureProfile(user.value.id)
  }

  profile.value = data as Profile
  return profile.value
}

function init() {
  if (initialized) return initPromise
  initialized = true

  initPromise = (async () => {
    isLoading.value = true
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    if (user.value) {
      await refreshProfile()
    } else {
      profile.value = null
    }
    isAuthReady.value = true
    isLoading.value = false
  })()

  supabase.auth.onAuthStateChange(async (_event, session) => {
    user.value = session?.user ?? null
    if (session?.user) {
      isLoading.value = true
      try {
        await refreshProfile()
      } finally {
        isLoading.value = false
      }
    } else {
      profile.value = null
    }
  })

  return initPromise
}

async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  user.value = data.user ?? data.session?.user ?? null
  if (user.value) {
    await ensureProfile(user.value.id)
  }
  await refreshProfile()
  return data
}

async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  user.value = data.session?.user ?? null
  await refreshProfile()
  return data
}

async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  user.value = null
  profile.value = null
}

async function waitForAuthReady() {
  await init()
  if (initPromise) await initPromise
  return { user: user.value, profile: profile.value }
}

export function useSupabaseAuth() {
  init()

  return {
    user,
    profile,
    isLoading,
    isAuthReady,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    waitForAuthReady,
  }
}
