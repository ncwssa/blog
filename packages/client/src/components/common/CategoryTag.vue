<script setup lang="ts">
import type { CategoryInfo } from '@/types'

defineProps<{
  category: CategoryInfo
  size?: 'sm' | 'md'
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: [id: number]
}>()

function getColorStyle(color: string | null) {
  if (!color) return { backgroundColor: '#f3f4f6', color: '#6b7280' }
  return { backgroundColor: color + '18', color }
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-lg font-medium whitespace-nowrap transition-colors"
    :class="size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'"
    :style="getColorStyle(category.color)"
  >
    {{ category.name }}
    <button
      v-if="removable"
      class="inline-flex items-center justify-center rounded-full hover:opacity-70 transition-opacity"
      :style="{ color: category.color || '#6b7280' }"
      @click.stop="emit('remove', category.id)"
    >
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  </span>
</template>
