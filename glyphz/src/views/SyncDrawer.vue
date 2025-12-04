<template>
  <g-drawer>
    <n-divider dashed> 同步 </n-divider>

    <n-space justify="center">
      <n-text v-if="unauthorized"> 您尚未登陆，无法与云端同步。 </n-text>

      <n-text v-else-if="forbidden">
        该字体属于 {{ font?.userName }}，您无法将其与云端同步。
      </n-text>

      <n-button v-else size="large" type="primary" secondary @click="sync" :loading="loading">
        云同步
      </n-button>
    </n-space>

    <n-divider dashed> 统计 </n-divider>

    <n-row>
      <n-col :span="12">
        <n-statistic label="国标字数" :value="font!.gbkCount">
          <template #suffix>
            <small> / 7445 </small>
          </template>
        </n-statistic>
      </n-col>

      <n-col :span="12">
        <n-statistic label="总字数" :value="font!.unicodes.length" />
      </n-col>
    </n-row>

    <n-row>
      <n-col :span="12">
        <n-statistic label="更新于">
          <n-time :time="font!.updateTime" :to="new Date().getTime()" type="relative" />
        </n-statistic>
      </n-col>

      <n-col :span="12">
        <n-statistic label="同步于">
          <n-text v-if="font!.syncTime === 0"> 未曾 </n-text>
          <n-time v-else :time="font!.syncTime" :to="new Date().getTime()" type="relative" />
        </n-statistic>
      </n-col>
    </n-row>

    <n-divider dashed> 手迹 </n-divider>
    <g-stat :font-id="font!.id" />
  </g-drawer>
</template>

<script setup lang="ts">
import GDrawer from '@/components/GDrawer.vue'
import GStat from '@/components/GStat.vue'

import { ref, computed } from 'vue'

import { useDBStore } from '@/stores/db'
const DB = useDBStore()

import type { FontData } from '@/stores/glyphz'

import { useRouter } from 'vue-router'
const router = useRouter()

import { useMessage } from 'naive-ui'
const message = useMessage()

const props = defineProps<{
  font?: FontData
}>()

const unauthorized = computed(() => DB.user === undefined)
const forbidden = computed(() => {
  return props.font?.userName !== undefined && props.font?.userName !== DB.user?.name
})

const loading = ref(false)
async function sync() {
  const font = props.font!.id!
  const time = new Date().getTime()

  message.loading('同步中…')
  loading.value = true

  await DB.syncFont(font)

  message.destroyAll()
  message.success('同步成功')
  loading.value = false

  await router.replace({
    name: 'home',
    params: { font, time },
  })
}
</script>
