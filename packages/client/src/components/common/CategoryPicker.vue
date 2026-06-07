<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import type { Category, CategoryInfo } from '@/types'
import { generateDistinctColor } from '@/utils/colors'
import CategoryTag from './CategoryTag.vue'

const props = defineProps<{
  modelValue: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const categoriesStore = useCategoriesStore()

// 下拉展开状态
const open = ref(false)
const panelRef = ref<HTMLElement | null>(null)

// 新建分类输入
const newName = ref('')
const creating = ref(false)

// 所有分类列表（从 store 获取）
const allCategories = computed(() => categoriesStore.categories)

// 选中的分类完整信息
const selectedCategories = computed<CategoryInfo[]>(() => {
  return allCategories.value
    .filter((c) => props.modelValue.includes(c.id))
    .map((c) => ({ id: c.id, name: c.name, color: c.color }))
})

// 切换分类选择
function toggleCategory(cat: Category) {
  const idx = props.modelValue.indexOf(cat.id)
  if (idx >= 0) {
    emit('update:modelValue', props.modelValue.filter((id) => id !== cat.id))
  } else {
    emit('update:modelValue', [...props.modelValue, cat.id])
  }
}

// 移除选中的分类
function removeCategory(id: number) {
  emit('update:modelValue', props.modelValue.filter((v) => v !== id))
}

// 新建分类并选中
async function handleCreate() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const existingColors = allCategories.value.map((c) => c.color)
    const color = generateDistinctColor(existingColors)
    const cat = await categoriesStore.addCategory(newName.value.trim(), color)
    if (cat) {
      // 自动选中新建的分类
      emit('update:modelValue', [...props.modelValue, cat.id])
      newName.value = ''
    }
  } catch {
    // 错误由 store 处理
  } finally {
    creating.value = false
  }
}

// 点击外部关闭下拉
function handleClickOutside(e: MouseEvent) {
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  if (categoriesStore.categories.length === 0) {
    categoriesStore.fetchCategories()
  }
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="panelRef" class="relative">
    <!-- 选中标签展示区（点击展开） -->
    <div
      class="min-h-[40px] px-3 py-1.5 bg-gray-50 border-0 rounded-xl cursor-pointer flex flex-wrap items-center gap-1.5 transition-colors"
      :class="open ? 'bg-gray-100' : 'hover:bg-gray-100'"
      @click="open = !open"
    >
      <template v-if="selectedCategories.length > 0">
        <CategoryTag
          v-for="cat in selectedCategories"
          :key="cat.id"
          :category="cat"
          size="sm"
          :removable="true"
          @remove="removeCategory"
        />
      </template>
      <span v-else class="text-sm text-gray-400">选择分类...</span>
      <svg
        class="w-3.5 h-3.5 ml-auto text-gray-400 transition-transform"
        :class="open ? 'rotate-180' : ''"
        fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
      </svg>
    </div>

    <!-- 下拉面板 -->
    <div
      v-if="open"
      class="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden"
    >
      <!-- 分类列表（可多选） -->
      <div class="max-h-48 overflow-y-auto p-1.5">
        <div
          v-for="cat in allCategories"
          :key="cat.id"
          class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors"
          :class="modelValue.includes(cat.id) ? 'bg-gray-50' : 'hover:bg-gray-50'"
          @click="toggleCategory(cat)"
        >
          <!-- 颜色圆点 -->
          <span
            class="w-3 h-3 rounded-full shrink-0"
            :style="{ backgroundColor: cat.color || '#d1d5db' }"
          />
          <!-- 复选框 -->
          <span
            class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
            :class="modelValue.includes(cat.id)
              ? 'bg-[#0a0a0a] border-[#0a0a0a]'
              : 'border-gray-300'"
          >
            <svg v-if="modelValue.includes(cat.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </span>
          <span class="text-sm text-[#0a0a0a]">{{ cat.name }}</span>
        </div>
      </div>

      <!-- 新建分类行 -->
      <div class="border-t border-gray-100 p-2.5 flex items-center gap-2">
        <input
          v-model="newName"
          type="text"
          placeholder="新建分类..."
          class="flex-1 px-3 h-8 text-sm bg-gray-50 border-0 rounded-lg outline-none focus:bg-gray-100 transition-colors placeholder:text-gray-300"
          @keyup.enter="handleCreate"
        />
        <button
          class="shrink-0 px-3 h-8 bg-[#0a0a0a] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
          :disabled="!newName.trim() || creating"
          @click="handleCreate"
        >
          {{ creating ? '...' : '新建' }}
        </button>
      </div>
    </div>
  </div>
</template>
