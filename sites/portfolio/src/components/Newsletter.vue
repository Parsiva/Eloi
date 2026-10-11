<script setup lang="ts">
import Frame from '@/components/layout/Frame.vue'

function handleSubmit(event: Event) {
  event.preventDefault()
  console.log('Newsletter sign-up placeholder')
  alert('Newsletter sign-up coming soon.')
}
</script>

<template>
  <div class="content-width page-stack">
    <Frame configKey="panel-frame" class="newsletter-panel">
      <h1 class="lede-title">Newsletter</h1>
      <p class="lede-subtitle">
        Occasional dispatches from Parkington Programs: project updates, essays, experiments, and field notes. No spam - just studio signals.
      </p>
      <form class="newsletter-form" @submit="handleSubmit">
        <label class="form-label" for="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          class="form-control"
          placeholder="you@example.com"
        />
        <button type="submit" class="btn">Join the ledger</button>
      </form>
      <p class="note">This form is a placeholder - the delivery wiring is coming soon.</p>
    </Frame>
  </div>
</template>

<style scoped>
.newsletter-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.newsletter-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.note {
  font-size: 0.85rem;
  opacity: 0.72;
  margin: 0;
}
</style>
