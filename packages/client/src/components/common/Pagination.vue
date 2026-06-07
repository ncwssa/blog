<script setup lang="ts">
import { computed } from 'vue'

// 分页组件
interface Props {
  page: number
  pageSize: number
  total: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:page', page: number): void
}>()

// 计算总页数
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

// 是否可以翻页
const canPrev = computed(() => props.page > 1)
const canNext = computed(() => props.page < totalPages.value)

// 生成页码列表（最多显示 5 个页码）
const pageNumbers = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, props.page - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value && p !== props.page) {
    emit('update:page', p)
  }
}
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center space-x-2 mt-6">
    <!-- 上一页 -->
    <button
      :disabled="!canPrev"
      class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
      :class="canPrev
        ? 'border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer'
        : 'border-gray-200 text-gray-400 cursor-not-allowed'"
      @click="goToPage(page - 1)"
    >
      上一页
    </button>

    <!-- 页码 -->
    <button
      v-for="p in pageNumbers"
      :key="p"
      class="w-8 h-8 text-sm rounded-lg border transition-colors"
      :class="p === page
        ? 'bg-blue-600 text-white border-blue-600'
        : 'border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer'"
      @click="goToPage(p)"
    >
      {{ p }}
    </button>

    <!-- 下一页 -->
    <button
      :disabled="!canNext"
      class="px-3 py-1.5 text-sm rounded-lg border transition-colors"
      :class="canNext
        ? 'border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer'
        : 'border-gray-200 text-gray-400 cursor-not-allowed'"
      @click="goToPage(page + 1)"
    >
      下一页
    </button>

    <!-- 页码信息 -->
    <span class="text-sm text-gray-500 ml-4">
      共 {{ total }} 条，第 {{ page }}/{{ totalPages }} 页
    </span>
  </div>
</template>
