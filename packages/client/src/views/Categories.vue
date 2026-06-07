<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import Empty from '@/components/common/Empty.vue'

const categoriesStore = useCategoriesStore()

// 新建/编辑状态
const showForm = ref(false)
const editingId = ref<number | null>(null)
const formName = ref('')

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
    alert('请输入分类名称')
    return
  }

  try {
    if (editingId.value) {
      await categoriesStore.editCategory(editingId.value, formName.value.trim())
      alert('更新成功')
    } else {
      await categoriesStore.addCategory(formName.value.trim())
      alert('创建成功')
    }
    cancelForm()
  } catch (error) {
    alert(editingId.value ? '更新失败，请稍后重试' : '创建失败，请稍后重试')
  }
}

// 删除分类
async function handleDelete(id: number, name: string) {
  if (!window.confirm(`确定要删除分类"${name}"吗？删除后该分类下的文章将变为未分类。`)) return
  try {
    await categoriesStore.removeCategory(id)
    alert('删除成功')
  } catch (error) {
    alert('删除失败，请稍后重试')
  }
}
</script>

<template>
  <div>
    <!-- 顶部：标题 + 新建按钮 -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">分类管理</h1>
      <button
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        @click="openCreateForm"
      >
        + 新建分类
      </button>
    </div>

    <!-- 内联表单 -->
    <div v-if="showForm" class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div class="flex items-center gap-3">
        <input
          v-model="formName"
          type="text"
          :placeholder="editingId ? '编辑分类名称' : '输入新分类名称'"
          class="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @keyup.enter="handleSave"
        />
        <button
          class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          @click="handleSave"
        >
          {{ editingId ? '更新' : '创建' }}
        </button>
        <button
          class="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          @click="cancelForm"
        >
          取消
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="categoriesStore.loading" class="flex justify-center py-16">
      <div class="text-gray-400 text-sm">加载中...</div>
    </div>

    <!-- 空状态 -->
    <Empty
      v-else-if="categoriesStore.categories.length === 0"
      message="暂无分类，点击上方按钮创建第一个分类"
      icon="📂"
    />

    <!-- 分类列表 -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200">
            <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">分类名称</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">文章数</th>
            <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="cat in categoriesStore.categories"
            :key="cat.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-5 py-3.5">
              <span class="text-sm font-medium text-gray-800">{{ cat.name }}</span>
            </td>
            <td class="px-5 py-3.5">
              <span
                v-if="cat.is_preset"
                class="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-full"
              >
                预设
              </span>
              <span
                v-else
                class="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
              >
                自定义
              </span>
            </td>
            <td class="px-5 py-3.5">
              <span class="text-sm text-gray-600">{{ cat.post_count ?? 0 }}</span>
            </td>
            <td class="px-5 py-3.5 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  class="px-2.5 py-1 text-xs rounded-md transition-colors"
                  :class="cat.is_preset
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-50'"
                  :disabled="!!cat.is_preset"
                  @click="openEditForm(cat.id, cat.name)"
                >
                  编辑
                </button>
                <button
                  class="px-2.5 py-1 text-xs rounded-md transition-colors"
                  :class="cat.is_preset
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-600 hover:bg-red-50'"
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
