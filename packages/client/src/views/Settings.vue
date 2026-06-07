<script setup lang="ts">
// 设置页面 — 后续阶段实现模型管理、数据导入导出等功能
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-[#0a0a0a]">系统设置</h1>
      <p class="text-sm text-gray-400 mt-1">管理系统配置、AI 模型和数据迁移</p>
    </div>

    <div class="grid gap-4">
      <!-- AI 模型管理 -->
      <div class="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 class="text-sm font-semibold text-[#0a0a0a] mb-1">🤖 AI 模型管理</h2>
        <p class="text-sm text-gray-500 mb-4">配置和管理 AI 大模型 API，支持 OpenAI、智谱AI、通义千问、DeepSeek 等。</p>
        <p class="text-xs text-gray-300">将在后续阶段实现</p>
      </div>

      <!-- 数据管理 -->
      <div class="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 class="text-sm font-semibold text-[#0a0a0a] mb-1">📦 数据管理</h2>
        <p class="text-sm text-gray-500 mb-4">导出或导入博客数据，支持 JSON 格式，保障数据安全可迁移。</p>
        <p class="text-xs text-gray-300">将在后续阶段实现</p>
      </div>
    </div>
  </div>
</template>
