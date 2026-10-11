<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import Frame from '@/components/layout/Frame.vue'
import StudioLeftLedger from '@/components/studio/StudioLeftLedger.vue'
import StudioFeaturedProject from '@/components/studio/StudioFeaturedProject.vue'
import StudioAuxiliaryProjects from '@/components/studio/StudioAuxiliaryProjects.vue'
import StudioRightHighlights from '@/components/studio/StudioRightHighlights.vue'
import { projects as projectCatalog } from '@/data/projects'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

const curatedProjects = projectCatalog.slice(0, 3)
const recentMarginalia = ref<any[]>([])
// Only the ledger depends on Supabase; the project columns render from local data immediately.
const ledgerLoading = ref(true)
const ledgerError = ref('')
const { user } = useSupabaseAuth()
let retryTimer: ReturnType<typeof setTimeout> | null = null
let attempts = 0
let disposed = false
const MAX_ATTEMPTS = 3
const RETRY_DELAY = 2500
const FETCH_TIMEOUT = 8000

const featuredProjects = computed(() => curatedProjects)
const primaryFeatured = computed(() => curatedProjects[0] || null)
const auxiliaryFeatured = computed(() => curatedProjects.slice(1, 3))

async function loadLedger() {
  attempts += 1
  ledgerLoading.value = true
  ledgerError.value = ''
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const slowLogTimer = setTimeout(() => {
    if (ledgerLoading.value) {
      console.warn('Marginalia ledger still pending after 5s; user:', user.value)
    }
  }, 5000)

  try {
    const fetchMarginalia = supabase
      .from('marginalia_entries')
      .select('*')
      .eq('is_published', true)
      .order('date', { ascending: false })
      .limit(5)

    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('timeout')), FETCH_TIMEOUT)
    })
    const { data, error } = await Promise.race([fetchMarginalia, timeout])
    if (error) throw error

    recentMarginalia.value = data || []
    ledgerLoading.value = false
  } catch (err: any) {
    console.error(`Marginalia ledger load failed (attempt ${attempts}/${MAX_ATTEMPTS}) [StudioHome]:`, err)
    if (disposed) return
    if (attempts < MAX_ATTEMPTS) {
      // Back off a little more each time (2.5s, 5s) before giving up.
      retryTimer = setTimeout(loadLedger, RETRY_DELAY * attempts)
    } else {
      ledgerError.value = err?.message || 'Failed to load entries.'
      ledgerLoading.value = false
    }
  } finally {
    clearTimeout(timeoutId)
    clearTimeout(slowLogTimer)
  }
}

onMounted(loadLedger)

onBeforeUnmount(() => {
  disposed = true
  if (retryTimer) clearTimeout(retryTimer)
})
</script>

<template>
  <main class="studio-page">
    <div class="content-width page-stack">
      <div class="studio-body-grid">
        <Frame id="col-left" configKey="column-frame" class="column-frame">
          <div class="column-content">
            <div class="column-body">
              <StudioLeftLedger :entries="recentMarginalia" :loading="ledgerLoading" :error="ledgerError" />
            </div>
          </div>
        </Frame>

        <Frame id="col-center" configKey="column-frame" class="column-frame">
          <div class="column-content">
            <div class="column-body studio-center-column">
              <StudioFeaturedProject :project="primaryFeatured" />
              <StudioAuxiliaryProjects :projects="auxiliaryFeatured" />
            </div>
          </div>
        </Frame>

        <Frame id="col-right" configKey="column-frame" class="column-frame">
          <div class="column-content">
            <div class="column-body">
              <StudioRightHighlights :projects="featuredProjects" />
            </div>
          </div>
        </Frame>
      </div>
    </div>
  </main>
</template>

<style scoped>
.studio-page {
  width: 100%;
  min-height: 100vh;
}
.studio-body-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--gutter);
  align-items: stretch;
  min-height: calc(100vh - var(--masthead-height, 200px));
}
.column-frame {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.column-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--gutter);
  box-sizing: border-box;
}
.column-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: calc(var(--gutter) * 0.75);
}
.studio-center-column {
  display: flex;
  flex-direction: column;
  gap: var(--gutter);
  flex: 1;
  min-height: 0;
}
@media (max-width: 980px) {
  .studio-body-grid {
    grid-template-columns: 1fr;
    gap: calc(var(--gutter) * 0.8);
    height: auto;
    min-height: auto;
  }
}
</style>
