<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchText = ref('')

defineProps<{
  sidebarOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

function handleSearch() {
  if (searchText.value.trim()) {
    router.push({ name: 'Search', query: { q: searchText.value.trim() } })
    searchText.value = ''
  }
}
</script>

<template>
  <header
    class="h-14 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30"
  >
    <!-- 左侧：汉堡菜单 + Logo -->
    <div class="flex items-center gap-3">
      <button
        class="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        @click="emit('toggle-sidebar')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <button
        class="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        @click="emit('toggle-sidebar')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <router-link to="/" class="flex items-center gap-2">
        <span class="w-7 h-7 bg-[#0a0a0a] rounded-lg flex items-center justify-center text-white text-xs font-bold">K</span>
        <span class="text-sm font-semibold text-[#0a0a0a] hidden sm:block">知识博客</span>
      </router-link>
    </div>

    <!-- 右侧：全局搜索 -->
    <div class="relative w-full max-w-xs">
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        v-model="searchText"
        type="text"
        placeholder="搜索..."
        class="w-full pl-9 pr-3 h-9 text-sm bg-gray-100 rounded-xl border-0 outline-none focus:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-all placeholder:text-gray-400"
        @keyup.enter="handleSearch"
      />
    </div>
  </header>
</template>
