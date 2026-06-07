import { getDatabase } from '../database';

/**
 * 分类数据模型 — 封装所有分类相关的数据库操作
 */

/** 查询所有分类，包含每个分类下的文章数（通过 post_categories 关联） */
export function findAll() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.color, c.is_preset, c.created_at, c.updated_at,
              COUNT(pc.post_id) AS post_count
       FROM categories c
       LEFT JOIN post_categories pc ON pc.category_id = c.id
       GROUP BY c.id
       ORDER BY c.id ASC`
    )
    .all();
  return rows;
}

/** 根据 ID 查询单个分类 */
export function findById(id: number) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

/** 根据名称查询分类（用于判断重复） */
export function findByName(name: string) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
}

/** 创建分类（支持颜色） */
export function create(name: string, color?: string) {
  const db = getDatabase();
  const result = db
    .prepare('INSERT INTO categories (name, color, is_preset) VALUES (?, ?, 0)')
    .run(name, color || null);
  return { id: result.lastInsertRowid };
}

/** 更新分类名称和颜色 */
export function update(id: number, data: { name?: string; color?: string }) {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.color !== undefined) {
    fields.push('color = ?');
    values.push(data.color);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

/** 删除分类 */
export function deleteCategoryById(id: number) {
  const db = getDatabase();
  // 先删除关联表中的记录
  db.prepare('DELETE FROM post_categories WHERE category_id = ?').run(id);
  // 删除分类
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}
