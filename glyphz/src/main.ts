import '@/assets/overrides.css'

import { createApp } from 'vue'
import pinia from '@/stores/pinia'
import naive from 'naive-ui'
import App from '@/App.vue'

const app = createApp(App)
app.use(pinia)
app.use(naive)

import router from './router'
app.use(router)

app.mount('#app')
