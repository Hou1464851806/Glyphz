<template>
  <g-drawer>
    <n-divider dashed> 常用格式 </n-divider>

    <n-space justify="center">
      <n-button size="large" type="primary" secondary @click="save('ttf')">
        TrueType (.ttf)
      </n-button>

      <n-button size="large" type="primary" secondary @click="save('otf')">
        OpenType (.otf)
      </n-button>
    </n-space>

    <n-divider dashed> 其他格式 </n-divider>

    <n-space justify="center">
      <n-button v-for="(type, i) of types" :key="i" secondary @click="save(type)">
        .{{ type }}
      </n-button>
    </n-space>
  </g-drawer>
</template>

<script setup lang="ts">
import GDrawer from '@/components/GDrawer.vue'

import { useDBStore } from '@/stores/db'
import type { FontData, GlyphData } from '@/stores/db'
const DB = useDBStore()

const props = defineProps<{
  fontId?: number
  fontData?: FontData
  glyphDatas?: GlyphData[]
}>()

type otherTypes = 'eot' | 'woff' | 'svg'
const types = ['eot', 'woff', 'svg'] as otherTypes[]

async function save(type: 'ttf' | 'otf' | otherTypes) {
  if (props.fontId) await DB.getFontFileByID(props.fontId, type)
  else await DB.getFontFile(props.fontData!, props.glyphDatas!, type)
}
</script>
