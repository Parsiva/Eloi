<script setup>
import { useRouter } from 'vue-router'
import Frame from '@/components/layout/Frame.vue'
import FramedImage from '@/components/FramedImage.vue'
import { projects } from '@/data/projects'

const router = useRouter()

const previewStack = (stack = []) => stack.slice(0, 4)

function goToProject(slug) {
  router.push(`/projects/${slug}`)
}
</script>

<template>
  <div class="content-width page-stack projects-page">
    <header class="page-lede">
      <p class="lede-eyebrow">Projects</p>
      <h1 class="lede-title">Studio dossiers and toolkits</h1>
      <p class="lede-subtitle">
        A curated shelf of Parkington Programs work. Each card opens to a detailed page; marginalia stays separate and live.
      </p>
    </header>

    <div class="projects-grid">
      <RouterLink
        v-for="project in projects"
        :key="project.slug"
        :to="`/projects/${project.slug}`"
        class="project-link"
        :aria-label="`Open ${project.title}`"
        @keydown.space.prevent="goToProject(project.slug)"
      >
        <Frame configKey="panel-frame" class="project-card">
          <FramedImage
            class="project-card__media"
            :src="project.cardImage"
            :alt="`${project.title} thumbnail`"
            aspect="4/3"
            :show-caption="false"
          />
          <div class="card-open" aria-hidden="true">
            <svg viewBox="0 0 16 16" role="presentation">
              <path d="M4 4h8v1.5H6.5V12H5V4z" fill="currentColor" />
              <path d="M9 4h1.5v5.5H16V11H9z" fill="currentColor" />
            </svg>
          </div>
          <div class="project-card__body">
            <div class="project-card__heading">
              <h2 class="project-title">{{ project.title }}</h2>
              <p class="project-tagline">{{ project.tagline }}</p>
            </div>
            <p class="project-summary" v-if="project.body?.length">{{ project.body[0] }}</p>
            <div v-if="project.stack?.length" class="stack-row">
              <span v-for="tech in previewStack(project.stack)" :key="tech" class="stack-chip">
                {{ tech }}
              </span>
            </div>
          </div>
        </Frame>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.projects-page {
  gap: calc(var(--gutter) * 0.9);
}
.page-lede {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--gutter);
}
.project-link {
  text-decoration: none;
  color: inherit;
  outline: none;
}
.project-card {
  height: 100%;
  transition: transform 160ms ease, box-shadow 200ms ease, border-color 160ms ease;
  position: relative;
}
.project-card__media {
  border-radius: 2px;
}
.project-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.project-card__heading {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.project-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.07em;
  margin: 0;
}
.project-tagline {
  margin: 0;
  opacity: 0.88;
  font-size: 0.98rem;
}
.project-summary {
  margin: 0;
  opacity: 0.9;
  line-height: 1.5;
}
.stack-row {
  display: flex;
  gap: 0.4rem;
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
.card-open {
  position: absolute;
  top: calc(var(--frame-thickness) + var(--frame-inner-pad) - 2px);
  right: calc(var(--frame-thickness) + var(--frame-inner-pad) - 2px);
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--ink) 30%, transparent);
  border-radius: 6px;
  background: color-mix(in srgb, var(--paper) 78%, #ffffff 22%);
  color: color-mix(in srgb, var(--ink) 82%, #000 18%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  pointer-events: none;
}
.card-open svg {
  width: 14px;
  height: 14px;
}
.project-card:hover,
.project-link:focus-visible .project-card {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}
.project-link:focus-visible .project-card {
  outline: 2px solid color-mix(in srgb, var(--ink) 32%, transparent);
  outline-offset: 4px;
}
@media (min-width: 1080px) {
  .projects-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
@media (max-width: 640px) {
  .project-card__body {
    gap: 0.45rem;
  }
  .project-summary {
    font-size: 0.95rem;
  }
}
</style>
