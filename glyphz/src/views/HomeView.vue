<template>
  <main>
    <n-carousel
      class="carousel"
      dot-placement="top"
      mousewheel
      draggable
      ref="carousel"
      :loop="false"
      v-model:current-index="page"
    >
      <div class="carousel-item">
        <g-title title="更多" />

        <n-space class="main" justify="center">
          <n-button secondary class="main-btn blur" @click="$router.replace('/explore')">
            <n-icon :size="96"><compass /></n-icon>
          </n-button>
        </n-space>
      </div>

      <div v-for="font in fonts" :key="font.id" class="carousel-item">
        <g-title :title="font.name">
          <n-space justify="center">
            <n-text :depth="3">
              {{ font.unicodes.length }} 字
              <n-divider vertical />
              国标 {{ font.progress!.toFixed(2) }}%
              <template v-if="font.dirty">
                <n-divider vertical />
                未同步
              </template>
            </n-text>
          </n-space>
        </g-title>

        <n-space class="main" justify="center">
          <n-button
            secondary
            class="main-btn blur"
            :style="font.progressStyle"
            @click="showWriteDrawer(true)"
          >
            <g-preview :glyphs="font.previewGlyphs" />
          </n-button>
        </n-space>
      </div>

      <div class="carousel-item">
        <g-title title="新字体" />

        <n-space class="main" justify="center">
          <n-button secondary class="main-btn blur" @click="infoDrawer = true">
            <n-icon :size="96"><plus /></n-icon>
          </n-button>
        </n-space>
      </div>
    </n-carousel>

    <transition name="fade" appear>
      <g-operations v-if="page === 0">
        <n-button tertiary @click="DB.nextBackground">
          <n-icon><magic /></n-icon>
        </n-button>

        <n-button secondary @click="userDrawer = true">
          <n-icon><user-alt /></n-icon>
        </n-button>

        <n-button tertiary @click="aboutDrawer = true">
          <n-icon><info /></n-icon>
        </n-button>
      </g-operations>

      <g-operations v-else-if="!newFont">
        <n-button tertiary @click="$router.replace(`/font/${font.id}`)">
          <n-icon><table-icon /></n-icon>
        </n-button>

        <n-button tertiary @click="infoDrawer = true">
          <n-icon><cog /></n-icon>
        </n-button>

        <n-button secondary @click="showWriteDrawer(false)">
          <n-icon><pen-alt /></n-icon>
        </n-button>

        <n-button tertiary @click="syncDrawer = true">
          <n-icon><sync-alt /></n-icon>
        </n-button>

        <n-button tertiary :disabled="font.unicodes.length === 0" @click="saveDrawer = true">
          <n-icon><file-download /></n-icon>
        </n-button>
      </g-operations>

      <g-operations v-else>
        <n-button secondary @click="showDownloadDrawer">
          <n-icon><cloud-download-alt /></n-icon>
        </n-button>
      </g-operations>
    </transition>

    <UserDrawer v-model:show="userDrawer" />
    <AboutDrawer v-model:show="aboutDrawer" />
    <DownloadDrawer v-model:show="downloadDrawer" :cloud-fonts="cloudFonts" />

    <FontInfoDrawer v-model:show="infoDrawer" :font="font" @save="infoSaved" />
    <WriteDrawer v-model:show="writeDrawer" :font="font" :target="writeTarget" />
    <SyncDrawer v-model:show="syncDrawer" :font="font" />
    <SaveDrawer v-model:show="saveDrawer" :font-id="font?.id" />
  </main>
</template>

<script setup lang="ts">
import { Compass, Magic, UserAlt, Info } from '@vicons/fa'
import { Table as TableIcon, Cog, PenAlt, SyncAlt, FileDownload } from '@vicons/fa'
import { Plus, CloudDownloadAlt } from '@vicons/fa'

import GTitle from '@/components/GTitle.vue'
import GOperations from '@/components/GOperations.vue'
import GPreview from '@/components/GPreview.vue'
import UserDrawer from '@/views/UserDrawer.vue'
import AboutDrawer from '@/views/AboutDrawer.vue'
import DownloadDrawer from '@/views/DownloadDrawer.vue'
import FontInfoDrawer from '@/views/FontInfoDrawer.vue'
import WriteDrawer from '@/views/WriteDrawer.vue'
import SyncDrawer from '@/views/SyncDrawer.vue'
import SaveDrawer from '@/views/SaveDrawer.vue'

import { useDBStore } from '@/stores/db'
const DB = useDBStore()

import type { FontInfo, FontData, CloudFontData, Preview } from '@/stores/glyphz'

import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()

import { useMessage } from 'naive-ui'
const message = useMessage()

type ExtendFontData = FontData & {
  progress?: number
  progressStyle?: string
  previewGlyphs?: Preview
}

function progressStyle(progress: number) {
  return (
    `background-image: ` +
    `conic-gradient(rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.35) ${progress}%, ` +
    `transparent ${progress}%, transparent 100%);`
  )
}

const fonts = ref<ExtendFontData[]>([])
const page = ref(1)
const font = computed(() => fonts.value[page.value - 1])
const newFont = computed(() => fonts.value.length === 0 || page.value > fonts.value.length)

onMounted(async () => {
  const dbFonts: ExtendFontData[] = await DB.getFonts()
  for (const font of dbFonts) {
    font.progress = (font.gbkCount / 7445) * 100
    font.progressStyle = progressStyle(font.progress)
    font.previewGlyphs = await DB.getPreviewGlyphs(font.id!, DB.recommendSentence)
  }
  fonts.value = dbFonts

  if (route.params.font === '-1') {
    page.value = 0
    return
  }

  const index = fonts.value.map(font => font.id!).indexOf(parseInt(route.params.font as string))
  page.value = index + 1 || 1
})

const userDrawer = ref(false)
const aboutDrawer = ref(false)
const infoDrawer = ref(false)
const syncDrawer = ref(false)
const saveDrawer = ref(false)

const writeDrawer = ref(false)
const writeTarget = ref('')
function showWriteDrawer(withRecommendSentence: boolean) {
  writeTarget.value = withRecommendSentence ? DB.recommendSentence : ''
  writeDrawer.value = true
}

const downloadDrawer = ref(false)
const cloudFonts = ref<CloudFontData[]>([])
async function showDownloadDrawer() {
  if (DB.user === undefined) {
    page.value = 0
    userDrawer.value = true
  } else {
    message.loading('加载云端字体列表中…')
    cloudFonts.value = await DB.getCloudFonts()
    message.destroyAll()
    downloadDrawer.value = true
  }
}

function infoSaved(info: FontInfo) {
  Object.assign(fonts.value[page.value - 1], info)
  infoDrawer.value = false
}
</script>

<style scoped>
.carousel {
  height: 100%;
  overflow: hidden;
}

.carousel-item {
  height: 100%;
}

.main {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: calc(100% - constant(safe-area-inset-bottom));
  height: calc(100% - env(safe-area-inset-bottom));
  align-items: center;
}

.main-btn {
  width: 256px;
  height: 256px;
  border-radius: 50%;
}
</style>
