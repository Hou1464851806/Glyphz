<template>
  <g-drawer>
    <n-divider dashed> 摘句 </n-divider>

    <n-input v-model:value.trim="target" type="textarea" autosize placeholder="要书写的句子" />

    <n-checkbox v-model:checked="noRepeat" class="vspace hspace"> 跳过已写过的字 </n-checkbox>

    <n-space class="vspace" justify="center">
      <n-button size="large" type="primary" secondary :disabled="disabled" @click="write">
        写字
      </n-button>
    </n-space>

    <n-divider dashed> 预设 </n-divider>

    <n-space justify="center">
      <n-button v-for="(v, i) in presets" :key="i" secondary @click="target = v.str">
        {{ v.name }}
      </n-button>
    </n-space>
  </g-drawer>
</template>

<script setup lang="ts">
import { ref, watch, computed, toRef } from 'vue'
import GDrawer from '@/components/GDrawer.vue'
import presets from '@/assets/presets.json'

import { useDBStore, type FontData } from '@/stores/db'
const DB = useDBStore()

import { useRouter } from 'vue-router'
const router = useRouter()

const props = defineProps<{
  font?: FontData
  target: string
}>()

const target = toRef(props.target)
watch(props, value => (target.value = value.target))

const noRepeat = ref(localStorage.getItem('noRepeat') !== 'false')
watch(noRepeat, value => localStorage.setItem('noRepeat', value.toString()))

const disabled = computed(() => {
  if (target.value.length === 0) return true
  if (noRepeat.value === false) return false
  if (props.font === undefined) return false
  return Array.from(target.value).every(char =>
    props.font!.unicodes.includes(DB.charToUnicode(char))
  )
})

async function write() {
  if (props.font!.id === undefined) return
  await DB.setTargetString(props.font!.id, target.value, noRepeat.value)
  await DB.routeToNextTargetChar(router)
}
</script>
