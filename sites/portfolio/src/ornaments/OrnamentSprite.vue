<script setup lang="ts">
import sprite from './ornaments.svg?raw'
</script>

<template>
  <div class="ornament-sprite" v-html="sprite" aria-hidden="true"></div>
</template>

<style scoped>
.ornament-sprite {
  display: none;
}
</style>
