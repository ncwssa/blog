/**
 * Embedding 生成模块
 * 通过 AI Provider 将文本转化为向量
 */
import { getDatabase } from '../database';
import { createLLMProvider, supportsEmbedding } from '../ai/factory';
import type { LLMProvider } from '../ai/types';

/**
 * 获取可用的 AI Provider（用于 Embedding）
 * 优先使用默认模型，若无默认或默认不支持 Embedding 则遍历所有已启用模型
 */
function getAvailableProvider(): LLMProvider | null {
  const db = getDatabase();

  // 获取所有已启用且支持 Embedding 的模型，默认优先
  const models = db
    .prepare(
      `SELECT * FROM ai_models
       WHERE is_enabled = 1
       ORDER BY is_default DESC, id ASC`
    )
    .all() as any[];

  // 找到第一个支持 Embedding 的模型
  const usableModel = models.find((m: any) => supportsEmbedding(m.provider));

  if (!usableModel) return null;

  const config = {
    ...JSON.parse(usableModel.config || '{}'),
    apiKey: usableModel.api_key,
    baseUrl: usableModel.base_url,
    model: usableModel.model_id,
  };

  return createLLMProvider(usableModel.provider as any, config);
}

/**
 * 获取已启用模型列表（用于前端选择）
 */
export function getEnabledModels(): any[] {
  const db = getDatabase();
  return db
    .prepare(
      'SELECT id, provider, name, model_id, is_default, is_enabled FROM ai_models WHERE is_enabled = 1 ORDER BY is_default DESC, id ASC'
    )
    .all()
    .map((m: any) => ({
      ...m,
      supportsEmbedding: supportsEmbedding(m.provider),
    }));
}

/**
 * 生成单段文本的向量
 * @returns 向量数组，若无可用的 AI Provider 则返回 null
 * @throws 如果 Provider 存在但 API 调用失败
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const provider = getAvailableProvider();
  if (!provider) return null;

  return await provider.embedding(text);
}

/**
 * 批量生成向量
 * @returns 向量数组，若无可用的 AI Provider 则返回 null
 * @throws 如果 Provider 存在但 API 调用失败
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][] | null> {
  const provider = getAvailableProvider();
  if (!provider) return null;

  return await provider.embeddingBatch(texts);
}

/**
 * 测试与 AI 模型的连接是否可用
 */
export async function testModelConnection(model: {
  provider: string;
  apiKey: string;
  baseUrl: string;
  modelId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const provider = createLLMProvider(model.provider as any, {
      apiKey: model.apiKey,
      baseUrl: model.baseUrl || undefined,
      model: model.modelId,
    });

    // 发送一个简单的测试消息
    const result = await provider.chat([
      { role: 'user', content: '回复"连接成功"即可' },
    ]);

    return { success: true, message: result.content };
  } catch (error: any) {
    return { success: false, message: error.message || '连接失败' };
  }
}
