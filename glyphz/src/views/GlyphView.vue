<template>
  <main>
    <g-title :title="DB.unicodeToChar(unicode)" :go="`/${font}`" />

    <n-space justify="center" v-if="preview.length">
      <n-card class="preview-container">
        <g-preview :glyphs="preview" :highlight="DB.unicodeToChar(unicode)" :font-id="font" />
      </n-card>
    </n-space>

    <canvas
      ref="canvas"
      class="canvas"
      :width="1024"
      :height="1024"
      :style="{
        width: `${canvasWidth}px`,
        height: `${canvasWidth}px`,
      }"
      @touchstart="e => touchHandler(e, 'start')"
      @touchmove="e => touchHandler(e, 'move')"
      @touchend="e => touchHandler(e, 'end')"
      @touchcancel="e => touchHandler(e, 'end')"
      @mousedown="e => mouseHandler(e, 'start')"
      @mousemove="e => mouseHandler(e, 'move')"
      @mouseup="e => mouseHandler(e, 'end')"
      @mouseleave="e => mouseHandler(e, 'end')"
    />

    <g-operations>
      <n-button tertiary @click="undo" :disabled="lines.length === 0">
        <n-icon><undo-alt /></n-icon>
      </n-button>

      <n-button tertiary @click="redo" :disabled="undoLines.length === 0">
        <n-icon><redo-alt /></n-icon>
      </n-button>

      <n-button secondary @click="save" :disabled="lines.length === 0">
        <n-icon><arrow-right /></n-icon>
      </n-button>

      <n-button tertiary @click="settings = !settings">
        <n-icon><cog /></n-icon>
      </n-button>

      <n-button tertiary @click="clear" :disabled="lines.length === 0">
        <n-icon><eraser /></n-icon>
      </n-button>
    </g-operations>

    <n-drawer v-model:show="settings" height="80%" placement="bottom">
      <n-drawer-content>
        <n-space vertical>
          <n-divider dashed> 字后留白 </n-divider>
          <n-slider
            v-model:value="marginRight"
            :min="-1024"
            :max="1024"
            :tooltip="false"
            :step="64"
          />
          <n-input-number
            v-model:value.number="marginRight"
            :min="-1024"
            :max="1024"
            class="round"
          />
          <n-text class="hspace"
            >*
            生成字体时，画布左右留白将被裁切，您可于此手动添加右侧留白。该选项仅作用于当前文字。</n-text
          >

          <n-divider dashed> 定位辅助 </n-divider>
          <n-space justify="center">
            <n-button
              v-for="(v, i) in gridTypes"
              :key="i"
              :type="gridType === i ? 'primary' : 'default'"
              secondary
              size="large"
              @click="gridType = i"
            >
              {{ v }}
            </n-button>
          </n-space>

          <n-divider dashed> 书写介质 </n-divider>
          <n-space justify="center">
            <n-button
              :type="allowMouse ? 'primary' : 'default'"
              secondary
              size="large"
              @click="allowMouse = !allowMouse"
            >
              鼠标
            </n-button>

            <n-tooltip :show-arrow="false" trigger="hover">
              <template #trigger>
                <n-button
                  :type="allowTouch ? 'primary' : 'default'"
                  secondary
                  size="large"
                  @click="allowTouch = !allowTouch"
                >
                  手指
                </n-button>
              </template>
              该选项仅适用于 iOS 设备
            </n-tooltip>

            <n-tooltip :show-arrow="false" trigger="hover">
              <template #trigger>
                <n-button
                  :type="allowPencil ? 'primary' : 'default'"
                  secondary
                  size="large"
                  @click="allowPencil = !allowPencil"
                >
                  Apple Pencil
                </n-button>
              </template>
              该选项仅适用于 iOS 设备
            </n-tooltip>
          </n-space>

          <n-divider dashed> 画布大小 </n-divider>
          <n-slider
            v-model:value="canvasWidth"
            :min="96"
            :max="maxCanvasWidth"
            :tooltip="false"
            :step="32"
          />
          <n-input-number
            v-model:value.number="canvasWidth"
            :min="96"
            :max="maxCanvasWidth"
            class="round"
          />

          <n-divider dashed> 笔刷粗细 </n-divider>
          <n-slider
            v-model:value="lineWidthRatio"
            :min="32"
            :max="192"
            :tooltip="false"
            :step="32"
          />
          <n-input-number
            v-model:value.number="lineWidthRatio"
            :min="32"
            :max="192"
            class="round"
          />

          <n-divider dashed> 笔刷稳定 </n-divider>
          <n-slider
            v-model:value="lineWidthChangeRatio"
            :min="0"
            :max="1"
            :tooltip="false"
            :step="0.1"
          />
          <n-input-number
            v-model:value.number="lineWidthChangeRatio"
            :min="0"
            :max="1"
            :step="0.01"
            class="round"
          />

          <n-divider dashed> 压力范围 </n-divider>
          <n-slider
            v-model:value="forceRange"
            range
            :min="0"
            :max="1"
            :tooltip="false"
            :step="0.05"
            :formatTooltip="(n: number) => `${(100 * n).toFixed(0)}%`"
          />
          <n-grid x-gap="8" :cols="2">
            <n-gi>
              <n-input-number
                v-model:value.number="forceRange[0]"
                :min="0"
                :max="forceRange[1]"
                :step="0.01"
                class="round"
              />
            </n-gi>
            <n-gi>
              <n-input-number
                v-model:value.number="forceRange[1]"
                :min="forceRange[0]"
                :max="100"
                :step="0.01"
                class="round"
              />
            </n-gi>
          </n-grid>
        </n-space>
      </n-drawer-content>
    </n-drawer>
  </main>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { UndoAlt, RedoAlt, ArrowRight, Cog, Eraser } from '@vicons/fa'
import GTitle from '@/components/GTitle.vue'
import GOperations from '@/components/GOperations.vue'
import GPreview from '@/components/GPreview.vue'

import { useDBStore } from '@/stores/db'
import type { Preview } from '@/stores/db'
const DB = useDBStore()

import { trace } from 'potrace'
import paper from 'paper'
paper.setup({ width: 1024, height: 1024 })

interface Point {
  x: number
  y: number
  force: number
}

interface SafariTouch extends Touch {
  touchType: string
}

type Line = Array<Point>
type Phase = 'start' | 'move' | 'end'

export default defineComponent({
  components: { UndoAlt, RedoAlt, ArrowRight, Cog, Eraser, GTitle, GOperations, GPreview },
  data: () => ({
    font: NaN,
    unicode: '0',
    preview: [] as Preview,

    /**
     * 书写仅支持单点触控. `touchId` 变量用于记录有关数据.
     * - 当没有输入时, `touchId` 为 `undefined`.
     * - 当使用手指或 Apple Pencil 时, `touchId` 为当前触点的标识符.
     * - 当使用鼠标时, `touchId` 为 -1.
     */
    touchId: undefined as number | undefined,

    lines: [] as Array<Line>,
    undoLines: [] as Array<Line>,
    points: [] as Array<Point>,
    lineWidth: 0,

    settings: false,

    allowMouse: localStorage.getItem('canvasWidth') !== 'false',
    allowTouch: localStorage.getItem('canvasWidth') !== 'false',
    allowPencil: localStorage.getItem('allowPencil') !== 'false',

    marginRight: 64,
    gridType: parseInt(localStorage.getItem('gridType') ?? '1'),
    canvasWidth: parseInt(localStorage.getItem('canvasWidth') ?? '256'),
    lineWidthRatio: parseInt(localStorage.getItem('lineWidthRatio') ?? '96'),
    lineWidthChangeRatio: parseFloat(localStorage.getItem('lineWidthChangeRatio') ?? '0.3'),
    forceRange: [
      parseFloat(localStorage.getItem('minForce') ?? '0.3'),
      parseFloat(localStorage.getItem('maxForce') ?? '1'),
    ],

    maxCanvasWidth: 512,
    gridTypes: ['无', '米字格', '田字格', '九宫格', '基线'],

    /**
     * 笔刷宽度乘子与压力的函数关系.
     * @param {number} force 压力值, 范围为 [0,1].
     * @returns {number} 笔刷宽度乘子, 范围为 [0,1].
     */
    forceCurve: (force: number): number => Math.log1p(force) / Math.log1p(1),
    // forceCurve: (force: number): number => Math.expm1(force) / Math.expm1(1),

    DB,
  }),
  computed: {
    canvasScaleRatio(): number {
      return 1024 / this.canvasWidth
    },
  },
  watch: {
    allowMouse: (v: boolean) => localStorage.setItem('allowMouse', v.toString()),
    allowTouch: (v: boolean) => localStorage.setItem('allowTouch', v.toString()),
    allowPencil: (v: boolean) => localStorage.setItem('allowPencil', v.toString()),

    gridType(v: number) {
      localStorage.setItem('gridType', v.toString())
      this.redraw()
    },
    canvasWidth: (v: number) => localStorage.setItem('canvasWidth', v.toString()),
    lineWidthRatio(v: number) {
      localStorage.setItem('lineWidthRatio', v.toString())
      this.redraw()
    },
    lineWidthChangeRatio(v: number) {
      localStorage.setItem('lineWidthChangeRatio', v.toString())
      this.redraw()
    },
    forceRange(v: number[]) {
      if (v[0] > v[1]) {
        this.forceRange = [v[1], v[0]]
        return
      }
      this.redraw()
      localStorage.setItem('minForce', v[0].toString())
      localStorage.setItem('maxForce', v[1].toString())
    },
  },
  async mounted() {
    this.font = Number(this.$route.params.font)
    this.unicode = this.$route.params.unicode.toString()

    const str = DB.getCurrentPartOfTargetString(DB.unicodeToChar(this.unicode))
    this.preview = await DB.getPreviewGlyphs(this.font, str)

    const ctx = this.ctx()
    ctx.strokeStyle = 'white'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    this.drawGrid()

    this.maxCanvasWidth = Math.min(document.body.clientWidth - 32, 512)
  },
  methods: {
    canvas() {
      return <HTMLCanvasElement>this.$refs.canvas
    },
    ctx() {
      return this.canvas().getContext('2d')!
    },
    drawGrid() {
      const ctx = this.ctx()
      ctx.save()

      ctx.lineWidth = 8
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'

      const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
      }
      const drawRect = () => ctx.strokeRect(128, 128, 768, 768)
      const drawVLine = (x: number) => drawLine(x, 128, x, 896)
      const drawHLine = (y: number) => drawLine(128, y, 896, y)
      const drawLTRBLine = () => drawLine(128, 128, 896, 896)
      const drawRTLBLine = () => drawLine(896, 128, 128, 896)

      const drawGrid = (
        rect: boolean,
        ltrb: boolean,
        rtlb: boolean,
        xs: number[],
        ys: number[]
      ) => {
        if (rect) drawRect()
        ctx.setLineDash([16, 16])
        ctx.beginPath()
        if (ltrb) drawLTRBLine()
        if (rtlb) drawRTLBLine()
        for (const x of xs) drawVLine(x)
        for (const y of ys) drawHLine(y)
        ctx.stroke()
        ctx.setLineDash([])
      }

      switch (this.gridType) {
        case 1: // 米字格
          drawGrid(true, true, true, [512], [512])
          break
        case 2: // 田字格
          drawGrid(true, false, false, [512], [512])
          break
        case 3: // 九宫格
          drawGrid(true, false, false, [384, 640], [384, 640])
          break
        case 4: // 基线
          drawGrid(false, false, false, [], [256, 768])
          break
      }

      ctx.restore()
    },
    curvedForce(force: number) {
      return Math.max(this.forceRange[0], Math.min(this.forceRange[1], this.forceCurve(force)))
    },
    getPoint(e: Touch | MouseEvent) {
      const { offsetTop, offsetLeft } = this.canvas()
      return <Point>{
        x: (e.pageX - offsetLeft) * this.canvasScaleRatio,
        y: (e.pageY - offsetTop) * this.canvasScaleRatio,
        force: (<Touch>e).force || 0.5,
      }
    },
    addPoint(point: Point, phase: Phase, isUndo?: true) {
      const ctx = this.ctx()

      this.points.push(point)
      let { x, y, force } = point

      if (phase === 'start') {
        ctx.beginPath()
        ctx.moveTo(x, y)
        this.lineWidth = this.curvedForce(this.forceRange[0])
        return
      }

      if (phase === 'move') {
        this.lineWidth =
          this.curvedForce(force) * this.lineWidthChangeRatio +
          this.lineWidth * (1 - this.lineWidthChangeRatio)
        ctx.lineWidth = this.lineWidth * this.lineWidthRatio
      }

      if (this.points.length < 2) {
        ctx.lineTo(x, y)
      } else {
        let prev = this.points[this.points.length - 2]
        x = (x + prev.x) / 2
        y = (y + prev.y) / 2
        ctx.quadraticCurveTo(prev.x, prev.y, x, y)
      }
      ctx.stroke()

      if (phase === 'move') {
        ctx.beginPath()
        ctx.moveTo(x, y)
      }

      if (phase === 'end') {
        if (isUndo === undefined) {
          this.lines.push([...this.points])
          this.undoLines = []
        }
        this.points = []
        this.touchId = undefined
      }
    },
    redraw() {
      if (this.touchId !== undefined) return

      const { width, height } = this.canvas()
      this.ctx().clearRect(0, 0, width, height)
      this.drawGrid()

      for (const line of this.lines)
        for (let i = 0; i < line.length; i++)
          this.addPoint(line[i], i === 0 ? 'start' : i === line.length - 1 ? 'end' : 'move', true)
    },
    undo() {
      if (this.touchId !== undefined) return
      if (this.lines.length === 0) return

      this.undoLines.push(this.lines.pop()!)
      this.redraw()
    },
    redo() {
      if (this.touchId !== undefined) return
      if (this.undoLines.length === 0) return

      this.lines.push(this.undoLines.pop()!)
      this.redraw()
    },
    clear() {
      while (this.lines.length) this.undo()
    },
    touchHandler(event: TouchEvent, phase: Phase) {
      event.preventDefault()
      event.stopPropagation()

      let touch = event.touches[0]
      if (phase !== 'end' && touch === undefined) return

      if (!this.allowTouch && (<SafariTouch>touch)?.touchType === 'direct') return

      if (phase === 'start') {
        if (this.touchId !== undefined) return
        this.touchId = touch.identifier
      }

      if (phase === 'move') {
        if (this.touchId !== touch.identifier) return
      }

      if (phase === 'end') {
        if (this.touchId === undefined) return

        const ids = new Array(event.changedTouches.length)
          .fill(0)
          .map((v, i) => event.changedTouches[i].identifier)

        if (!ids.includes(this.touchId)) return
        touch = event.changedTouches[ids.indexOf(this.touchId)]
      }

      this.addPoint(this.getPoint(touch), phase)
    },
    mouseHandler(event: MouseEvent, phase: Phase) {
      event.preventDefault()
      event.stopPropagation()

      if (!this.allowMouse) return

      if (phase === 'start') {
        if (this.touchId !== undefined) return
        this.touchId = -1
      } else if (this.touchId !== -1) return

      this.addPoint(this.getPoint(event), phase)
    },
    async save() {
      const { width, height } = this.canvas()
      const original = this.ctx().getImageData(0, 0, width, height)
      const reversed = this.ctx().getImageData(0, 0, width, height)
      reversed.data.forEach((v, i) => {
        // ImageData.data 每四个元素分别代表一个像素的 RGBA.
        reversed.data[i] = i % 4 === 3 ? (v === 255 ? v : 0) : 255 - v
      })

      this.ctx().putImageData(reversed, 0, 0)

      await new Promise<void>((resolve, reject) => {
        this.canvas().toBlob(async blob => {
          this.ctx().putImageData(original, 0, 0)

          if (blob === null) return reject('blob is null')

          trace(Buffer.from(await blob.arrayBuffer()), async (err, svg) => {
            if (err) reject(err.message)
            svg = svg.match(/d="([^"]+)"/)![1]

            const path = new paper.CompoundPath(svg)
            svg = path.reorient(false).pathData

            await DB.addOrUpdateGlyph(this.font, this.unicode, svg, this.marginRight)
            resolve()
          })
        }, 'image/png')
      })

      if (DB.isThereNextTargetChar()) await DB.routeToNextTargetChar(this.$router)
      else await this.$router.replace(`/${this.font}`)
    },
  },
})
</script>

<style scoped>
.preview-container {
  width: fit-content;
  margin-bottom: 16px;
}

.canvas {
  display: block;
  margin: 0 auto;
  background-color: rgba(0, 0, 0, 0.35);
  border-radius: 16px;
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  transition: all 0.5s;
}
</style>
