/**
 * RAG 流程编排模块
 * 提供索引构建和语义搜索的对外接口
 */
import { getDatabase } from '../database';
import { splitText, estimateTokens } from './chunker';
import { generateEmbedding, generateEmbeddings } from './embedding';
import { searchSimilarChunks } from './retriever';
import type { SearchResult, SearchOptions } from './retriever';

/** 索引一篇博客：分块 + 生成 Embedding + 存储 */
export async function indexPost(postId: number): Promise<{
  success: boolean;
  chunks: number;
  vectorized: boolean;
  error?: string;
}> {
  const db = getDatabase();
  const post = db.prepare('SELECT id, title, content FROM posts WHERE id = ?').get(postId) as any;
  if (!post) {
    console.warn(`[RAG] 文章不存在: ${postId}`);
    return { success: false, chunks: 0, vectorized: false, error: '文章不存在' };
  }

  // 1. 清空旧的分块
  db.prepare('DELETE FROM post_chunks WHERE post_id = ?').run(postId);

  // 2. 文本分块
  const chunks = splitText(post.content);
  if (chunks.length === 0) {
    db.prepare('UPDATE posts SET is_vectorized = 1 WHERE id = ?').run(postId);
    return { success: true, chunks: 0, vectorized: true };
  }

  // 3. 批量生成 Embedding
  let embeddings: number[][] | null = null;
  let embedError: string | undefined;
  try {
    embeddings = await generateEmbeddings(chunks);
    if (!embeddings) {
      embedError = '无支持 Embedding 的 AI 模型可用';
    }
  } catch (error: any) {
    embedError = error.message || 'Embedding 生成失败';
  }

  // 4. 存储分块（和向量）
  const insertChunk = db.prepare(
    'INSERT INTO post_chunks (post_id, chunk_index, chunk_text, embedding, token_count) VALUES (?, ?, ?, ?, ?)'
  );

  const insertMany = db.transaction(() => {
    for (let i = 0; i < chunks.length; i++) {
      const embedding = embeddings?.[i] ? JSON.stringify(embeddings[i]) : null;
      const tokens = estimateTokens(chunks[i]);
      insertChunk.run(postId, i, chunks[i], embedding, tokens);
    }
  });

  insertMany();

  // 5. 标记为已向量化
  db.prepare('UPDATE posts SET is_vectorized = 1 WHERE id = ?').run(postId);

  const vectorized = !!embeddings;
  console.log(`[RAG] 索引完成: postId=${postId}, chunks=${chunks.length}, vectorized=${vectorized}${embedError ? ', error=' + embedError : ''}`);
  return { success: true, chunks: chunks.length, vectorized, error: embedError };
}

/** 删除一篇博客的所有分块 */
export function deletePostChunks(postId: number): void {
  const db = getDatabase();
  db.prepare('DELETE FROM post_chunks WHERE post_id = ?').run(postId);
  db.prepare('UPDATE posts SET is_vectorized = 0 WHERE id = ?').run(postId);
  console.log(`[RAG] 分块已删除: postId=${postId}`);
}

/** 全量重建向量索引 */
export async function reindexAll(): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  vectorized: number;
  chunked: number;
  errors: string[];
}> {
  const db = getDatabase();
  const posts = db.prepare('SELECT id, title, content FROM posts ORDER BY id ASC').all() as any[];

  let succeeded = 0;
  let failed = 0;
  let vectorized = 0;
  let chunked = 0;
  const errors: string[] = [];

  for (const post of posts) {
    try {
      const result = await indexPost(post.id);
      if (result.success) {
        succeeded++;
        if (result.vectorized) {
          vectorized++;
        } else {
          chunked++;
        }
        if (result.error) {
          errors.push(`${post.title}: ${result.error}`);
        }
      } else {
        failed++;
        errors.push(`${post.title}: ${result.error || '索引失败'}`);
      }
    } catch (error: any) {
      console.error(`[RAG] 重建索引失败: postId=${post.id}`, error);
      failed++;
      errors.push(`${post.title}: ${error.message || '未知错误'}`);
    }
  }

  console.log(`[RAG] 全量重建完成: total=${posts.length}, vectorized=${vectorized}, chunked=${chunked}, failed=${failed}`);
  return { total: posts.length, succeeded, failed, vectorized, chunked, errors };
}

/** 语义搜索（有向量则语义搜索，无向量则降级为文本关键词搜索） */
export async function semanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<{ results: SearchResult[]; hasVectorData: boolean; isFallback: boolean }> {
  const db = getDatabase();
  const { topK = 10, threshold = 0.0 } = options;

  // 1. 检查是否有向量数据
  const vectorCount = db
    .prepare("SELECT COUNT(*) AS cnt FROM post_chunks WHERE embedding IS NOT NULL AND embedding != ''")
    .get() as any;

  const hasVectors = vectorCount.cnt > 0;

  if (hasVectors) {
    // 2. 有向量数据：语义搜索
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding) {
      const results = searchSimilarChunks(queryEmbedding, options);
      return { results, hasVectorData: true, isFallback: false };
    }
    // 能生成向量但检索失败，继续降级
  }

  // 3. 无向量数据（或向量生成失败）：降级为文本关键词搜索
  const keyword = `%${query}%`;
  const rows = db
    .prepare(
      `SELECT pc.id, pc.post_id, pc.chunk_index, pc.chunk_text,
              p.title AS post_title
       FROM post_chunks pc
       JOIN posts p ON p.id = pc.post_id
       WHERE pc.chunk_text LIKE ?
       ORDER BY pc.id ASC
       LIMIT ?`
    )
    .all(keyword, topK) as any[];

  const results: SearchResult[] = rows.map((row: any) => ({
    postId: row.post_id,
    postTitle: row.post_title,
    chunkId: row.id,
    chunkText: row.chunk_text,
    chunkIndex: row.chunk_index,
    score: 0.5, // 文本搜索无相似度评分，给默认中间值
  }));

  // 如果 chunks 表也空（从未索引过），回退到标题搜索
  if (results.length === 0) {
    const postRows = db
      .prepare(
        `SELECT id, title, content FROM posts WHERE title LIKE ? ORDER BY created_at DESC LIMIT ?`
      )
      .all(keyword, topK) as any[];

    for (const row of postRows) {
      results.push({
        postId: row.id,
        postTitle: row.title,
        chunkId: 0,
        chunkText: (row.content || '').slice(0, 200),
        chunkIndex: 0,
        score: 0.3,
      });
    }
  }

  return { results, hasVectorData: hasVectors, isFallback: true };
}

export { SearchResult, SearchOptions };

