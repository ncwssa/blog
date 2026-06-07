<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
  icon?: string
}>(), {
  message: '暂无数据',
  icon: '📭'
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20">
    <span class="text-4xl mb-4">{{ icon }}</span>
    <p class="text-sm text-gray-400">{{ message }}</p>
    <slot />
  </div>
</template>
