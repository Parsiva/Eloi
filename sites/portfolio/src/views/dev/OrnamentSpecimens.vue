<script setup>
import { computed, ref } from 'vue'
import sprite from '@/ornaments/hand-drawn.svg?raw'
import manifest from '@/ornaments/hand-drawn.json'

const scales = [2, 1, 0.75, 0.5]
const scale = ref(1)
const showBounds = ref(true)

const pieces = Object.entries(manifest).map(([id, m]) => ({ id, ...m }))
const fixed = computed(() => pieces.filter((p) => p.kind === 'fixed'))
const tiles = computed(() => pieces.filter((p) => p.kind === 'tile'))
// Drawn once on the left; the frame engine will mirror these for the right-hand side.
const mirrored = new Set(['corner-medallion', 'side-leaf', 'corner-flame'])
</script>

<template>
  <main class="specimens">
    <div class="specimens__sprite" v-html="sprite" aria-hidden="true"></div>

    <header class="panel-stack">
      <p class="lede-eyebrow">Dev only · not included in production builds</p>
      <h2 class="lede-title">Ornament specimens</h2>
      <p class="lede-subtitle">
        First-pass cut of <code>src/ornaments/source/websiteVectorOutline.svg</code>. After re-exporting from
        Illustrator, regenerate with <code>npm run ornaments</code>.
      </p>
      <div class="specimens__controls">
        <span class="form-label">Scale</span>
        <button
          v-for="s in scales"
          :key="s"
          type="button"
          class="btn"
          :class="{ 'is-active': scale === s }"
          @click="scale = s"
        >
          {{ s }}×
        </button>
        <label class="specimens__toggle"><input v-model="showBounds" type="checkbox" /> Show bounds</label>
      </div>
    </header>

    <section class="panel-stack" :class="{ 'show-bounds': showBounds }">
      <h3 class="specimens__heading">Fixed pieces <span>— placed at real size, never stretched</span></h3>
      <div class="specimens__grid">
        <figure v-for="p in fixed" :key="p.id" class="specimen">
          <div class="specimen__art">
            <svg :width="p.width * scale" :height="p.height * scale">
              <use :href="`#hd-${p.id}`" width="100%" height="100%" />
            </svg>
            <svg v-if="mirrored.has(p.id)" class="is-mirrored" :width="p.width * scale" :height="p.height * scale">
              <use :href="`#hd-${p.id}`" width="100%" height="100%" />
            </svg>
          </div>
          <figcaption>
            <strong>{{ p.id }}</strong>
            <span>{{ p.width }} × {{ p.height }} · {{ p.elements }} shapes</span>
            <span v-if="mirrored.has(p.id)">original + mirror</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <section class="panel-stack" :class="{ 'show-bounds': showBounds }">
      <h3 class="specimens__heading">Repeating tiles <span>— one unit, then repeated to check the seams</span></h3>
      <figure v-for="t in tiles" :key="t.id" class="tile-row">
        <svg class="tile-row__unit" :width="t.width * scale * 2" :height="t.height * scale * 2">
          <use :href="`#hd-${t.id}`" width="100%" height="100%" />
        </svg>
        <svg class="tile-row__strip" width="100%" :height="t.height * scale">
          <defs>
            <pattern
              :id="`strip-${t.id}`"
              patternUnits="userSpaceOnUse"
              :width="t.width * scale"
              :height="t.height * scale"
            >
              <use :href="`#hd-${t.id}`" :width="t.width * scale" :height="t.height * scale" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" :fill="`url(#strip-${t.id})`" />
        </svg>
        <figcaption>
          <strong>{{ t.id }}</strong>
          <span>repeat every {{ t.width }} · unit shown at 2× on the left</span>
        </figcaption>
      </figure>
    </section>
  </main>
</template>

<style scoped>
.specimens {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gutter) * 1.5);
  color: var(--ink);
}
.specimens__sprite {
  display: none;
}
.specimens__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.specimens__controls .form-label {
  margin: 0 0.25rem 0 0;
}
.specimens__controls .btn {
  padding: 0.35rem 0.8rem;
}
.specimens__controls .btn.is-active {
  background: var(--ink);
  color: var(--paper);
}
.specimens__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: 0.75rem;
  font-size: 0.85rem;
}
.specimens__toggle input {
  width: auto;
}
.specimens__heading {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.28);
  padding-bottom: 0.3rem;
}
.specimens__heading span {
  text-transform: none;
  letter-spacing: 0.02em;
  font-weight: 400;
  opacity: 0.7;
}
.specimens__grid {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--gutter) * 1.25);
  align-items: flex-end;
}
.specimen {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.specimen__art {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
}
.specimen figcaption,
.tile-row figcaption {
  display: flex;
  flex-direction: column;
  font-size: 0.78rem;
  line-height: 1.35;
}
.specimen figcaption span,
.tile-row figcaption span {
  opacity: 0.72;
}
svg {
  display: block;
  overflow: visible;
}
.is-mirrored {
  transform: scaleX(-1);
}
.tile-row {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1rem;
  align-items: center;
}
.tile-row figcaption {
  grid-column: 1 / -1;
}
.show-bounds .specimen__art svg,
.show-bounds .tile-row__unit {
  outline: 1px dashed color-mix(in srgb, #b3261e 55%, transparent);
}
</style>
