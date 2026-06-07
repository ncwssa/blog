<script setup lang="ts">
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部导航栏 -->
    <AppHeader />
    <div class="flex flex-1">
      <!-- 左侧边栏 -->
      <AppSidebar />
      <!-- 主内容区 -->
      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>
