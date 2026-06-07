<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

// 导航菜单配置
const menuItems = [
  { path: '/', name: '博客列表', icon: '📝' },
  { path: '/post/new', name: '写博客', icon: '✏️' },
  { path: '/categories', name: '分类管理', icon: '📂' },
  { path: '/ai', name: 'AI 助手', icon: '🤖' },
]

// 判断当前路由是否激活
function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <aside class="w-60 bg-gray-100 border-r border-gray-200 min-h-[calc(100vh-3.5rem)]">
    <nav class="p-4 space-y-1">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="isActive(item.path)
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'"
      >
        <span class="text-lg">{{ item.icon }}</span>
        <span>{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>
