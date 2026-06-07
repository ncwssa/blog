import request from './index'
import type { ApiResponse, Category } from '@/types'

// 获取所有分类
export function getCategories(): Promise<ApiResponse<Category[]>> {
  return request.get('/api/categories')
}

// 创建分类（支持颜色）
export function createCategory(name: string, color?: string): Promise<ApiResponse<Category>> {
  return request.post('/api/categories', { name, color })
}

// 更新分类（支持名称和颜色）
export function updateCategory(
  id: number,
  data: { name?: string; color?: string }
): Promise<ApiResponse<Category>> {
  return request.put(`/api/categories/${id}`, data)
}

// 删除分类
export function deleteCategory(id: number): Promise<ApiResponse<null>> {
  return request.delete(`/api/categories/${id}`)
}
