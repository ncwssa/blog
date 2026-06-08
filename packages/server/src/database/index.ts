import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import path from 'path';
import fs from 'fs';
import { ALL_SCHEMAS } from './schema';

/** 数据库文件路径（相对于 server 根目录） */
const DB_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'blog.db');

/** 预设分类列表及颜色 */
const PRESET_CATEGORIES: { name: string; color: string }[] = [
  { name: '前端', color: '#3b82f6' },
  { name: '后端', color: '#10b981' },
  { name: '算法', color: '#8b5cf6' },
  { name: '数据库', color: '#f59e0b' },
  { name: '网络', color: '#06b6d4' },
  { name: '操作系统', color: '#f97316' },
  { name: '工具', color: '#6366f1' },
  { name: '读书笔记', color: '#ec4899' },
  { name: '面试准备', color: '#ef4444' },
  { name: '项目总结', color: '#14b8a6' },
];

/** 自定义分类默认颜色轮换池 */
const CUSTOM_COLOR_POOL = [
  '#84cc16', '#a855f7', '#0ea5e9', '#f43f5e',
  '#22d3ee', '#eab308', '#d946ef', '#06b6d4',
];

let db: Database.Database;

/**
 * 获取数据库实例
 */
export function getDatabase(): Database.Database {
  if (!db) {
    initDatabase();
  }
  return db;
}

/**
 * 初始化数据库：创建目录、连接数据库、建表、迁移、插入预设数据
 */
export function initDatabase(): void {
  // 确保 data 目录存在
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // 判断数据库是否已存在（用于决定是否执行迁移）
  const dbExists = fs.existsSync(DB_PATH);

  // 连接数据库
  db = new Database(DB_PATH);

  // 加载 sqlite-vec 向量搜索扩展
  try {
    sqliteVec.load(db);
    console.log('✅ 向量扩展 sqlite-vec 已加载');
  } catch (err: any) {
    console.error('⚠️ 向量扩展 sqlite-vec 加载失败:', err.message);
    console.error('   语义搜索将降级为关键词匹配');
  }

  // 开启 WAL 模式，提升并发性能
  db.pragma('journal_mode = WAL');

  // 执行建表 SQL
  for (const schema of ALL_SCHEMAS) {
    db.exec(schema);
  }

  // 执行迁移（仅在已有数据库时）
  if (dbExists) {
    runMigrations();
  }

  // 插入预设分类（如果不存在）
  const insertPreset = db.prepare(
    'INSERT OR IGNORE INTO categories (name, color, is_preset) VALUES (?, ?, 1)'
  );

  const insertMany = db.transaction((categories: { name: string; color: string }[]) => {
    for (const cat of categories) {
      insertPreset.run(cat.name, cat.color);
    }
  });

  insertMany(PRESET_CATEGORIES);

  // 为新数据库或无颜色的分类分配颜色
  assignDefaultColors();

  console.log('✅ 数据库初始化完成');
}

/**
 * 数据库迁移：为已有数据库添加新字段和新表
 */
function runMigrations(): void {
  // 检查 categories 是否有 color 列
  const columns = db.prepare("PRAGMA table_info('categories')").all() as any[];
  const hasColor = columns.some((col: any) => col.name === 'color');

  if (!hasColor) {
    db.exec("ALTER TABLE categories ADD COLUMN color TEXT DEFAULT NULL");
    console.log('  ↳ 迁移: 添加 categories.color 列');
  }

  // 创建 post_categories 表（已有的话 CREATE IF NOT EXISTS 会跳过）
  // 迁移已有数据：将 posts.category_id 复制到 post_categories
  const hasPostCategories = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='post_categories'"
  ).get();

  if (hasPostCategories) {
    // 检查 post_categories 是否为空，如果为空则从 posts.category_id 迁移
    const count = db.prepare('SELECT COUNT(*) AS cnt FROM post_categories').get() as any;
    if (count.cnt === 0) {
      // 将现有 category_id 不为 null 的记录插入 post_categories
      db.exec(`
        INSERT OR IGNORE INTO post_categories (post_id, category_id)
        SELECT id, category_id FROM posts WHERE category_id IS NOT NULL
      `);
      console.log('  ↳ 迁移: 将现有 category_id 迁移到 post_categories');
    }
  }
}

/**
 * 为无颜色的分类分配默认颜色
 */
function assignDefaultColors(): void {
  const cats = db.prepare('SELECT id FROM categories WHERE color IS NULL ORDER BY id ASC').all() as any[];
  const updateColor = db.prepare('UPDATE categories SET color = ? WHERE id = ?');

  cats.forEach((cat: any, index: number) => {
    const color = CUSTOM_COLOR_POOL[index % CUSTOM_COLOR_POOL.length];
    updateColor.run(color, cat.id);
  });

  if (cats.length > 0) {
    console.log(`  ↳ 为 ${cats.length} 个分类分配了默认颜色`);
  }
}

export default { getDatabase, initDatabase };
