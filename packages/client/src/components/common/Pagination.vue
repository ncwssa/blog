<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  page: number
  pageSize: number
  total: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:page', page: number): void
}>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const pageNumbers = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, props.page - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value && p !== props.page) {
    emit('update:page', p)
  }
}
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 mt-8">
    <button
      :disabled="page <= 1"
      class="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:text-[#0a0a0a] hover:bg-gray-100"
      @click="goToPage(page - 1)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>

    <button
      v-for="p in pageNumbers"
      :key="p"
      class="min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-all"
      :class="p === page
        ? 'bg-[#0a0a0a] text-white shadow-sm'
        : 'text-gray-500 hover:text-[#0a0a0a] hover:bg-gray-100'"
      @click="goToPage(p)"
    >
      {{ p }}
    </button>

    <button
      :disabled="page >= totalPages"
      class="w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:text-[#0a0a0a] hover:bg-gray-100"
      @click="goToPage(page + 1)"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
    </button>

    <span class="text-xs text-gray-400 ml-3">
      第 {{ page }}/{{ totalPages }} 页 · 共 {{ total }} 条
    </span>
  </div>
</template>
