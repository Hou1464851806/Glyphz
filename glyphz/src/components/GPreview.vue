<template>
  <div style="text-align: left">
    <template v-for="glyph of glyphs">
      <br v-if="glyph === '\n'" />
      <n-text
        v-else-if="typeof glyph === 'string'"
        class="text"
        :style="textStyle"
        :class="glyph === highlight ? 'highlight' : ''"
        @click="route(false, glyph)"
      >
        {{ glyph }}
      </n-text>
      <svg
        v-else
        :height="height"
        :viewBox="viewBox(glyph)"
        :style="{ marginRight: (Math.min(glyph.marginRight, 0) / 1024) * height }"
        @click="route(true, glyph.unicode)"
      >
        <path stroke="none" fill="white" :d="glyph.svg" />
      </svg>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'

import { useDBStore } from '@/stores/db'
const DB = useDBStore()

import type { GlyphData, Preview } from '@/stores/glyphz'

export default defineComponent({
  props: {
    height: { type: Number, default: 32 },
    glyphs: Array as PropType<Preview>,
    highlight: String,
    fontId: Number,
  },
  computed: {
    textStyle() {
      return {
        fontSize: this.height * 0.75 + 'px',
        lineHeight: this.height + 'px',
        // top: this.height / 8 + 'px',
      }
    },
  },
  methods: {
    viewBox(glyph: GlyphData) {
      return `${glyph.xMin}, 0, ${glyph.xMax - glyph.xMin + Math.max(0, glyph.marginRight)}, 1024`
    },
    async route(isUnicode: boolean, char: string) {
      if (!this.fontId) return
      await DB.routeToGlyph(
        this.$router,
        this.fontId,
        isUnicode ? char : DB.charToUnicode(char),
        this.highlight,
        !!this.highlight
      )
    },
  },
})
</script>

<style scoped>
.text {
  vertical-align: top;
  position: relative;
}

.highlight {
  color: rgba(255, 255, 255, 0.85);
  font-weight: bold;
}
</style>
