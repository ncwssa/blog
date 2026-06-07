import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ALL_SCHEMAS } from './schema';

/** 数据库文件路径（相对于 server 根目录） */
const DB_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'blog.db');

/** 预设分类列表 */
const PRESET_CATEGORIES = [
  '前端',
  '后端',
  '算法',
  '数据库',
  '网络',
  '操作系统',
  '工具',
  '读书笔记',
  '面试准备',
  '项目总结',
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
 * 初始化数据库：创建目录、连接数据库、建表、插入预设数据
 */
export function initDatabase(): void {
  // 确保 data 目录存在
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // 连接数据库
  db = new Database(DB_PATH);

  // 开启 WAL 模式，提升并发性能
  db.pragma('journal_mode = WAL');

  // 执行建表 SQL
  for (const schema of ALL_SCHEMAS) {
    db.exec(schema);
  }

  // 插入预设分类（如果不存在）
  const insertCategory = db.prepare(
    'INSERT OR IGNORE INTO categories (name, is_preset) VALUES (?, 1)'
  );

  const insertMany = db.transaction((categories: string[]) => {
    for (const name of categories) {
      insertCategory.run(name);
    }
  });

  insertMany(PRESET_CATEGORIES);

  console.log('✅ 数据库初始化完成');
}

export default { getDatabase, initDatabase };
