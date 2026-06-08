import { Context } from 'koa';
import { getDatabase } from '../database';
import { semanticSearch } from '../rag/index';
import { getChatProvider } from '../rag/embedding';
import type { ChatMessage, LLMProvider } from '../ai/types';
import { supportsEmbedding } from '../ai/factory';
import { generateEmbedding } from '../rag/embedding';
import { searchSimilarChunks, hasVectorData } from '../rag/retriever';

const MAX_HISTORY_ROUNDS = 10;
const RAG_TOP_K = 5;

/** 获取所有对话列表 */
export function getConversations(ctx: Context) {
  const db = getDatabase();
  const conversations = db
    .prepare('SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC')
    .all();
  ctx.body = { code: 0, message: 'success', data: conversations };
}

/** 创建新对话 */
export function createConversation(ctx: Context) {
  const db = getDatabase();
  const result = db.prepare("INSERT INTO conversations (title) VALUES ('新对话')").run();
  const conversation = db
    .prepare('SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?')
    .get(Number(result.lastInsertRowid));
  ctx.body = { code: 0, message: '创建成功', data: conversation };
}

/** 删除对话 */
export function deleteConversation(ctx: Context) {
  const id = Number(ctx.params.id);
  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM conversations WHERE id = ?').get(id);
  if (!existing) {
    ctx.body = { code: 404, message: '对话不存在', data: null };
    ctx.status = 404;
    return;
  }
  db.transaction(() => {
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
    db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  })();
  ctx.body = { code: 0, message: '删除成功', data: null };
}

/** 获取对话历史消息 */
export function getMessages(ctx: Context) {
  const conversationId = Number(ctx.params.id);
  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM conversations WHERE id = ?').get(conversationId);
  if (!existing) {
    ctx.body = { code: 404, message: '对话不存在', data: null };
    ctx.status = 404;
    return;
  }
  const messages = db
    .prepare(
      'SELECT id, conversation_id, role, content, citations, tokens_used, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC'
    )
    .all(conversationId)
    .map((m: any) => ({
      ...m,
      citations: JSON.parse(m.citations || '[]'),
    }));
  ctx.body = { code: 0, message: 'success', data: messages };
}

/**
 * 获取对话历史消息（最近 N 轮）
 */
function getHistoryMessages(conversationId: number): ChatMessage[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT role, content FROM messages
       WHERE conversation_id = ?
       ORDER BY id DESC
       LIMIT ?`
    )
    .all(conversationId, MAX_HISTORY_ROUNDS * 2) as any[];
  // 反转以恢复时间顺序
  return rows.reverse().map((r: any) => ({
    role: r.role as 'user' | 'assistant',
    content: r.content,
  }));
}

/**
 * 获取 RAG 上下文片段
 */
async function getRagContext(query: string): Promise<{ context: string; citations: { title: string; postId: number }[] }> {
  const db = getDatabase();
  const hasVectors = hasVectorData();

  if (hasVectors) {
    // 尝试语义检索
    const queryEmbedding = await generateEmbedding(query);
    if (queryEmbedding) {
      const results = searchSimilarChunks(queryEmbedding, { topK: RAG_TOP_K });
      if (results.length > 0) {
        const parts: string[] = [];
        const citations: { title: string; postId: number }[] = [];
        const seen = new Set<number>();
        for (const r of results) {
          parts.push(`[来源: ${r.postTitle}]\n${r.chunkText}`);
          if (!seen.has(r.postId)) {
            seen.add(r.postId);
            citations.push({ title: r.postTitle, postId: r.postId });
          }
        }
        return { context: parts.join('\n\n---\n\n'), citations };
      }
    }
  }

  // 降级：关键词搜索
  const keyword = `%${query}%`;
  const chunkRows = db
    .prepare(
      `SELECT pc.chunk_text, p.title AS post_title, p.id AS post_id
       FROM post_chunks pc
       JOIN posts p ON p.id = pc.post_id
       WHERE pc.chunk_text LIKE ?
       ORDER BY pc.id ASC
       LIMIT ?`
    )
    .all(keyword, RAG_TOP_K) as any[];

  if (chunkRows.length > 0) {
    const parts: string[] = [];
    const citations: { title: string; postId: number }[] = [];
    const seen = new Set<number>();
    for (const row of chunkRows) {
      parts.push(`[来源: ${row.post_title}]\n${row.chunk_text}`);
      if (!seen.has(row.post_id)) {
        seen.add(row.post_id);
        citations.push({ title: row.post_title, postId: row.post_id });
      }
    }
    return { context: parts.join('\n\n---\n\n'), citations };
  }

  // 再降级：标题搜索
  const titleRows = db
    .prepare(
      `SELECT id AS post_id, title AS post_title, content FROM posts
       WHERE title LIKE ? OR content LIKE ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(keyword, keyword, RAG_TOP_K) as any[];

  if (titleRows.length > 0) {
    const parts: string[] = [];
    const citations: { title: string; postId: number }[] = [];
    for (const row of titleRows) {
      const snippet = (row.content || '').slice(0, 200);
      parts.push(`[来源: ${row.post_title}]\n${snippet}`);
      citations.push({ title: row.post_title, postId: row.post_id });
    }
    return { context: parts.join('\n\n---\n\n'), citations };
  }

  return { context: '', citations: [] };
}

/** 构建 System Prompt */
function buildSystemPrompt(context: string): string {
  if (!context) {
    return `你是一个知识库 AI 助手，帮助用户解答问题。

请注意：
1. 当前知识库中没有找到与问题相关的内容，请基于自身的知识来回答
2. 回答开头请用 ⚠️ 标注「未从知识库中找到相关内容，以下回答基于模型自身知识」
3. 用中文回答`;
  }
  return `你是一个基于用户个人知识库的 AI 助手。请根据以下提供的知识库内容回答用户的问题。

知识库内容：
${context}

请注意：
1. 优先基于以上知识库内容回答，如果引用了某个来源，请在回答中用 [来源: 博客标题] 格式标注引用
2. 如果知识库内容不足以完全回答用户问题，你可以补充自己的知识，但需明确区分哪些来自知识库、哪些来自自身知识
3. 用中文回答`;
}

/** POST /api/ai/chat — 流式知识问答 */
export async function chat(ctx: Context) {
  const { query, conversationId } = ctx.request.body as any;

  if (!query || !query.trim()) {
    ctx.body = { code: 400, message: '请输入问题', data: null };
    ctx.status = 400;
    return;
  }

  if (!conversationId) {
    ctx.body = { code: 400, message: '缺少对话 ID', data: null };
    ctx.status = 400;
    return;
  }

  const db = getDatabase();

  // 验证对话存在
  const conversation = db.prepare('SELECT id, title FROM conversations WHERE id = ?').get(conversationId) as any;
  if (!conversation) {
    ctx.body = { code: 404, message: '对话不存在', data: null };
    ctx.status = 404;
    return;
  }

  // 检查是否有可用的聊天模型
  const chatProvider = getChatProvider();
  if (!chatProvider) {
    ctx.body = { code: 400, message: '未配置可用的 AI 模型，请先在设置中配置并启用一个 AI 模型', data: null };
    ctx.status = 400;
    return;
  }

  const trimmedQuery = query.trim();

  // 1. RAG 检索
  const { context, citations } = await getRagContext(trimmedQuery);

  // 2. 构造 messages 数组
  const systemPrompt = buildSystemPrompt(context);
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  // 添加历史消息
  const history = getHistoryMessages(conversationId);
  messages.push(...history);

  // 添加当前用户消息
  messages.push({ role: 'user', content: trimmedQuery });

  // 3. 保存用户消息
  db.prepare(
    'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
  ).run(conversationId, 'user', trimmedQuery);

  // 4. 设置 SSE
  ctx.set('Content-Type', 'text/event-stream');
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');
  ctx.status = 200;

  let fullContent = '';
  let totalTokens = 0;

  try {
    const stream = chatProvider.chatStream(messages);

    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content;
        // SSE 格式: data: {...}\n\n
        ctx.res.write(`data: ${JSON.stringify({ content: chunk.content, done: false })}\n\n`);
      }
      if (chunk.tokensUsed) {
        totalTokens = chunk.tokensUsed;
      }
    }

    // 流式完成，发送带 citations 的 done 事件
    ctx.res.write(
      `data: ${JSON.stringify({ content: '', done: true, citations, tokensUsed: totalTokens })}\n\n`
    );
    ctx.res.end();

    // 5. 保存助手消息
    db.prepare(
      'INSERT INTO messages (conversation_id, role, content, citations, tokens_used) VALUES (?, ?, ?, ?, ?)'
    ).run(
      conversationId,
      'assistant',
      fullContent,
      JSON.stringify(citations),
      totalTokens
    );

    // 6. 更新对话 updated_at
    db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversationId);

    // 7. 自动生成对话标题（如果还是默认标题）
    if (conversation.title === '新对话') {
      generateConversationTitle(conversationId, trimmedQuery, fullContent, chatProvider).catch((err) =>
        console.error('自动生成标题失败:', err)
      );
    }
  } catch (error: any) {
    console.error('[AI Chat] 流式对话失败:', error);
    // 发送错误事件
    ctx.res.write(
      `data: ${JSON.stringify({ content: '', done: true, error: error.message || '对话失败' })}\n\n`
    );
    ctx.res.end();
  }
}

/**
 * 自动生成对话标题
 */
async function generateConversationTitle(
  conversationId: number,
  query: string,
  answer: string,
  provider: LLMProvider
): Promise<void> {
  try {
    const result = await provider.chat([
      {
        role: 'system',
        content:
          '根据以下用户的问题和你的回答，生成一个简洁的对话标题（不超过 20 个字），直接返回标题文本，不要加引号或多余内容。',
      },
      { role: 'user', content: `问题：${query}\n\n回答：${answer.slice(0, 200)}` },
    ]);

    const title = result.content.trim().replace(/[""''""]/g, '').slice(0, 50);
    if (title) {
      const db = getDatabase();
      db.prepare('UPDATE conversations SET title = ?, updated_at = datetime(\'now\') WHERE id = ?').run(title, conversationId);
    }
  } catch (err) {
    console.error('生成标题失败:', err);
  }
}

/** POST /api/ai/summarize/:postId — 单篇博客总结 */
export async function summarize(ctx: Context) {
  const postId = Number(ctx.params.postId);
  const db = getDatabase();

  const post = db.prepare('SELECT id, title, content FROM posts WHERE id = ?').get(postId) as any;
  if (!post) {
    ctx.body = { code: 404, message: '文章不存在', data: null };
    ctx.status = 404;
    return;
  }

  const chatProvider = getChatProvider();
  if (!chatProvider) {
    ctx.body = { code: 400, message: '未配置可用的 AI 模型', data: null };
    ctx.status = 400;
    return;
  }

  try {
    // 获取博客的分块内容
    const chunks = db
      .prepare(
        'SELECT chunk_text FROM post_chunks WHERE post_id = ? ORDER BY chunk_index ASC LIMIT 5'
      )
      .all(postId) as any[];

    const contextText = chunks.length > 0
      ? chunks.map((c: any) => c.chunk_text).join('\n\n---\n\n')
      : (post.content || '').slice(0, 2000);

    const result = await chatProvider.chat([
      {
        role: 'system',
        content:
          '你是一个知识总结助手。请根据以下文章内容，生成一个结构化的中文摘要。\n\n格式要求：\n## 核心要点\n- 要点1\n- 要点2\n- ...\n\n## 关键概念\n- **概念名**：简要解释\n\n## 总结\n一段话概括整篇文章的核心内容。',
      },
      {
        role: 'user',
        content: `文章标题：${post.title}\n\n文章内容：\n${contextText}`,
      },
    ]);

    ctx.body = {
      code: 0,
      message: 'success',
      data: {
        postId: post.id,
        postTitle: post.title,
        summary: result.content,
        tokensUsed: result.tokensUsed,
      },
    };
  } catch (error: any) {
    console.error('[AI Summarize] 总结失败:', error);
    ctx.body = { code: 500, message: '总结失败: ' + error.message, data: null };
  }
}
