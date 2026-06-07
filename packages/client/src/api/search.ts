import request from './index'
import type { ApiResponse, SearchResponse, ReindexResponse } from '@/types'

// 语义搜索
export function semanticSearch(data: {
  query: string
  topK?: number
  threshold?: number
}): Promise<ApiResponse<SearchResponse>> {
  return request.post('/api/search', data)
}

// 全量重建向量索引
export function reindexAll(): Promise<ApiResponse<ReindexResponse>> {
  return request.post('/api/search/reindex')
}

// 单篇重建索引
export function indexPost(postId: number): Promise<ApiResponse<{ success: boolean; chunks: number; vectorized: boolean; error?: string }>> {
  return request.post(`/api/search/index/${postId}`)
}
