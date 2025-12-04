<template>
  <n-space class="title" @click="route" :style="{ cursor: go ? 'pointer' : 'unset' }" vertical>
    <n-space justify="center">
      <n-text strong> {{ title }} </n-text>
    </n-space>
    <slot />
  </n-space>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    title: String,
    go: { type: String, required: false },
  },
  methods: {
    async route() {
      if (this.go === undefined) return
      await this.$router.replace(this.go)
    },
  },
})
</script>

<style scoped>
.title {
  padding-top: 32px;
  padding-bottom: 16px;
  margin-bottom: 16px;
}
</style>
