<template>
  <g-drawer>
    <template v-if="DB.user === undefined">
      <n-divider dashed> 登陆 </n-divider>

      <n-input v-model:value.trim="name" :maxlength="30" placeholder="用户名" />

      <n-input
        v-model:value.trim="password"
        type="password"
        show-password-on="click"
        :maxlength="30"
        placeholder="密码"
      />

      <n-text class="hspace" :depth="3"> * 若未注册则自动注册 </n-text>

      <n-space justify="center">
        <n-button
          size="large"
          type="primary"
          secondary
          :disabled="!(name && password)"
          @click="login"
        >
          登陆
        </n-button>
      </n-space>
    </template>

    <template v-else>
      <n-divider dashed>
        {{ DB.user.name }}
      </n-divider>

      <n-space justify="center">
        <n-button size="large" type="primary" secondary @click="syncConfig">
          云保存设置项
        </n-button>
      </n-space>

      <n-space justify="center">
        <n-button size="large" type="error" secondary @click="logout"> 退出登陆 </n-button>
      </n-space>
    </template>
  </g-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GDrawer from '@/components/GDrawer.vue'

import { useMessage } from 'naive-ui'
const message = useMessage()

import { useDBStore } from '@/stores/db'
const DB = useDBStore()

const name = ref(localStorage.getItem('userName') ?? '')
const password = ref('')

async function login() {
  try {
    await DB.newUserLogin(name.value, password.value)
    message.success('登陆成功')
  } catch (e) {
    if ((e as Error).message === '403') message.error('密码错误')
    else message.error('网络异常，登陆失败')
  }
}

async function syncConfig() {
  try {
    await DB.syncConfig()
    message.success('保存成功')
  } catch (e) {
    message.error('网络异常，保存失败')
  }
}

async function logout() {
  await DB.userLogout()
  message.success('登出成功')
}
</script>
