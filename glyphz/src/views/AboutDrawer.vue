<template>
  <g-drawer>
    <n-divider dashed> 字塑 / Glyphz </n-divider>

    <n-space justify="center">
      <n-text> Copyright (c) 2023 s-Hit a.k.a. Apriverse </n-text>
    </n-space>

    <n-divider dashed> 许可列表 </n-divider>

    <n-collapse accordion>
      <n-collapse-item v-for="(v, i) in licenses" :key="i" :title="v.name">
        <n-text style="white-space: pre-wrap; font-size: 0.6em" code>
          {{ v.license }}
        </n-text>
      </n-collapse-item>
    </n-collapse>
  </g-drawer>
</template>

<script setup lang="ts">
import GDrawer from '@/components/GDrawer.vue'
import licenses from '@/assets/licenses.json'
</script>
