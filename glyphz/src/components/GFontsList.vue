<template>
  <n-list :clickable="hoverable" :hoverable="hoverable">
    <n-list-item v-for="v of fonts" :key="v.fontKey" @click="$emit('click', v.fontKey)">
      <slot :font="v">
        <n-space vertical>
          <n-text strong> {{ v.name }} </n-text>
          <g-preview :glyphs="v.glyphs" />
          <n-text :depth="3">
            {{ v.count }} 字
            <n-divider vertical />
            国标 {{ ((v.gbkCount / 7445) * 100).toFixed(2) }}%
            <n-divider vertical />
            更新于
            <n-time :time="v.updateTime" :to="new Date().getTime()" type="relative" />
          </n-text>
        </n-space>
      </slot>
    </n-list-item>
  </n-list>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { CloudFontData } from '@/stores/db'
import GPreview from '@/components/GPreview.vue'

export default defineComponent({
  components: { GPreview },
  props: {
    fonts: Array as PropType<CloudFontData[]>,
    hoverable: Boolean,
  },
  emits: ['click'],
})
</script>
