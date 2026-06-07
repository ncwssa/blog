import type { LLMProvider, ChatMessage, LLMConfig, ChatResult, StreamChunk } from '../types';

/**
 * OpenAI 兼容适配器
 * 兼容：OpenAI、DeepSeek、通义千问（兼容模式）、智谱AI（兼容模式）
 */
export class OpenAIProvider implements LLMProvider {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[], config?: Partial<LLMConfig>): Promise<ChatResult> {
    const merged = { ...this.config, ...config };
    const response = await fetch(`${merged.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merged.apiKey}`,
      },
      body: JSON.stringify({
        model: merged.model,
        messages,
        temperature: merged.temperature ?? 0.7,
        max_tokens: merged.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI 请求失败 [${response.status}]: ${err}`);
    }

    const data = (await response.json()) as any;
    return {
      content: data.choices[0].message.content,
      tokensUsed: {
        prompt: data.usage?.prompt_tokens ?? 0,
        completion: data.usage?.completion_tokens ?? 0,
        total: data.usage?.total_tokens ?? 0,
      },
    };
  }

  async *chatStream(messages: ChatMessage[], config?: Partial<LLMConfig>): AsyncGenerator<StreamChunk> {
    const merged = { ...this.config, ...config };
    const response = await fetch(`${merged.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${merged.apiKey}`,
      },
      body: JSON.stringify({
        model: merged.model,
        messages,
        stream: true,
        temperature: merged.temperature ?? 0.7,
        max_tokens: merged.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI 流式请求失败 [${response.status}]: ${err}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const payload = trimmed.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload) as any;
            const content = json.choices?.[0]?.delta?.content || '';
            yield { content, done: false };
          } catch {
            // 跳过无法解析的行
          }
        }
      }
    }

    yield { content: '', done: true };
  }

  /**
   * 生成单条文本的 Embedding 向量
   */
  async embedding(text: string): Promise<number[]> {
    const { baseUrl: url, apiKey, model, embeddingModel, provider } = this.config;
    const embedModel = model.includes('embedding') ? model : (embeddingModel || 'text-embedding-3-small');
    const embedUrl = this.getEmbeddingUrl(url);

    const response = await fetch(embedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: embedModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Embedding 请求失败 [${response.status}]: ${err}`);
    }

    const data = (await response.json()) as any;
    return data.data[0].embedding;
  }

  /**
   * 批量生成 Embedding 向量
   */
  async embeddingBatch(texts: string[]): Promise<number[][]> {
    const { baseUrl: url, apiKey, model, embeddingModel } = this.config;
    const embedModel = model.includes('embedding') ? model : (embeddingModel || 'text-embedding-3-small');
    const embedUrl = this.getEmbeddingUrl(url);

    const response = await fetch(embedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: embedModel,
        input: texts,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Batch Embedding 请求失败 [${response.status}]: ${err}`);
    }

    const data = (await response.json()) as any;
    return data.data.map((item: any) => item.embedding);
  }

  /**
   * 获取 Embedding API 的完整 URL
   * 不同厂商的 embedding 端点路径不同
   */
  private getEmbeddingUrl(baseUrl: string): string {
    // 如果 baseUrl 已包含 API 版本号（如 /v1、/v4），直接在后面加 /embeddings
    // 例如: https://api.openai.com/v1     → /v1/embeddings
    //       https://open.bigmodel.cn/api/paas/v4 → /v4/embeddings
    //       https://api.deepseek.com         → /v1/embeddings（兜底）
    if (/\/v\d+$/.test(baseUrl)) {
      return `${baseUrl}/embeddings`;
    }
    return `${baseUrl}/v1/embeddings`;
  }
}
