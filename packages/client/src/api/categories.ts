import request from './index'
import type { ApiResponse, Category } from '@/types'

// 获取所有分类
export function getCategories(): Promise<ApiResponse<Category[]>> {
  return request.get('/api/categories')
}

// 创建分类
export function createCategory(name: string): Promise<ApiResponse<Category>> {
  return request.post('/api/categories', { name })
}

// 更新分类
export function updateCategory(id: number, name: string): Promise<ApiResponse<Category>> {
  return request.put(`/api/categories/${id}`, { name })
}

// 删除分类
export function deleteCategory(id: number): Promise<ApiResponse<null>> {
  return request.delete(`/api/categories/${id}`)
}
