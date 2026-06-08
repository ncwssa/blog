/**
 * 向量检索模块
 * 通过 sqlite-vec 的 vec0 虚拟表进行 KNN 向量搜索
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
 * 将 number[] 补零到指定维度，返回 Float32Array
 * sqlite-vec 的 vec0 表要求同一表内所有向量维度一致
 * OpenAI text-embedding-3-small: 1536 维
 * 智谱 embedding-2: 1024 维 → 补零到 1536
 * 通义千问 text-embedding-v2: 1536 维
 */
export function padToDim(vec: number[], dim: number): Float32Array {
  const result = new Float32Array(dim);
  for (let i = 0; i < Math.min(vec.length, dim); i++) {
    result[i] = vec[i];
  }
  return result;
}

/**
 * 语义检索：通过 vec0 的 MATCH 进行 KNN 搜索
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

  const queryFloat = padToDim(queryEmbedding, 1536);

  // vec0 的 distance 是余弦距离（0=完全相同，2=完全相反）
  // 映射到 [0, 1] 相似度: score = (2 - distance) / 2
  // 用 k 限制返回数，threshold 在 JS 层对 score 过滤（更直观）
  const rows = db
    .prepare(
      `SELECT vc.chunk_id, vc.distance,
              pc.post_id, pc.chunk_index, pc.chunk_text,
              p.title AS post_title
       FROM vec_chunks vc
       JOIN post_chunks pc ON pc.id = vc.chunk_id
       JOIN posts p ON p.id = pc.post_id
       WHERE vc.embedding MATCH ?
         AND k = ?
       ORDER BY vc.distance`
    )
    .all(queryFloat, topK * 3) as any[];

  // 在 JS 层计算 score 并应用阈值过滤
  // threshold: 0=显示全部, 0.5=显示 50%+ 的匹配
  return rows
    .map((row) => ({
      postId: row.post_id,
      postTitle: row.post_title,
      chunkId: row.chunk_id,
      chunkText: row.chunk_text,
      chunkIndex: row.chunk_index,
      score: Math.max(0, (2 - row.distance) / 2),
    }))
    .filter(r => r.score >= threshold)
    .slice(0, topK);
}

/**
 * 检查是否有可用的向量数据
 */
export function hasVectorData(): boolean {
  const db = getDatabase();
  const row = db
    .prepare("SELECT COUNT(*) AS cnt FROM vec_chunks")
    .get() as any;
  return row.cnt > 0;
}

/**
 * 获取向量数据统计信息
 */
export function getVectorStats(): { totalChunks: number; vectorizedPosts: number } {
  const db = getDatabase();
  const chunks = db.prepare("SELECT COUNT(*) AS cnt FROM vec_chunks").get() as any;
  const posts = db
    .prepare(
      `SELECT COUNT(DISTINCT pc.post_id) AS cnt
       FROM vec_chunks vc
       JOIN post_chunks pc ON pc.id = vc.chunk_id`
    )
    .get() as any;
  return { totalChunks: chunks.cnt, vectorizedPosts: posts.cnt };
}
