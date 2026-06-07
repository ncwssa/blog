import { Context } from 'koa';
import { semanticSearch, reindexAll, indexPost } from '../rag/index';
import { getEnabledModels } from '../rag/embedding';
import { supportsEmbedding } from '../ai/factory';

/** POST /api/search — 语义搜索 */
export async function search(ctx: Context) {
  const { query, topK = 5, threshold = 0.0 } = ctx.request.body as any;

  if (!query || !query.trim()) {
    ctx.body = { code: 400, message: '搜索关键词不能为空', data: null };
    ctx.status = 400;
    return;
  }

  try {
    const result = await semanticSearch(query.trim(), { topK, threshold });
    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        results: result.results,
        hasVectorData: result.hasVectorData,
        isFallback: result.isFallback,
      },
    };
  } catch (error: any) {
    console.error('搜索失败:', error);
    ctx.body = { code: 500, message: '搜索失败: ' + error.message, data: null };
  }
}

/** POST /api/search/reindex — 重建向量索引 */
export async function reindex(ctx: Context) {
  // 检查是否有已启用的模型
  const models = getEnabledModels();
  if (models.length === 0) {
    ctx.body = { code: 400, message: '请先在设置中配置并启用 AI 模型', data: null };
    return;
  }

  // 检查是否有支持 Embedding 的模型
  const hasEmbeddingModel = models.some((m: any) => supportsEmbedding(m.provider));

  try {
    const result = await reindexAll();

    let message = `索引重建完成: ${result.total} 篇文章`;
    if (result.errors.length > 0) {
      message += `，${result.errors.length} 个错误`;
    }

    ctx.body = {
      code: 0,
      message,
      data: {
        ...result,
        hasEmbeddingModel,
        /** 如果没有向量化的文章且没有支持 Embedding 的模型，提示用户 */
        tip: !hasEmbeddingModel
          ? '当前没有支持 Embedding 的 AI 模型（如 OpenAI、智谱AI、通义千问），文章已做分块但未生成向量，搜索将使用关键词匹配。请在设置中添加支持 Embedding 的模型后重建索引。'
          : result.vectorized === 0 && result.chunked > 0
            ? '模型已识别但 Embedding API 调用失败，请检查 API Key 是否正确，或测试连接是否正常。'
            : undefined,
      },
    };
  } catch (error: any) {
    console.error('重建索引失败:', error);
    ctx.body = { code: 500, message: '重建索引失败: ' + error.message, data: null };
  }
}

/** POST /api/search/index/:postId — 单篇重建索引 */
export async function indexSinglePost(ctx: Context) {
  const postId = Number(ctx.params.postId);
  try {
    const result = await indexPost(postId);
    ctx.body = {
      code: result.success ? 0 : 500,
      message: result.success ? '索引完成' : '索引失败',
      data: result,
    };
  } catch (error: any) {
    ctx.body = { code: 500, message: '索引失败: ' + error.message, data: null };
  }
}
