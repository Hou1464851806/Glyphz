<template>
  <n-drawer
    v-bind="$attrs"
    v-model:show="_show"
    :height="height"
    :auto-focus="autoFocus"
    placement="bottom"
  >
    <n-drawer-content :native-scrollbar="false">
      <n-space vertical>
        <slot />
      </n-space>
    </n-drawer-content>
  </n-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    show: Boolean,
    autoFocus: { type: Boolean, default: false },
    height: { type: String, default: '80%' },
  },
  emits: ['update:show'],
  computed: {
    _show: {
      get() {
        return this.show
      },
      set(v: boolean) {
        this.$emit('update:show', v)
      },
    },
  },
})
</script>
