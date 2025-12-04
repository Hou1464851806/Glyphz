<template>
  <n-space class="operations" justify="center">
    <slot />
  </n-space>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({})
</script>

<style>
.operations {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(32px + constant(safe-area-inset-bottom));
  bottom: calc(32px + env(safe-area-inset-bottom));
  width: 512px;
  max-width: calc(100% - 32px);
  margin: 0 auto;
  padding: 0;
  justify-content: space-around !important;
  gap: 0 !important;
}

.operations .n-button {
  width: 48px;
  height: 48px;
  margin: 8px;
  border-radius: 24px;
  font-size: 16px;
  background-color: rgba(0, 0, 0, 0.15);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
}

.operations .n-button.n-button--secondary {
  width: 64px;
  height: 64px;
  margin: 0;
  border-radius: 32px;
  font-size: 24px;
}
</style>
