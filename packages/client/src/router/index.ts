import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'Home', component: () => import('@/views/Home.vue') },
      { path: 'posts', name: 'PostList', component: () => import('@/views/PostList.vue') },
      { path: 'post/new', name: 'PostCreate', component: () => import('@/views/PostEdit.vue') },
      { path: 'post/edit/:id', name: 'PostEdit', component: () => import('@/views/PostEdit.vue') },
      { path: 'post/:id', name: 'PostDetail', component: () => import('@/views/PostDetail.vue') },
      { path: 'categories', name: 'Categories', component: () => import('@/views/Categories.vue') },
      { path: 'search', name: 'Search', component: () => import('@/views/Search.vue') },
      { path: 'ai', name: 'AIChat', component: () => import('@/views/AIChat.vue') },
      { path: 'settings', name: 'Settings', component: () => import('@/views/Settings.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
