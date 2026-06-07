<script setup lang="ts">
// 顶部导航栏组件
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 sticky top-0 z-50">
    <!-- 左侧 Logo/名称 -->
    <div class="flex items-center space-x-2">
      <span class="text-xl font-bold text-primary-600">📘 知识博客</span>
    </div>
    <!-- 右侧搜索框占位 -->
    <div class="flex items-center">
      <div class="relative">
        <input
          type="text"
          placeholder="搜索文章..."
          class="w-64 px-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled
        />
      </div>
    </div>
  </header>
</template>
