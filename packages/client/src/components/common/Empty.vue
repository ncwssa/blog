<script setup lang="ts">
// 空状态提示组件
interface Props {
  message?: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  message: '暂无数据',
  icon: '📭'
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-gray-400">
    <span class="text-5xl mb-4">{{ icon }}</span>
    <p class="text-base">{{ message }}</p>
    <slot />
  </div>
</template>
