/** AI 模块共享类型 */

/** 聊天消息角色 */
export type ChatRole = 'system' | 'user' | 'assistant';

/** 聊天消息 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** LLM 配置 */
export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider?: string;        // 厂商类型，用于 Embedding 默认行为
  embeddingModel?: string;  // 指定 Embedding 模型名（可选，不指定则用厂商默认）
  temperature?: number;
  maxTokens?: number;
}

/** 对话结果 */
export interface ChatResult {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/** 流式数据块 */
export interface StreamChunk {
  content: string;
  done: boolean;
  tokensUsed?: number;
}

/** 统一的 LLM Provider 接口 */
export interface LLMProvider {
  /** 普通对话（非流式） */
  chat(messages: ChatMessage[], config?: Partial<LLMConfig>): Promise<ChatResult>;

  /** 流式对话 */
  chatStream(messages: ChatMessage[], config?: Partial<LLMConfig>): AsyncGenerator<StreamChunk>;

  /** 生成 Embedding 向量 */
  embedding(text: string): Promise<number[]>;

  /** 批量生成 Embedding */
  embeddingBatch(texts: string[]): Promise<number[][]>;
}
