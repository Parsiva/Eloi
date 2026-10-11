<script setup lang="ts">
defineProps<{
  projects: any[]
}>()
</script>

<template>
  <div class="highlights">
    <h3 class="highlights-heading">Highlights & Dispatches</h3>
    <div v-if="projects.length === 0" class="muted">No highlights yet.</div>
    <RouterLink v-for="project in projects" :key="project.slug" :to="`/projects/${project.slug}`" class="highlight-card">
      <div class="item-meta">
        <span class="pill">Project</span>
        <span class="open-glyph" aria-hidden="true">↗</span>
      </div>
      <h4 class="item-title">{{ project.title }}</h4>
      <p class="item-blurb">{{ project.tagline }}</p>
      <p class="item-mini" v-if="project.highlights?.length">{{ project.highlights[0] }}</p>
    </RouterLink>
    <div class="newsletter">
      <h4 class="newsletter-title">Newsletter</h4>
      <p class="item-blurb">Dispatches with updates, essays, and experiments.</p>
      <RouterLink to="/newsletter" class="newsletter-link">Join the ledger</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.highlights-heading {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.28);
  padding-bottom: 0.2rem;
  margin-bottom: 0.6rem;
}
.highlight-card {
  display: block;
  padding: 0.4rem 0 0.6rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  color: inherit;
  text-decoration: none;
  transition: transform 120ms ease, color 120ms ease;
}
.highlight-card:hover,
.highlight-card:focus-visible {
  transform: translateY(-1px);
  color: inherit;
  outline: none;
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
.open-glyph {
  font-size: 0.8rem;
  opacity: 0.8;
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
.item-mini {
  margin: 0.15rem 0 0;
  font-size: 0.86rem;
  opacity: 0.8;
  line-height: 1.4;
}
.newsletter {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
}
.newsletter-title {
  font-size: 1rem;
  margin: 0 0 0.2rem;
}
.newsletter-link {
  text-decoration: none;
  color: #2c2419;
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
}
.newsletter-link:hover {
  border-color: rgba(0, 0, 0, 0.5);
}
.muted {
  opacity: 0.65;
  font-size: 0.9rem;
}
</style>
