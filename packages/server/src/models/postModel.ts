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

/** 分类信息片段 */
interface CategoryInfo {
  id: number;
  name: string;
  color: string | null;
}

/**
 * Helper：将 GROUP_CONCAT 聚合的分类字段解析为结构化数组
 */
function parseCategories(row: any): CategoryInfo[] {
  if (!row || !row.category_ids) return [];
  const ids = String(row.category_ids).split(',');
  const names = String(row.category_names).split(',');
  const colors = String(row.category_colors || '').split(',');
  return ids.map((id: string, i: number) => ({
    id: Number(id),
    name: names[i] || '',
    color: colors[i] || null,
  }));
}

/**
 * Helper：从查询结果行中取出原始分类字段，替换为结构化 categories 数组
 */
function formatRow(row: any): any {
  if (!row) return row;
  const categories = parseCategories(row);
  delete row.category_ids;
  delete row.category_names;
  delete row.category_colors;
  row.categories = categories;
  return row;
}

/** 分页查询文章列表，通过 post_categories 关联获取多分类 */
export function findAll(params: FindAllParams) {
  const { page, pageSize, categoryId, keyword, sortBy = 'created_at', order = 'desc' } = params;
  const db = getDatabase();

  // 构建 WHERE 条件
  const conditions: string[] = [];
  const values: any[] = [];

  if (categoryId) {
    conditions.push('p.id IN (SELECT post_id FROM post_categories WHERE category_id = ?)');
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

  // 分页查询 — 通过 post_categories 获取多分类
  const offset = (page - 1) * pageSize;
  const rows = db
    .prepare(
      `SELECT p.*,
              GROUP_CONCAT(pc.category_id) AS category_ids,
              GROUP_CONCAT(c.name)          AS category_names,
              GROUP_CONCAT(c.color)         AS category_colors
       FROM posts p
       LEFT JOIN post_categories pc ON pc.post_id = p.id
       LEFT JOIN categories c       ON c.id       = pc.category_id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.${safeSortBy} ${safeOrder}
       LIMIT ? OFFSET ?`
    )
    .all(...values, pageSize, offset);

  return { list: rows.map(formatRow), total, page, pageSize };
}

/** 根据 ID 查询单篇文章，包含完整分类信息 */
export function findById(id: number) {
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT p.*,
              GROUP_CONCAT(pc.category_id) AS category_ids,
              GROUP_CONCAT(c.name)          AS category_names,
              GROUP_CONCAT(c.color)         AS category_colors
       FROM posts p
       LEFT JOIN post_categories pc ON pc.post_id = p.id
       LEFT JOIN categories c       ON c.id       = pc.category_id
       WHERE p.id = ?
       GROUP BY p.id`
    )
    .get(id) as any;

  return formatRow(row);
}

/** 创建文章（支持多分类） */
export function create(data: { title: string; content: string; categoryIds?: number[] }) {
  const db = getDatabase();
  const wordCount = data.content.length;

  const result = db
    .prepare('INSERT INTO posts (title, content, word_count) VALUES (?, ?, ?)')
    .run(data.title, data.content, wordCount);

  const postId = Number(result.lastInsertRowid);

  // 插入多分类关联
  if (data.categoryIds && data.categoryIds.length > 0) {
    const insertCategory = db.prepare(
      'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)'
    );
    for (const catId of data.categoryIds) {
      insertCategory.run(postId, catId);
    }
  }

  return { id: postId };
}

/** 更新文章（支持多分类替换） */
export function update(
  id: number,
  data: { title?: string; content?: string; categoryIds?: number[] }
) {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }

  if (data.content !== undefined) {
    fields.push('content = ?');
    values.push(data.content);
    fields.push('word_count = ?');
    values.push(data.content.length);
  }

  if (data.categoryIds !== undefined) {
    // 替换分类关联：先清空原有，再插入新关联
    db.prepare('DELETE FROM post_categories WHERE post_id = ?').run(id);
    if (data.categoryIds.length > 0) {
      const insertCategory = db.prepare(
        'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)'
      );
      for (const catId of data.categoryIds) {
        insertCategory.run(id, catId);
      }
    }
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

/** 删除文章（ON DELETE CASCADE 会自动清理 post_categories） */
export function deletePostById(id: number) {
  const db = getDatabase();
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
}

/** 统计某分类下的文章数（通过 post_categories 关联） */
export function countByCategory(categoryId: number): number {
  const db = getDatabase();
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM post_categories WHERE category_id = ?')
    .get(categoryId) as any;
  return row.count;
}
