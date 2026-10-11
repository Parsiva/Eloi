<script setup lang="ts">
defineProps<{
  project: any | null
}>()
</script>

<template>
  <div class="feature">
    <h3 class="feature-heading">Featured Project</h3>
    <div v-if="!project" class="muted">No featured project available.</div>
    <RouterLink v-else :to="`/projects/${project.slug}`" class="feature-card">
      <div class="card-top">
        <span class="pill">Dossier</span>
        <span class="open-glyph" aria-hidden="true">↗</span>
      </div>
      <h4 class="item-title">{{ project.title }}</h4>
      <p class="item-tagline">{{ project.tagline }}</p>
      <p class="item-blurb" v-if="project.highlights?.length">{{ project.highlights[0] }}</p>
      <div class="stack-row" v-if="project.stack?.length">
        <span v-for="tech in project.stack.slice(0, 3)" :key="tech" class="stack-chip">{{ tech }}</span>
      </div>
    </RouterLink>
  </div>
</template>

<style scoped>
.feature-heading {
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.28);
  padding-bottom: 0.2rem;
  margin-bottom: 0.6rem;
}
.feature-card {
  display: block;
  text-decoration: none;
  color: inherit;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 0.6rem 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  transition: transform 140ms ease, box-shadow 160ms ease, border-color 140ms ease;
}
.feature-card:hover,
.feature-card:focus-visible {
  border-color: rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
  outline: none;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.open-glyph {
  font-size: 0.85rem;
  opacity: 0.8;
}
.item-title {
  font-family: var(--font-serif, Georgia, 'Times New Roman', serif);
  font-size: 1.3rem;
  margin: 0.2rem 0;
}
.item-tagline {
  margin: 0;
  opacity: 0.88;
  font-size: 0.98rem;
}
.item-blurb {
  margin: 0.35rem 0 0;
  font-size: 0.94rem;
  opacity: 0.9;
  line-height: 1.45;
}
.stack-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.4rem;
}
.stack-chip {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.04);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}
.pill {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(0, 0, 0, 0.06);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
}
.muted {
  opacity: 0.65;
  font-size: 0.9rem;
}
</style>
