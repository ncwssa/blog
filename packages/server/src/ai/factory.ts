import type { LLMProvider, LLMConfig } from './types';
import { OpenAIProvider } from './providers/openai';

/** 支持的厂商类型 */
export type ProviderType = 'openai' | 'zhipu' | 'qwen' | 'deepseek';

/** 厂商 -> Provider 类映射（目前统一使用 OpenAI 兼容适配器） */
const providerMap: Record<ProviderType, new (config: LLMConfig) => LLMProvider> = {
  openai: OpenAIProvider,
  zhipu: OpenAIProvider,
  qwen: OpenAIProvider,
  deepseek: OpenAIProvider,
};

/** 厂商默认 baseUrl */
const DEFAULT_BASE_URLS: Record<ProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  deepseek: 'https://api.deepseek.com',
};

/** 厂商默认 Embedding 模型 */
const DEFAULT_EMBEDDING_MODELS: Record<ProviderType, string> = {
  openai: 'text-embedding-3-small',
  zhipu: 'embedding-2',
  qwen: 'text-embedding-v2',
  deepseek: 'deepseek-embedding', // DeepSeek 独立 embedding 模型
};

/**
 * 创建 LLM Provider 实例
 */
export function createLLMProvider(
  provider: ProviderType,
  config: Partial<LLMConfig> & { apiKey: string }
): LLMProvider {
  const ProviderClass = providerMap[provider];
  if (!ProviderClass) {
    throw new Error(`不支持的 AI 厂商: ${provider}`);
  }

  const fullConfig: LLMConfig = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl || DEFAULT_BASE_URLS[provider],
    model: config.model || DEFAULT_EMBEDDING_MODELS[provider],
    provider,
    embeddingModel: DEFAULT_EMBEDDING_MODELS[provider],
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 4096,
  };

  return new ProviderClass(fullConfig);
}

export { DEFAULT_BASE_URLS, DEFAULT_EMBEDDING_MODELS };

/** 支持 Embedding 的厂商列表 */
export const EMBEDDING_ENABLED_PROVIDERS: ProviderType[] = ['openai', 'zhipu', 'qwen'];

/** 判断厂商是否支持 Embedding */
export function supportsEmbedding(provider: string): boolean {
  return EMBEDDING_ENABLED_PROVIDERS.includes(provider as ProviderType);
}
