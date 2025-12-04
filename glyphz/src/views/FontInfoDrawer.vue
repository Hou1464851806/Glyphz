<template>
  <g-drawer>
    <n-divider dashed> 基础信息 </n-divider>

    <n-input v-model:value.trim="info.name" :maxlength="30" show-count placeholder="标题" />

    <n-input v-model:value.trim="info.enName" :maxlength="63" show-count placeholder="英文标题" />

    <n-input v-model:value.trim="info.description" :maxlength="50" show-count placeholder="简介" />

    <n-checkbox v-model:checked="info.isPublic" class="vspace hspace">
      授权字塑使用该字体
    </n-checkbox>

    <n-divider dashed> 可选信息 </n-divider>

    <n-input v-model:value.trim="info.copyright" placeholder="版权" />

    <n-input v-model:value.trim="info.trademark" placeholder="商标" />

    <n-input v-model:value.trim="info.license" type="textarea" autosize placeholder="许可" />

    <n-space class="vspace" justify="center">
      <n-button
        size="large"
        type="primary"
        secondary
        :disabled="!(info.name && info.enName && info.description)"
        @click="save"
      >
        {{ font === undefined ? '新建' : '保存' }}
      </n-button>
    </n-space>

    <template v-if="font !== undefined">
      <n-divider dashed> 删除字体 </n-divider>

      <n-input
        v-model:value.trim="confirm"
        :placeholder="`该操作不可逆。请输入「${info.name}」以确认。`"
      />

      <n-space class="vspace" justify="center">
        <n-button
          size="large"
          type="error"
          secondary
          :disabled="confirm !== info.name"
          @click="deleteFont"
        >
          删除
        </n-button>
      </n-space>
    </template>
  </g-drawer>
</template>

<script setup lang="ts">
import GDrawer from '@/components/GDrawer.vue'
import { ref, watch } from 'vue'

import { useRouter } from 'vue-router'
const router = useRouter()

import { useDBStore } from '@/stores/db'
import type { FontData, FontInfo } from '@/stores/db'
const DB = useDBStore()

const emit = defineEmits(['save'])
const props = defineProps<{
  font?: FontData
}>()

const info = ref<FontInfo>({
  name: '',
  enName: '',
  description: '',
  copyright: '',
  trademark: '',
  license: '',
  isPublic: false,
})

watch(
  () => props.font,
  value => {
    if (value === undefined) {
      info.value = {
        name: '',
        enName: '',
        description: '',
        copyright: '',
        trademark: '',
        license: '',
        isPublic: false,
      }
    } else {
      const { name, enName, description, copyright, trademark, license, isPublic } = value
      info.value = { name, enName, description, copyright, trademark, license, isPublic }
    }
  }
)

watch(
  () => info.value.enName,
  value => {
    // 最低支持 63 个 ASCII 可显示字符, 除了一些括号和 `/` 和 `%`.
    // https://learn.microsoft.com/en-us/typography/opentype/spec/recom#name-strings
    if (!/^[!"#$&'*+,-.0-9:;=?@A-Z\\^_`a-z|~]+$/.test(value))
      info.value.enName = Array.from(value)
        .filter(char => /^[!"#$&'*+,-.0-9:;=?@A-Z\\^_`a-z|~]$/.test(char))
        .join('')
  }
)

const confirm = ref('')

async function save() {
  if (props.font === undefined) {
    const font = <number>await DB.addFont(info.value)
    const time = new Date().getTime()
    await router.replace({
      name: 'home',
      params: { font, time },
    })
  } else {
    await DB.updateFontInfo(props.font.id!, info.value)
    emit('save', info.value)
  }
}

async function deleteFont() {
  if (props.font === undefined) return
  await DB.deleteFont(props.font.id!)
  const time = new Date().getTime()
  await router.replace({
    name: 'home',
    params: { font: 0, time },
  })
}
</script>
