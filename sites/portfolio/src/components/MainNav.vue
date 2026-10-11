<template>
  <nav class="flex flex-wrap items-center justify-center md:justify-between gap-2 border-t border-black/10 font-sans text-[14px] tracking-[.04em] py-2 px-4 max-w-[1120px] mx-auto">
    <div class="flex flex-wrap items-center justify-center gap-2">
      <template v-for="(link, i) in navLinks" :key="link.label + i">
        <RouterLink
          v-if="link.to"
          :to="link.to"
          :aria-current="isActive(link) ? 'page' : null"
          class="px-2 py-1 hover:bg-black/5 text-xl"
          :class="isActive(link) ? 'border-b-2 border-black/70' : ''"
        >
          {{ link.label }}
        </RouterLink>
        <button
          v-else-if="link.action === 'signout'"
          type="button"
          class="px-2 py-1 hover:bg-black/5 text-xl"
          @click="handleSignOut"
        >
          {{ link.label }}
        </button>
        <span v-if="i < navLinks.length - 1" class="h-5 w-px bg-black/10" />
      </template>
    </div>

    <slot name="right" />
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

const route = useRoute()
const router = useRouter()
const { user, profile, signOut } = useSupabaseAuth()

const props = defineProps({
  links: {
    type: Array,
    default: () => ([
      { to: '/', label: 'Studio' },
      { to: '/projects', label: 'Projects' },
      { to: '/marginalia', label: 'Marginalia' },
      { to: '/newsletter', label: 'Newsletter' },
      { to: '/about', label: 'About' },
    ])
  }
})

const navLinks = computed(() => {
  const items = [...props.links]

  if (profile.value?.can_manage_projects || user.value) {
    items.push({ to: '/admin', label: 'Admin Dashboard' })
  }

  items.push({ to: user.value ? '/account' : '/login', label: user.value ? 'Account' : 'Login' })

  if (user.value) {
    items.push({ action: 'signout', label: 'Sign out' })
  }

  return items
})

function isActive(link) {
  if (!link.to) return false
  if (link.to === '/') return route.path === '/'
  return route.path === link.to || route.path.startsWith(link.to)
}

async function handleSignOut() {
  try {
    await signOut()
    router.push('/')
  } catch (err) {
    console.error(err)
  }
}
</script>
