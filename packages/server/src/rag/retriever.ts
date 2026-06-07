/**
 * 向量检索模块
 * 计算余弦相似度，从 post_chunks 中检索最相关的文本块
 */
import { getDatabase } from '../database';

/** 检索结果 */
export interface SearchResult {
  postId: number;
  postTitle: string;
  chunkId: number;
  chunkText: string;
  chunkIndex: number;
  score: number;
}

/** 检索参数 */
export interface SearchOptions {
  topK?: number;
  threshold?: number;
}

/**
 * 计算两个向量的余弦相似度
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 语义检索：根据查询向量找到最相似的文本块
 * @param queryEmbedding 查询向量
 * @param options 检索选项
 * @returns 排序后的检索结果
 */
export function searchSimilarChunks(
  queryEmbedding: number[],
  options: SearchOptions = {}
): SearchResult[] {
  const { topK = 5, threshold = 0.0 } = options;
  const db = getDatabase();

  // 查询所有有向量的文本块
  const chunks = db
    .prepare(
      `SELECT pc.id, pc.post_id, pc.chunk_index, pc.chunk_text, pc.embedding,
              p.title AS post_title
       FROM post_chunks pc
       JOIN posts p ON p.id = pc.post_id
       WHERE pc.embedding IS NOT NULL AND pc.embedding != ''
       ORDER BY pc.id ASC`
    )
    .all() as any[];

  if (chunks.length === 0) return [];

  // 计算每个块与查询向量的相似度
  const scored: Array<{ chunk: any; score: number }> = [];

  for (const chunk of chunks) {
    try {
      const embedding: number[] = JSON.parse(chunk.embedding);
      const score = cosineSimilarity(queryEmbedding, embedding);
      if (score >= threshold) {
        scored.push({ chunk, score });
      }
    } catch {
      // 跳过解析失败的向量
    }
  }

  // 按相似度降序排序，取 Top-K
  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, topK);

  return topResults.map((item) => ({
    postId: item.chunk.post_id,
    postTitle: item.chunk.post_title,
    chunkId: item.chunk.id,
    chunkText: item.chunk.chunk_text,
    chunkIndex: item.chunk.chunk_index,
    score: item.score,
  }));
}

/**
 * 检查是否有可用的向量数据
 */
export function hasVectorData(): boolean {
  const db = getDatabase();
  const row = db
    .prepare('SELECT COUNT(*) AS cnt FROM post_chunks WHERE embedding IS NOT NULL AND embedding != ?')
    .get('') as any;
  return row.cnt > 0;
}

/**
 * 获取向量数据统计信息
 */
export function getVectorStats(): { totalChunks: number; vectorizedPosts: number } {
  const db = getDatabase();
  const chunks = db.prepare('SELECT COUNT(*) AS cnt FROM post_chunks').get() as any;
  const posts = db
    .prepare(
      'SELECT COUNT(DISTINCT post_id) AS cnt FROM post_chunks WHERE embedding IS NOT NULL AND embedding != ?'
    )
    .get('') as any;
  return { totalChunks: chunks.cnt, vectorizedPosts: posts.cnt };
}
