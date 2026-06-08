import request from './index'
import type { ApiResponse, Conversation, Message, ChatStreamData, SummarizeResponse } from '@/types'

// 获取对话列表
export function getConversations(): Promise<ApiResponse<Conversation[]>> {
  return request.get('/api/ai/conversations')
}

// 创建新对话
export function createConversation(): Promise<ApiResponse<Conversation>> {
  return request.post('/api/ai/conversations')
}

// 删除对话
export function deleteConversation(id: number): Promise<ApiResponse<null>> {
  return request.delete(`/api/ai/conversations/${id}`)
}

// 获取对话历史消息
export function getMessages(conversationId: number): Promise<ApiResponse<Message[]>> {
  return request.get(`/api/ai/conversations/${conversationId}/messages`)
}

/**
 * 流式知识问答 - 使用 async 迭代方式
 * 返回一个 Promise，resolve 后即可通过 for-await-of 逐块读取 ChatStreamData
 */
export async function* chatStreamAsync(
  conversationId: number,
  query: string
): AsyncGenerator<ChatStreamData> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, query }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: '请求失败' }))
    throw new Error(err.message || `请求失败 [${response.status}]`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data: ')) {
        const payload = trimmed.slice(6)
        try {
          const data = JSON.parse(payload) as ChatStreamData
          yield data
        } catch {
          // 跳过解析失败的行
        }
      }
    }
  }
}

// 单篇博客总结
export function summarizePost(postId: number): Promise<ApiResponse<SummarizeResponse>> {
  return request.post(`/api/ai/summarize/${postId}`)
}
