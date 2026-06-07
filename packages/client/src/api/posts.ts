import request from './index'
import type { ApiResponse, PaginatedData, Post } from '@/types'

// 获取博客列表
export function getPosts(params?: {
  page?: number
  pageSize?: number
  categoryId?: number
  keyword?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}): Promise<ApiResponse<PaginatedData<Post>>> {
  return request.get('/api/posts', { params })
}

// 获取博客详情
export function getPost(id: number): Promise<ApiResponse<Post>> {
  return request.get(`/api/posts/${id}`)
}

// 创建博客（支持多分类）
export function createPost(data: {
  title: string
  content: string
  categoryIds?: number[]
}): Promise<ApiResponse<Post>> {
  return request.post('/api/posts', data)
}

// 更新博客（支持多分类）
export function updatePost(
  id: number,
  data: {
    title?: string
    content?: string
    categoryIds?: number[]
  }
): Promise<ApiResponse<Post>> {
  return request.put(`/api/posts/${id}`, data)
}

// 删除博客
export function deletePost(id: number): Promise<ApiResponse<null>> {
  return request.delete(`/api/posts/${id}`)
}
