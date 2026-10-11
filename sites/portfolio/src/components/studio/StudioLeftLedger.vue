<script setup lang="ts">
import { formatDate } from '@/lib/dates'

defineProps<{
  entries: any[]
  loading?: boolean
  error?: string
}>()
</script>

<template>
  <div class="ledger">
    <h3 class="ledger-heading">Marginalia Ledger</h3>
    <div v-if="loading" class="muted">Fetching the latest entries…</div>
    <div v-else-if="error" class="muted">The ledger is unavailable right now. Please check back shortly.</div>
    <div v-else-if="entries.length === 0" class="muted">No entries yet.</div>
    <RouterLink
      v-for="entry in entries"
      :key="entry.id"
      :to="`/marginalia/${entry.slug}`"
      class="item-link"
    >
      <div class="item-meta">
        <span class="pill">{{ entry.type }}</span>
        <span>{{ formatDate(entry.date) }}</span>
      </div>
      <h4 class="item-title">{{ entry.title }}</h4>
      <p class="item-blurb">{{ entry.summary }}</p>
      <div class="divider">• • •</div>
    </RouterLink>
  </div>
</template>

<style scoped>
.ledger-heading {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.28);
  padding-bottom: 0.2rem;
  margin-bottom: 0.6rem;
}
.item-link {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: 0.25rem 0 0.6rem;
}
.item-link:hover .item-title {
  text-decoration: underline;
}
.item-meta {
  display: flex;
  gap: 0.45rem;
  align-items: center;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.75;
}
.pill {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(0, 0, 0, 0.06);
}
.item-title {
  font-family: var(--font-serif, Georgia, 'Times New Roman', serif);
  font-size: 1.05rem;
  margin: 0.15rem 0;
}
.item-blurb {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.85;
}
.divider {
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  opacity: 0.6;
  margin-top: 0.35rem;
}
.muted {
  opacity: 0.65;
  font-size: 0.9rem;
}
</style>
