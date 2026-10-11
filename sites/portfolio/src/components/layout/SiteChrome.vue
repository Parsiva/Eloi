<script setup lang="ts">
import Frame from './Frame.vue'
import OrnamentSprite from '@/ornaments/OrnamentSprite.vue'
import StudioMasthead from '@/components/studio/StudioMasthead.vue'
import StudioNavStrip from '@/components/studio/StudioNavStrip.vue'
</script>

<template>
  <div class="site-chrome">
    <OrnamentSprite />
    <Frame configKey="page-frame" class="site-chrome__page">
      <div class="site-chrome__header">
        <Frame configKey="header-band-frame" class="site-chrome__header-frame">
          <div class="site-chrome__masthead">
            <StudioMasthead />
          </div>
          <Frame configKey="nav-strip-frame" class="site-chrome__nav-frame">
            <div class="site-chrome__nav">
              <StudioNavStrip />
            </div>
          </Frame>
        </Frame>
      </div>
      <div class="site-chrome__body">
        <Frame configKey="body-frame" class="site-chrome__content-frame">
          <div class="site-chrome__content">
            <slot />
          </div>
        </Frame>
      </div>
    </Frame>
  </div>
</template>

<style scoped>
.site-chrome {
  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
  --masthead-height: 200px;
  --page-margins: 120px;
  display: flex;
  justify-content: center;
  padding: calc(var(--gutter) * 0.35) var(--gutter);
  box-sizing: border-box;
}
.site-chrome__page {
  width: 100vw;
  max-width: none;
  display: flex;
  flex-direction: column;
  gap: calc(var(--gutter) * 0.8);
}
.site-chrome__header {
  width: 100%;
}
.site-chrome__header-frame {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gutter) * 0.4);
}
.site-chrome__masthead {
  text-align: center;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}
.site-chrome__nav-frame {
  width: 100%;
}
.site-chrome__nav {
  width: 100%;
}
.site-chrome__body {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--gutter);
}
.site-chrome__content-frame {
  width: 100%;
}
.site-chrome__content {
  display: flex;
  flex-direction: column;
  gap: var(--gutter);
  width: 100%;
}
@media (max-width: 768px) {
  .site-chrome {
    padding: calc(var(--gutter) * 0.6);
  }
  .site-chrome__page {
    gap: var(--gutter);
  }
}
</style>
