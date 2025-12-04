<template>
  <main>
    <g-title :title="font.name" :go="`/${$route.params.font}`" />

    <n-space justify="center" class="body">
      <div class="main">
        <n-grid :cols="3" :x-gap="0" :y-gap="0" item-responsive>
          <n-gi v-for="glyph of glyphs" :key="glyph.unicode" class="gi">
            <n-card class="hoverable" style="margin: 8px" @click="route(glyph.unicode)">
              <n-space vertical>
                <svg width="100%" viewBox="0, 0, 1024, 1024">
                  <path stroke="none" fill="white" :d="glyph.svg" />
                </svg>
                <n-space justify="center">
                  <n-text strong> {{ DB.unicodeToChar(glyph.unicode) }} </n-text>
                </n-space>
                <n-space justify="center">
                  <n-text :depth="3"> {{ glyph.unicode }} </n-text>
                </n-space>
              </n-space>
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </n-space>

    <g-operations>
      <n-button tertiary :disabled="page == 1" @click="page--">
        <n-icon><angle-left /></n-icon>
      </n-button>

      <n-button secondary @click="previewDrawer = true">
        <n-icon><eye /></n-icon>
      </n-button>

      <n-button tertiary :disabled="page == pages" @click="page++">
        <n-icon><angle-right /></n-icon>
      </n-button>
    </g-operations>

    <n-drawer v-model:show="previewDrawer" height="80%" placement="bottom">
      <n-drawer-content>
        <n-space vertical>
          <n-divider dashed> 预览 </n-divider>
          <n-input
            v-model:value.trim="previewString"
            type="textarea"
            autosize
            placeholder="要预览的句子"
          />
          <g-preview class="hspace" :glyphs="previewGlyphs" :font-id="id" />
        </n-space>
      </n-drawer-content>
    </n-drawer>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { AngleLeft, Eye, AngleRight } from '@vicons/fa'
import GTitle from '@/components/GTitle.vue'
import GOperations from '@/components/GOperations.vue'
import GPreview from '@/components/GPreview.vue'

import { useDBStore } from '@/stores/db'
import type { FontData, GlyphData, Preview } from '@/stores/glyphz'

const DB = useDBStore()

export default defineComponent({
  components: { AngleLeft, Eye, AngleRight, GTitle, GOperations, GPreview },
  data: () => ({
    DB,
    id: NaN,
    page: 1,
    pages: 0,

    previewDrawer: false,
    previewString: '',
    previewGlyphs: [] as Preview,

    font: {} as FontData,
    glyphs: [] as GlyphData[],
  }),
  watch: {
    async page(v: number) {
      this.glyphs = await DB.getGlyphs(this.id, v)
    },
    async previewString(v: string) {
      this.previewGlyphs = await DB.getPreviewGlyphs(this.id, v)
    },
  },
  async mounted() {
    this.id = Number(this.$route.params.font)
    this.font = (await DB.getFont(this.id))!
    this.glyphs = await DB.getGlyphs(this.id, this.page)
    this.pages = Math.ceil(this.font.unicodes.length / 21)
  },
  methods: {
    async route(unicode: string) {
      await DB.routeToGlyph(this.$router, this.id, unicode)
    },
  },
})
</script>

<style scoped>
.main {
  width: 512px !important;
  max-width: calc(100% - 32px) !important;
  margin: 0 auto;
}

.gi {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
