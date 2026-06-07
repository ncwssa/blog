// 博客文章类型
export interface Post {
  id: number
  title: string
  content: string
  category_id: number | null
  category_name?: string
  summary: string | null
  word_count: number
  is_vectorized: number
  created_at: string
  updated_at: string
}

// 分类类型
export interface Category {
  id: number
  name: string
  is_preset: number
  post_count?: number
  created_at: string
  updated_at: string
}

// API 统一响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页数据
export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
