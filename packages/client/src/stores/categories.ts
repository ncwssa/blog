import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Category } from '@/types'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/api/categories'

export const useCategoriesStore = defineStore('categories', () => {
  // state
  const categories = ref<Category[]>([])
  const loading = ref(false)

  // 获取所有分类
  async function fetchCategories() {
    loading.value = true
    try {
      const res = await getCategories()
      categories.value = res.data
    } catch (error) {
      console.error('获取分类列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建分类
  async function addCategory(name: string) {
    try {
      const res = await createCategory(name)
      await fetchCategories() // 刷新列表
      return res.data
    } catch (error) {
      console.error('创建分类失败:', error)
      throw error
    }
  }

  // 更新分类
  async function editCategory(id: number, name: string) {
    try {
      const res = await updateCategory(id, name)
      await fetchCategories() // 刷新列表
      return res.data
    } catch (error) {
      console.error('更新分类失败:', error)
      throw error
    }
  }

  // 删除分类
  async function removeCategory(id: number) {
    try {
      await deleteCategory(id)
      await fetchCategories() // 刷新列表
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }

  return {
    categories,
    loading,
    fetchCategories,
    addCategory,
    editCategory,
    removeCategory
  }
})
