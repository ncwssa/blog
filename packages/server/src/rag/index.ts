/**
 * RAG 流程编排模块
 * 提供索引构建和语义搜索的对外接口
 */
import { getDatabase } from '../database';
import { splitText, estimateTokens } from './chunker';
import { generateEmbedding, generateEmbeddings } from './embedding';
import { searchSimilarChunks, padToDim, hasVectorData } from './retriever';
import type { SearchResult, SearchOptions } from './retriever';

/** vec0 固定维度（1536 覆盖 OpenAI/通义千问，智谱 1024 补零） */
const VEC_DIM = 1536;

/** 索引一篇博客：分块 + 生成 Embedding + 存储到 vec0 */
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

  // 1. 清空旧的分块和向量
  db.prepare('DELETE FROM vec_chunks WHERE chunk_id IN (SELECT id FROM post_chunks WHERE post_id = ?)').run(postId);
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

  // 4. 存储分块到 post_chunks，向量到 vec_chunks
  const insertChunk = db.prepare(
    'INSERT INTO post_chunks (post_id, chunk_index, chunk_text, embedding, token_count) VALUES (?, ?, ?, ?, ?)'
  );
  const insertVec = db.prepare(
    'INSERT INTO vec_chunks (chunk_id, embedding) VALUES (CAST(? AS INTEGER), ?)'
  );

  const insertMany = db.transaction(() => {
    for (let i = 0; i < chunks.length; i++) {
      const embedding = embeddings?.[i] ? JSON.stringify(embeddings[i]) : null;
      const tokens = estimateTokens(chunks[i]);

      // 先插入 post_chunks，获取 chunk_id
      const info = insertChunk.run(postId, i, chunks[i], embedding, tokens);
      const chunkId = Number(info.lastInsertRowid);

      // 如果有向量，插入 vec_chunks
      if (embeddings?.[i]) {
        const padded = padToDim(embeddings[i], VEC_DIM);
        insertVec.run(chunkId, padded);
      }
    }
  });

  insertMany();

  // 5. 标记为已向量化
  db.prepare('UPDATE posts SET is_vectorized = 1 WHERE id = ?').run(postId);

  const vectorized = !!embeddings;
  console.log(`[RAG] 索引完成: postId=${postId}, chunks=${chunks.length}, vectorized=${vectorized}${embedError ? ', error=' + embedError : ''}`);
  return { success: true, chunks: chunks.length, vectorized, error: embedError };
}

/** 删除一篇博客的所有分块和向量 */
export function deletePostChunks(postId: number): void {
  const db = getDatabase();
  db.transaction(() => {
    // vec0 无 ON DELETE CASCADE，需手动先删向量
    db.prepare('DELETE FROM vec_chunks WHERE chunk_id IN (SELECT id FROM post_chunks WHERE post_id = ?)').run(postId);
    db.prepare('DELETE FROM post_chunks WHERE post_id = ?').run(postId);
    db.prepare('UPDATE posts SET is_vectorized = 0 WHERE id = ?').run(postId);
  })();
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

  const hasVectors = hasVectorData();

  if (hasVectors) {
    // 2. 有向量数据：通过 vec0 语义搜索
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding) {
      const results = searchSimilarChunks(queryEmbedding, options);
      return { results, hasVectorData: true, isFallback: false };
    }
    // 能生成向量但检索失败，继续降级
  }

  // 3. 无向量数据（或向量生成失败）：降级为文本+分类名关键词搜索
  const keyword = `%${query}%`;

  // 3a. 搜 chunk 内容
  const chunkRows = db
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

  const seenPostIds = new Set<number>();
  for (const row of chunkRows) {
    seenPostIds.add(row.post_id);
  }

  const results: SearchResult[] = chunkRows.map((row: any) => ({
    postId: row.post_id,
    postTitle: row.post_title,
    chunkId: row.id,
    chunkText: row.chunk_text,
    chunkIndex: row.chunk_index,
    score: 0.5,
  }));

  // 3b. 搜标题（排除已出现的文章）
  if (results.length < topK) {
    const titleRows = db
      .prepare(
        `SELECT id, title, content FROM posts
         WHERE title LIKE ?
           AND id NOT IN (${[...seenPostIds].map(() => '?').join(',') || '0'})
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(keyword, ...seenPostIds, topK - results.length) as any[];

    for (const row of titleRows) {
      seenPostIds.add(row.id);
      results.push({
        postId: row.id,
        postTitle: row.title,
        chunkId: 0,
        chunkText: (row.content || '').slice(0, 200),
        chunkIndex: 0,
        score: 0.4,
      });
    }
  }

  // 3c. 搜分类名（排除已出现的文章）
  if (results.length < topK) {
    const excludeIds = [...seenPostIds];
    const placeholders = excludeIds.map(() => '?').join(',') || '0';
    const catRows = db
      .prepare(
        `SELECT p.id AS post_id, p.title, p.content,
                c.name AS category_name
         FROM posts p
         JOIN post_categories pc ON pc.post_id = p.id
         JOIN categories c ON c.id = pc.category_id
         WHERE c.name LIKE ?
           AND p.id NOT IN (${placeholders})
         LIMIT ?`
      )
      .all(keyword, ...excludeIds, topK - results.length) as any[];

    for (const row of catRows) {
      results.push({
        postId: row.post_id,
        postTitle: row.title,
        chunkId: 0,
        chunkText: (row.content || '').slice(0, 200),
        chunkIndex: 0,
        score: 0.35,
      });
    }
  }

  return { results, hasVectorData: hasVectors, isFallback: true };
}

export { SearchResult, SearchOptions };

