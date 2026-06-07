<script setup lang="ts">
import { useRoute } from 'vue-router'
import Icon from '@/components/common/Icon.vue'

const route = useRoute()

defineProps<{
  open: boolean
}>()

const navItems = [
  { path: '/', name: '首页', icon: 'home' as const },
  { path: '/posts', name: '博客', icon: 'file-text' as const },
  { path: '/post/new', name: '写文章', icon: 'edit' as const },
  { path: '/categories', name: '分类', icon: 'folder' as const },
  { path: '/search', name: '知识库', icon: 'search' as const },
  { path: '/ai', name: 'AI 助手', icon: 'bot' as const },
  { path: '/settings', name: '设置', icon: 'settings' as const },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside
    class="fixed lg:static inset-y-0 left-0 z-30 w-48 bg-white border-r border-gray-100 flex flex-col pt-14 lg:pt-0 transition-transform duration-200 lg:translate-x-0 sidebar-scroll"
    :class="open ? 'translate-x-0' : '-translate-x-full lg:hidden'"
  >
    <!-- 导航菜单 -->
    <nav class="flex-1 pt-4 p-2 space-y-0.5 overflow-y-auto">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all"
        :class="isActive(item.path)
          ? 'bg-[#0a0a0a] text-white shadow-sm'
          : 'text-gray-500 hover:text-[#0a0a0a] hover:bg-gray-50'"
      >
        <Icon :name="item.icon" />
        <span>{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>
