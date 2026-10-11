<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { renderFrameSvg } from '@/frames/frameEngine'
import { getFrameThickness, resolveFrameConfig } from '@/frames/frameSettings'

type BorderFlags = {
  top?: boolean
  right?: boolean
  bottom?: boolean
  left?: boolean
}

type FlourishFlags = {
  topLeft?: boolean
  topCenter?: boolean
  topRight?: boolean
  rightCenter?: boolean
  bottomRight?: boolean
  bottomCenter?: boolean
  bottomLeft?: boolean
  leftCenter?: boolean
}

const props = defineProps<{
  id?: string
  configKey?: string
  variant?: string
  borders?: BorderFlags
  flourishes?: FlourishFlags
  customConfig?: Partial<import('@/frames/frameSettings').FrameConfig>
}>()

const svg = ref('')
const root = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null
let raf = 0

const redraw = () => {
  if (!root.value) return
  const cfg = resolveFrameConfig(props.id, props.configKey, props.customConfig)
  const rect = root.value.getBoundingClientRect()
  const W = Math.max(0, Math.floor(rect.width))
  const H = Math.max(0, Math.floor(rect.height))
  const frameThickness = getFrameThickness(cfg)
  const innerPad = cfg.innerPad ?? 0
  const paddingPx = frameThickness + innerPad
  root.value.style.setProperty('--frame-thickness', `${frameThickness}px`)
  root.value.style.setProperty('--frame-inner-pad', `${innerPad}px`)
  root.value.style.setProperty('--frame-padding', `${paddingPx}px`)
  root.value.style.setProperty('--frame-ink', cfg.ink)
  svg.value = renderFrameSvg(cfg, W, H)
}

const schedule = () => {
  if (raf) cancelAnimationFrame(raf)
  raf = requestAnimationFrame(redraw)
}

onMounted(() => {
  redraw()
  ro = new ResizeObserver(schedule)
  if (root.value) ro.observe(root.value)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (ro && root.value) ro.unobserve(root.value)
  ro = null
})

watch(
  () => [props.id, props.configKey],
  () => schedule()
)

watch(
  () => props.customConfig,
  () => schedule(),
  { deep: true }
)
</script>

<template>
  <div :class="['frame', variant ? `frame--${variant}` : '']" ref="root" :data-frame-id="id">
    <div class="frame__svg" v-html="svg" aria-hidden="true"></div>
    <div class="frame__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.frame {
  position: relative;
  box-sizing: border-box;
  --frame-thickness: 0px;
  --frame-inner-pad: 0px;
}
.frame__svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.frame__content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: calc(var(--frame-thickness, 0px) + var(--frame-inner-pad, 0px));
}
</style>
