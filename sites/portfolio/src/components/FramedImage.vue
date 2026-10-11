<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
  caption: {
    type: String,
    default: '',
  },
  aspect: {
    type: String,
    default: '16/9',
  },
  priority: {
    type: Boolean,
    default: false,
  },
  contain: {
    type: Boolean,
    default: false,
  },
  showCaption: {
    type: Boolean,
    default: true,
  },
})

const errored = ref(false)
const showPlaceholder = computed(() => !props.src || errored.value)
const loadingAttr = computed(() => (props.priority ? 'eager' : 'lazy'))

function handleError() {
  errored.value = true
}
</script>

<template>
  <figure
    class="framed-image"
    :class="{
      'framed-image--hero': priority,
      'framed-image--placeholder': showPlaceholder,
      'framed-image--contain': contain,
    }"
    :style="{ '--aspect-ratio': aspect }"
  >
    <div class="framed-image__frame">
      <div class="framed-image__inner">
        <img
          v-if="!showPlaceholder"
          :src="src"
          :alt="alt"
          :loading="loadingAttr"
          @error="handleError"
        />
        <div v-else class="framed-image__placeholder" aria-hidden="true">
          <span>Image goes here</span>
        </div>
        <div class="framed-image__corners" aria-hidden="true">
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>
        </div>
      </div>
    </div>
    <figcaption v-if="showCaption && (caption || showPlaceholder)" class="framed-image__caption">
      {{ caption || 'Placeholder image' }}
    </figcaption>
  </figure>
</template>

<style scoped>
.framed-image {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}
.framed-image__frame {
  position: relative;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--ink) 28%, transparent);
  background: color-mix(in srgb, var(--paper) 94%, #ffffff 6%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 16%, transparent);
}
.framed-image__inner {
  position: relative;
  width: 100%;
  aspect-ratio: var(--aspect-ratio, 16/9);
  overflow: hidden;
  background: color-mix(in srgb, var(--paper) 88%, #ffffff 12%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 18%, transparent);
  isolation: isolate;
}
.framed-image__inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(0.94);
}
.framed-image--contain .framed-image__inner img {
  object-fit: contain;
}
.framed-image__placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--ink) 70%, #000 30%);
  background: repeating-linear-gradient(
      45deg,
      color-mix(in srgb, var(--paper) 94%, #ffffff 6%),
      color-mix(in srgb, var(--paper) 94%, #ffffff 6%) 10px,
      color-mix(in srgb, var(--ink) 6%, transparent) 10px,
      color-mix(in srgb, var(--ink) 6%, transparent) 20px
    );
}
.framed-image__corners {
  pointer-events: none;
}
.corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 1px solid color-mix(in srgb, var(--ink) 36%, transparent);
  background: color-mix(in srgb, var(--paper) 92%, #ffffff 8%);
}
.corner.tl {
  top: 6px;
  left: 6px;
  border-right: none;
  border-bottom: none;
}
.corner.tr {
  top: 6px;
  right: 6px;
  border-left: none;
  border-bottom: none;
}
.corner.bl {
  bottom: 6px;
  left: 6px;
  border-right: none;
  border-top: none;
}
.corner.br {
  bottom: 6px;
  right: 6px;
  border-left: none;
  border-top: none;
}
.framed-image__caption {
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  opacity: 0.78;
  line-height: 1.4;
}
.framed-image--hero .framed-image__frame {
  padding: 10px;
}
.framed-image--hero .framed-image__inner {
  aspect-ratio: 16/9;
}
@media (prefers-color-scheme: dark) {
  .framed-image__inner img {
    filter: saturate(0.85);
  }
}
</style>
