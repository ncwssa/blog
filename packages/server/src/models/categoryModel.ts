import { getDatabase } from '../database';

/**
 * 分类数据模型 — 封装所有分类相关的数据库操作
 */

/** 查询所有分类，包含每个分类下的文章数 */
export function findAll() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.is_preset, c.created_at, c.updated_at,
              COUNT(p.id) AS post_count
       FROM categories c
       LEFT JOIN posts p ON p.category_id = c.id
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

/** 创建分类 */
export function create(name: string) {
  const db = getDatabase();
  const result = db
    .prepare('INSERT INTO categories (name, is_preset) VALUES (?, 0)')
    .run(name);
  return { id: result.lastInsertRowid };
}

/** 更新分类名称 */
export function update(id: number, name: string) {
  const db = getDatabase();
  db.prepare(
    "UPDATE categories SET name = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(name, id);
}

/** 删除分类 */
export function deleteCategoryById(id: number) {
  const db = getDatabase();
  // 将关联文章的 category_id 设为 null
  db.prepare('UPDATE posts SET category_id = NULL WHERE category_id = ?').run(
    id
  );
  // 删除分类
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}
