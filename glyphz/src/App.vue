<template>
  <n-config-provider :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </n-message-provider>
  </n-config-provider>

  <div
    class="background"
    :style="{ backgroundImage: `url('/backgrounds/${DB.background}.jpeg')` }"
  />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

import { themeOverrides } from '@/assets/overrides'
import { zhCN, dateZhCN } from 'naive-ui'

import pinia from '@/stores/pinia'
import { useDBStore } from '@/stores/db'
const DB = useDBStore(pinia)

onMounted(async () => {
  if (localStorage.getItem('userName') !== null) await DB.userLogin()
})
</script>

<style scoped>
.background {
  position: fixed;
  left: 0;
  top: 0;
  z-index: -114514;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: black;
  background-size: cover;
  background-position: 50% 50%;
}
</style>
