<template>
  <main>
    <g-title id="title" title="探索" go="/-1" />

    <g-fonts-list class="body explore-body" :fonts="fonts" v-slot="{ font }">
      <n-card class="explore-card hoverable" @click="showFont(font)">
        <n-space vertical>
          <n-text strong> {{ font.name }} </n-text>
          <g-preview :glyphs="font.glyphs" />
          <n-text :depth="3">
            @{{ font.userName }}
            <n-divider vertical />
            {{ font.count }} 字
            <n-divider vertical />
            国标 {{ ((font.gbkCount / 7445) * 100).toFixed(2) }}%
          </n-text>
        </n-space>
      </n-card>
    </g-fonts-list>

    <g-drawer v-model:show="fontDrawer">
      <n-divider dashed>
        {{ font!.name }}
      </n-divider>

      <n-row>
        <n-col :span="12">
          <n-statistic label="国标字数" :value="font!.gbkCount">
            <template #suffix>
              <small> / 7445 </small>
            </template>
          </n-statistic>
        </n-col>

        <n-col :span="12">
          <n-statistic label="总字数" :value="font!.count" />
        </n-col>
      </n-row>

      <n-divider dashed> 预览 </n-divider>

      <n-input
        v-model:value.trim="previewString"
        type="textarea"
        autosize
        placeholder="要预览的句子"
      />

      <g-preview class="hspace" :glyphs="preview" />

      <n-divider dashed> 下载 </n-divider>

      <n-space justify="center">
        <n-button
          size="large"
          type="primary"
          secondary
          :disabled="previewGlyphs.length === 0"
          @click="openSaveDrawer(false)"
        >
          仅含预览字形
        </n-button>

        <n-button size="large" type="primary" secondary @click="openSaveDrawer(true)">
          完整字体
        </n-button>
      </n-space>
    </g-drawer>

    <SaveDrawer v-model:show="saveDrawer" :font-data="font" :glyph-datas="glyphs" />

    <g-operations>
      <n-button secondary @click="returnToTop">
        <n-icon><arrow-up /></n-icon>
      </n-button>
    </g-operations>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ArrowUp } from '@vicons/fa'
import GTitle from '@/components/GTitle.vue'
import GDrawer from '@/components/GDrawer.vue'
import GOperations from '@/components/GOperations.vue'
import GFontsList from '@/components/GFontsList.vue'
import GPreview from '@/components/GPreview.vue'
import SaveDrawer from './SaveDrawer.vue'

import { useDBStore } from '@/stores/db'
const DB = useDBStore()

import type { CloudFontData, GlyphData, Preview } from '@/stores/glyphz'

import { useMessage } from 'naive-ui'
const message = useMessage()

const fonts = ref<CloudFontData[]>([])
const font = ref<CloudFontData | undefined>(undefined)
const fontDrawer = ref(false)

const previewString = ref('')
const previewGlyphs = ref<GlyphData[]>([])
const preview = ref<Preview>([])
const glyphs = ref<GlyphData[]>([])

const timer = ref<any>(null)
watch(previewString, () => {
  if (timer.value !== null) clearTimeout(timer.value)
  timer.value = setTimeout(async () => {
    try {
      if (!previewString.value.length) return
      previewGlyphs.value = await DB.getCloudGlyphs(font.value!.fontKey, previewString.value)
      preview.value = DB.toPreview(previewGlyphs.value, previewString.value)
    } catch {
      message.error('网络异常，获取预览字形失败')
    }
  }, 300)
})

onMounted(async () => {
  try {
    fonts.value = await DB.getExploreFonts()
  } catch {
    message.error('网络异常，获取字体列表失败')
  }
})

function showFont(value: CloudFontData) {
  font.value = value
  previewString.value = ''
  previewGlyphs.value = []
  preview.value = []
  glyphs.value = []
  fontDrawer.value = true
}

function returnToTop() {
  document.getElementById('title')!.scrollIntoView({
    behavior: 'smooth',
  })
}

const saveDrawer = ref(false)

async function openSaveDrawer(full: boolean) {
  try {
    glyphs.value = full ? await DB.getCloudGlyphs(font.value!.fontKey) : previewGlyphs.value
    saveDrawer.value = true
  } catch {
    message.error('网络异常，下载失败')
  }
}
</script>

<style scoped>
.explore-body {
  width: 512px;
  max-width: calc(100% - 32px);
  margin: 0 auto;
}
</style>
