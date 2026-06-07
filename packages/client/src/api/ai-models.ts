import request from './index'
import type { ApiResponse, AIModel } from '@/types'

// 获取所有 AI 模型
export function getModels(): Promise<ApiResponse<AIModel[]>> {
  return request.get('/api/ai-models')
}

// 获取单个模型
export function getModel(id: number): Promise<ApiResponse<AIModel>> {
  return request.get(`/api/ai-models/${id}`)
}

// 创建模型
export function createModel(data: {
  provider: string
  name: string
  modelId: string
  apiKey: string
  baseUrl?: string
  isDefault?: boolean
}): Promise<ApiResponse<AIModel>> {
  return request.post('/api/ai-models', data)
}

// 更新模型
export function updateModel(
  id: number,
  data: {
    name?: string
    modelId?: string
    apiKey?: string
    baseUrl?: string
    isDefault?: boolean
    isEnabled?: boolean
  }
): Promise<ApiResponse<AIModel>> {
  return request.put(`/api/ai-models/${id}`, data)
}

// 删除模型
export function deleteModel(id: number): Promise<ApiResponse<null>> {
  return request.delete(`/api/ai-models/${id}`)
}

// 测试模型连接
export function testModelConnection(id: number): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return request.post(`/api/ai-models/${id}/test`)
}
