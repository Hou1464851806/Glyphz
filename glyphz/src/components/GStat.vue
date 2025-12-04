<template>
  <n-space justify="center">
    <n-grid :cols="14" :x-gap="0" :y-gap="0">
      <n-gi v-for="(v, i) of data" :key="i">
        <n-tooltip :show-arrow="false" trigger="hover">
          <template #trigger>
            <div
              class="dot"
              :style="{
                backgroundColor: `hsl(134, 36%, ${100 - 54 * v.percentage}%)`,
                opacity: v.percentage ? 1 : 0.15,
              }"
            />
          </template>

          <n-text> <n-time :time="v.time" type="date" /> </n-text>
          <br />
          <n-text> {{ v.cloudActivity + v.localActivity }} 次书写 </n-text>
          <template v-if="v.localActivity">
            <br />
            <n-text> {{ v.localActivity }} 次未同步 </n-text>
          </template>
        </n-tooltip>
      </n-gi>
    </n-grid>
  </n-space>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useDBStore } from '@/stores/db'
const DB = useDBStore()

export default defineComponent({
  props: {
    fontId: Number,
  },
  data: () => ({
    data: [] as Array<{
      time: number
      cloudActivity: number
      localActivity: number
      percentage: number
    }>,
  }),
  async mounted() {
    this.data = (await DB.getActivities(this.fontId)).map(v => ({
      ...v,
      percentage: Math.min(v.cloudActivity + v.localActivity, 50) / 50,
    }))
  },
})
</script>

<style scoped>
.dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin: 1px;
}
</style>
