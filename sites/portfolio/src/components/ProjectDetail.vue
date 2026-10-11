<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Frame from '@/components/layout/Frame.vue'
import FramedImage from '@/components/FramedImage.vue'
import { getProjectBySlug } from '@/data/projects'

const route = useRoute()

const slug = computed(() => route.params.slug?.toString() ?? '')
const project = computed(() => getProjectBySlug(slug.value))
const gallery = computed(() => project.value?.gallery || [])
const sections = computed(() => {
  if (!project.value) return []
  const items = [{ id: 'overview', label: 'Overview' }]
  if (project.value.longform?.length) items.push({ id: 'longform', label: 'Longform' })
  items.push({ id: 'users', label: 'Users / audience' })
  items.push({ id: 'tech', label: 'Tech / architecture' })
  if (project.value.sections?.length) items.push({ id: 'sections', label: 'Additional sections' })
  items.push({ id: 'highlights', label: 'Highlights' })
  if (project.value.nextSteps?.length) items.push({ id: 'next-steps', label: 'Next steps' })
  if (gallery.value.length) items.push({ id: 'gallery', label: 'Gallery' })
  return items
})
</script>

<template>
  <div class="content-width page-stack project-detail">
    <template v-if="project">
      <Frame configKey="panel-frame" class="project-hero">
        <div class="hero-top">
          <RouterLink to="/projects" class="back-link">Back to Projects</RouterLink>
          <div v-if="project.stack?.length" class="hero-stack">
            <span v-for="tech in project.stack" :key="tech" class="stack-chip">{{ tech }}</span>
          </div>
        </div>
        <h1 class="project-title">{{ project.title }}</h1>
        <p class="project-tagline">{{ project.tagline }}</p>
        <p class="project-users">
          <strong>Users / audience:</strong>
          <span>{{ project.users.join(' | ') }}</span>
        </p>
        <FramedImage
          class="hero-image"
          :src="project.heroImage"
          :alt="`${project.title} hero image`"
          aspect="16/9"
          :priority="true"
          :show-caption="false"
        />
      </Frame>

      <Frame configKey="panel-frame" class="project-body">
        <nav v-if="sections.length" class="project-toc" aria-label="Project sections">
          <span class="toc-label">Sections</span>
          <div class="toc-links">
            <a v-for="item in sections" :key="item.id" :href="`#${item.id}`">
              {{ item.label }}
            </a>
          </div>
        </nav>

        <div class="divider" aria-hidden="true"></div>

        <div class="reading-layout">
          <section id="overview" class="reading-section">
            <h2>What it is</h2>
            <p v-for="(para, idx) in project.body" :key="`body-${idx}`">{{ para }}</p>
          </section>

          <section v-if="project.longform?.length" id="longform" class="reading-section reading-section--longform">
            <h2>Longform</h2>
            <p v-for="(para, idx) in project.longform" :key="`long-${idx}`">{{ para }}</p>
          </section>

          <div class="meta-grid">
            <section id="users" class="project-section">
              <h2>Users / audience</h2>
              <ul>
                <li v-for="user in project.users" :key="user">{{ user }}</li>
              </ul>
            </section>

            <section id="tech" class="project-section">
              <h2>Tech / architecture</h2>
              <div class="stack-row">
                <span v-for="tech in project.stack" :key="tech" class="stack-chip">{{ tech }}</span>
              </div>
            </section>
          </div>

          <section
            v-if="project.sections?.length"
            id="sections"
            class="project-section project-section--subsections"
          >
            <div v-for="section in project.sections" :key="section.title" class="subsection">
              <h3>{{ section.title }}</h3>
              <p v-for="(para, idx) in section.paragraphs" :key="`${section.title}-${idx}`">{{ para }}</p>
            </div>
          </section>

          <section id="highlights" class="project-section">
            <h2>Highlights</h2>
            <ul class="bullet-list">
              <li v-for="item in project.highlights" :key="item">{{ item }}</li>
            </ul>
          </section>

          <section v-if="project.nextSteps?.length" id="next-steps" class="project-section">
            <h2>Next steps</h2>
            <ul class="bullet-list">
              <li v-for="item in project.nextSteps" :key="item">{{ item }}</li>
            </ul>
          </section>
        </div>

        <div v-if="gallery.length" class="gallery" id="gallery">
          <div class="gallery-header">
            <h2>Gallery</h2>
            <span class="gallery-note">Framed references</span>
          </div>
          <div class="gallery-grid">
            <FramedImage
              v-for="item in gallery"
              :key="item.src"
              :src="item.src"
              :alt="item.alt"
              :caption="item.caption"
              aspect="4/3"
              :priority="false"
            />
          </div>
        </div>
      </Frame>
    </template>

    <Frame v-else configKey="panel-frame" class="project-missing">
      <h1>Project not found</h1>
      <p>That project does not exist yet. Return to the projects shelf to browse the curated set.</p>
      <RouterLink to="/projects" class="back-link">Back to Projects</RouterLink>
    </Frame>
  </div>
</template>

<style scoped>
.project-detail {
  gap: calc(var(--gutter) * 0.9);
}
.project-hero {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.project-title {
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  font-size: 1.7rem;
  margin: 0;
}
.project-tagline {
  margin: 0;
  font-size: 1.02rem;
  opacity: 0.9;
}
.project-users {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}
.project-users strong {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.86rem;
}
.hero-stack {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.stack-row {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.stack-chip {
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--ink) 22%, transparent);
  background: color-mix(in srgb, var(--paper) 82%, #ffffff 18%);
  font-size: 0.82rem;
  letter-spacing: 0.04em;
}
.hero-image {
  margin-top: 0.3rem;
}
.project-body {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gutter) * 0.75);
}
.project-toc {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
  font-family: var(--font-sans);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.78rem;
}
.toc-links {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}
.toc-links a {
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 28%, transparent);
  padding-bottom: 0.05rem;
}
.toc-links a:hover,
.toc-links a:focus-visible {
  border-bottom-color: color-mix(in srgb, var(--ink) 48%, transparent);
}
.divider {
  position: relative;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--ink) 24%, transparent) 12%,
    color-mix(in srgb, var(--ink) 36%, transparent) 50%,
    color-mix(in srgb, var(--ink) 24%, transparent) 88%,
    transparent 100%
  );
}
.divider::after {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  width: 14px;
  height: 6px;
  background: color-mix(in srgb, var(--paper) 92%, #ffffff 8%);
  border: 1px solid color-mix(in srgb, var(--ink) 26%, transparent);
  transform: translateX(-50%);
}
.reading-layout {
  display: flex;
  flex-direction: column;
  gap: var(--gutter);
  max-width: 960px;
  margin: 0 auto;
  line-height: 1.6;
}
.reading-section h2 {
  font-size: 0.98rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin: 0 0 0.35rem 0;
}
.reading-section p {
  margin: 0 0 0.85rem 0;
  opacity: 0.92;
}
.reading-section--longform {
  padding: 0.35rem 0;
  border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--gutter);
}
.project-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.project-section h2 {
  font-size: 0.98rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin: 0;
}
.project-section ul {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.3rem;
}
.project-section--subsections {
  gap: 0.6rem;
}
.subsection h3 {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
}
.subsection p {
  margin: 0.25rem 0 0.7rem;
  opacity: 0.92;
}
.bullet-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
  display: grid;
  gap: 0.35rem;
}
.bullet-list li {
  padding-left: 1.1rem;
  position: relative;
  line-height: 1.5;
}
.bullet-list li::before {
  content: '';
  position: absolute;
  left: 0.1rem;
  top: 0.55rem;
  width: 7px;
  height: 7px;
  border: 1px solid color-mix(in srgb, var(--ink) 30%, transparent);
  background: color-mix(in srgb, var(--paper) 82%, #ffffff 18%);
  transform: rotate(45deg);
}
.back-link {
  text-decoration: none;
  font-family: var(--font-sans);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.82rem;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 32%, transparent);
  padding-bottom: 0.15rem;
}
.back-link:hover,
.back-link:focus-visible {
  border-bottom-color: color-mix(in srgb, var(--ink) 52%, transparent);
}
.gallery {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.gallery-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.gallery-header h2 {
  margin: 0;
  font-size: 0.98rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.gallery-note {
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  opacity: 0.7;
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--gutter);
}
.project-missing {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.project-missing h1 {
  margin: 0;
}
.project-missing p {
  margin: 0;
  opacity: 0.85;
}
@media (max-width: 720px) {
  .project-title {
    font-size: 1.5rem;
  }
  .project-toc {
    gap: 0.4rem;
  }
  .meta-grid {
    grid-template-columns: 1fr;
  }
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
