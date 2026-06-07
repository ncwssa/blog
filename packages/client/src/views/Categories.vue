<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import { useToast } from '@/composables/useToast'
import { generateDistinctColor } from '@/utils/colors'
import Empty from '@/components/common/Empty.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const categoriesStore = useCategoriesStore()

// 新建/编辑状态
const showForm = ref(false)
const editingId = ref<number | null>(null)
const formName = ref('')

const toast = useToast()

// 删除确认
const showDeleteConfirm = ref(false)
const deleteTarget = ref<{ id: number; name: string } | null>(null)

// 加载分类列表
onMounted(() => {
  categoriesStore.fetchCategories()
})

// 打开新建表单
function openCreateForm() {
  editingId.value = null
  formName.value = ''
  showForm.value = true
}

// 打开编辑表单
function openEditForm(id: number, name: string) {
  editingId.value = id
  formName.value = name
  showForm.value = true
}

// 取消表单
function cancelForm() {
  showForm.value = false
  editingId.value = null
  formName.value = ''
}

// 保存分类（新建或编辑）
async function handleSave() {
  if (!formName.value.trim()) {
    toast.warning('请输入分类名称')
    return
  }

  try {
    if (editingId.value) {
      await categoriesStore.editCategory(editingId.value, { name: formName.value.trim() })
    } else {
      const existingColors = categoriesStore.categories.map((c) => c.color)
      const color = generateDistinctColor(existingColors)
      await categoriesStore.addCategory(formName.value.trim(), color)
    }
    cancelForm()
  } catch (error) {
    toast.error(editingId.value ? '更新失败，请稍后重试' : '创建失败，请稍后重试')
  }
}

// 删除分类
function handleDelete(id: number, name: string) {
  deleteTarget.value = { id, name }
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  const { id } = deleteTarget.value
  showDeleteConfirm.value = false
  deleteTarget.value = null
  try {
    await categoriesStore.removeCategory(id)
  } catch (error) {
    toast.error('删除失败，请稍后重试')
  }
}
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-lg font-semibold text-[#0a0a0a]">分类管理</h1>
        <p class="text-sm text-gray-400 mt-1">管理博客文章的分类标签</p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 h-9 bg-[#0a0a0a] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        @click="openCreateForm"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        新建分类
      </button>
    </div>

    <!-- 内联表单 -->
    <div v-if="showForm" class="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
      <div class="flex items-center gap-3">
        <input
          v-model="formName"
          type="text"
          :placeholder="editingId ? '编辑分类名称' : '输入新分类名称'"
          class="flex-1 px-4 h-10 text-sm bg-gray-50 border-0 rounded-xl outline-none focus:bg-gray-100 transition-colors placeholder:text-gray-300"
          @keyup.enter="handleSave"
        />
        <button
          class="px-4 h-10 bg-[#0a0a0a] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          @click="handleSave"
        >
          {{ editingId ? '更新' : '创建' }}
        </button>
        <button
          class="px-4 h-10 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          @click="cancelForm"
        >
          取消
        </button>
      </div>
    </div>

    <!-- 确认删除弹窗 -->
    <ConfirmDialog
      v-model:show="showDeleteConfirm"
      title="删除分类"
      :message="`确定要删除分类&quot;${deleteTarget?.name || ''}&quot;吗？删除后该分类下的文章将变为未分类。`"
      confirm-text="删除"
      :danger="true"
      @confirm="confirmDelete"
    />

    <!-- 加载状态 -->
    <div v-if="categoriesStore.loading" class="flex justify-center py-20">
      <div class="text-sm text-gray-300">加载中...</div>
    </div>

    <!-- 空状态 -->
    <Empty
      v-else-if="categoriesStore.categories.length === 0"
      message="暂无分类，点击上方按钮创建第一个分类"
      icon="📂"
    />

    <!-- 分类列表 -->
    <div v-else class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-50">
            <th class="text-left px-5 py-3.5 text-xs font-medium text-gray-400">分类名称</th>
            <th class="text-left px-5 py-3.5 text-xs font-medium text-gray-400">类型</th>
            <th class="text-left px-5 py-3.5 text-xs font-medium text-gray-400">文章数</th>
            <th class="text-right px-5 py-3.5 text-xs font-medium text-gray-400">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="cat in categoriesStore.categories"
            :key="cat.id"
            class="hover:bg-gray-50/50 transition-colors"
          >
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2">
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :style="{ backgroundColor: cat.color || '#d1d5db' }"
                />
                <span class="text-sm font-medium text-[#0a0a0a]">{{ cat.name }}</span>
              </div>
            </td>
            <td class="px-5 py-3.5">
              <span
                v-if="cat.is_preset"
                class="px-2 py-0.5 text-[11px] bg-gray-100 text-gray-500 rounded-lg"
              >
                预设
              </span>
              <span
                v-else
                class="px-2 py-0.5 text-[11px] bg-gray-50 text-gray-400 rounded-lg"
              >
                自定义
              </span>
            </td>
            <td class="px-5 py-3.5">
              <span class="text-sm text-gray-500">{{ cat.post_count ?? 0 }}</span>
            </td>
            <td class="px-5 py-3.5 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  class="px-2.5 h-7 text-xs rounded-lg transition-colors"
                  :class="cat.is_preset
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-[#0a0a0a] hover:bg-gray-100'"
                  :disabled="!!cat.is_preset"
                  @click="openEditForm(cat.id, cat.name)"
                >
                  编辑
                </button>
                <button
                  class="px-2.5 h-7 text-xs rounded-lg transition-colors"
                  :class="cat.is_preset
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-red-400 hover:text-red-500 hover:bg-red-50'"
                  :disabled="!!cat.is_preset"
                  @click="handleDelete(cat.id, cat.name)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
