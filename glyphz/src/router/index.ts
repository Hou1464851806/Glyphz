import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:font?',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/:font/:time',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/font/:font',
      name: 'glyphs',
      component: () => import('@/views/GlyphsView.vue'),
    },
    {
      path: '/font/:font/glyph/:unicode',
      name: 'glyph',
      component: () => import('@/views/GlyphView.vue'),
    },
    {
      path: '/explore',
      component: () => import('@/views/ExploreView.vue'),
    },
  ],
})

export default router
