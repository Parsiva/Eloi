<script setup lang="ts">
defineProps<{
  projects: any[]
}>()
</script>

<template>
  <div class="aux">
    <h3 class="aux-heading">Additional Projects</h3>
    <div v-if="projects.length === 0" class="muted">No additional projects.</div>
    <div class="aux-grid">
      <RouterLink
        v-for="project in projects"
        :key="project.slug"
        :to="`/projects/${project.slug}`"
        class="aux-card"
      >
        <div class="card-top">
          <span class="pill">Open</span>
          <span class="open-glyph" aria-hidden="true">↗</span>
        </div>
        <h4 class="item-title">{{ project.title }}</h4>
        <p class="item-blurb">{{ project.tagline }}</p>
        <div class="stack-row" v-if="project.stack?.length">
          <span v-for="tech in project.stack.slice(0, 2)" :key="tech" class="stack-chip">{{ tech }}</span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.aux-heading {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.28);
  padding-bottom: 0.2rem;
  margin-bottom: 0.6rem;
}
.aux-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}
.aux-card {
  display: block;
  padding: 0.55rem 0.6rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
  background: rgba(0, 0, 0, 0.02);
  transition: border 120ms ease, transform 120ms ease, box-shadow 140ms ease;
}
.aux-card:hover,
.aux-card:focus-visible {
  border-color: rgba(0, 0, 0, 0.28);
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
  outline: none;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}
.open-glyph {
  font-size: 0.8rem;
  opacity: 0.8;
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
.stack-row {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 0.35rem;
}
.stack-chip {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(0, 0, 0, 0.04);
  font-size: 0.78rem;
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
