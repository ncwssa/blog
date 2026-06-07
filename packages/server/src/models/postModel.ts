import { getDatabase } from '../database';

/**
 * 博客数据模型 — 封装所有文章相关的数据库操作
 */

/** 分页查询参数 */
interface FindAllParams {
  page: number;
  pageSize: number;
  categoryId?: number;
  keyword?: string;
  sortBy?: string;
  order?: string;
}

/** 分页查询文章列表，JOIN categories 获取分类名 */
export function findAll(params: FindAllParams) {
  const { page, pageSize, categoryId, keyword, sortBy = 'created_at', order = 'desc' } = params;
  const db = getDatabase();

  // 构建 WHERE 条件
  const conditions: string[] = [];
  const values: any[] = [];

  if (categoryId) {
    conditions.push('p.category_id = ?');
    values.push(categoryId);
  }

  if (keyword) {
    conditions.push('p.title LIKE ?');
    values.push(`%${keyword}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 白名单校验排序字段，防止 SQL 注入
  const allowedSortFields = ['created_at', 'updated_at', 'title', 'word_count'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const safeOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // 查询总数
  const countRow = db
    .prepare(`SELECT COUNT(*) AS total FROM posts p ${whereClause}`)
    .get(...values) as any;
  const total = countRow.total;

  // 分页查询
  const offset = (page - 1) * pageSize;
  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY p.${safeSortBy} ${safeOrder}
       LIMIT ? OFFSET ?`
    )
    .all(...values, pageSize, offset);

  return { list: rows, total, page, pageSize };
}

/** 根据 ID 查询单篇文章，JOIN categories */
export function findById(id: number) {
  const db = getDatabase();
  return db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`
    )
    .get(id);
}

/** 创建文章 */
export function create(data: { title: string; content: string; categoryId?: number }) {
  const db = getDatabase();
  const wordCount = data.content.length;
  const result = db
    .prepare(
      `INSERT INTO posts (title, content, category_id, word_count)
       VALUES (?, ?, ?, ?)`
    )
    .run(data.title, data.content, data.categoryId || null, wordCount);
  return { id: result.lastInsertRowid };
}

/** 更新文章 */
export function update(id: number, data: { title?: string; content?: string; categoryId?: number }) {
  const db = getDatabase();

  // 动态构建 SET 子句
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }

  if (data.content !== undefined) {
    fields.push('content = ?');
    values.push(data.content);
    // 重新计算字数
    fields.push('word_count = ?');
    values.push(data.content.length);
  }

  if (data.categoryId !== undefined) {
    fields.push('category_id = ?');
    values.push(data.categoryId || null);
  }

  // 自动更新 updated_at
  fields.push("updated_at = datetime('now')");

  if (fields.length === 1) {
    // 只有 updated_at，无实际更新内容
    return;
  }

  values.push(id);
  db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

/** 删除文章 */
export function deletePostById(id: number) {
  const db = getDatabase();
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
}

/** 统计某分类下的文章数 */
export function countByCategory(categoryId: number): number {
  const db = getDatabase();
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM posts WHERE category_id = ?')
    .get(categoryId) as any;
  return row.count;
}
