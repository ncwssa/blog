<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const sidebarOpen = ref(true)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#fafafa]">
    <!-- 顶部导航栏 -->
    <AppHeader :sidebar-open="sidebarOpen" @toggle-sidebar="toggleSidebar" />

    <div class="flex flex-1">
      <!-- 侧边栏 -->
      <AppSidebar :open="sidebarOpen" />

      <!-- 移动端遮罩 -->
      <Transition name="fade">
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 bg-black/20 z-20 lg:hidden"
          @click="sidebarOpen = false"
        />
      </Transition>

      <!-- 主内容区 -->
      <main
        class="flex-1 min-h-[calc(100vh-3.5rem)] overflow-auto"
      >
        <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-6 py-6">
          <router-view v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" />
            </Transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
