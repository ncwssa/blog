// 分类信息片段（嵌入在文章中的）
export interface CategoryInfo {
  id: number
  name: string
  color: string | null
}

// 博客文章类型
export interface Post {
  id: number
  title: string
  content: string
  categories: CategoryInfo[]
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
  color: string | null
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

// ===== AI 模型 =====

export interface AIModel {
  id: number
  provider: string
  name: string
  model_id: string
  api_key?: string
  base_url: string
  is_default: number
  is_enabled: number
  config: Record<string, any>
  created_at: string
  updated_at: string
  supportsEmbedding?: boolean
}

export interface AIModelForm {
  provider: string
  name: string
  modelId: string
  apiKey: string
  baseUrl: string
  isDefault: boolean
}

// ===== 语义搜索结果 =====

export interface SearchResult {
  postId: number
  postTitle: string
  chunkId: number
  chunkText: string
  chunkIndex: number
  score: number
}

// 语义搜索响应
export interface SearchResponse {
  results: SearchResult[]
  hasVectorData: boolean
  isFallback: boolean
}

// 重建索引响应
export interface ReindexResponse {
  total: number
  succeeded: number
  failed: number
  vectorized: number
  chunked: number
  errors: string[]
  hasEmbeddingModel: boolean
  tip?: string
}

// ===== AI 对话 =====

export interface Conversation {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export interface Citation {
  title: string
  postId: number
}

export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant'
  content: string
  citations: Citation[]
  tokens_used: number
  created_at: string
}

export interface ChatStreamData {
  content: string
  done: boolean
  citations?: Citation[]
  tokensUsed?: number
  error?: string
}

export interface SummarizeResponse {
  postId: number
  postTitle: string
  summary: string
  tokensUsed: { prompt: number; completion: number; total: number }
}
