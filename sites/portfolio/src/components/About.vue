<script setup>
import Frame from '@/components/layout/Frame.vue'
</script>

<template>
  <div class="content-width page-stack">
    <Frame configKey="panel-frame" class="about-panel">
      <h2 class="lede-title">About Parkington Programs</h2>
      <p class="lede-subtitle">
        Parkington Programs is a small studio for city-planning experiments, public tools, and reflective writing.
      </p>
      <p class="about-body">
        It collects projects that blend mapping, audio, prototyping, and policy sketches. I keep a marginalia ledger of essays, notes, dev logs, and AI recaps to narrate the work in progress.
      </p>
      <p class="about-body">
        The studio grew out of a city planning practice that values curiosity, small interventions, and conversation with neighbors - everything here stays on parchment: open, revisable, and ready to share.
      </p>
    </Frame>
  </div>
</template>

<style scoped>
.about-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.about-body {
  margin: 0;
  opacity: 0.92;
}
</style>
