/** 建表 SQL 语句 */

export const CREATE_AI_MODELS_TABLE = `
CREATE TABLE IF NOT EXISTS ai_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  model_id TEXT NOT NULL,
  api_key TEXT NOT NULL,
  base_url TEXT DEFAULT '',
  is_default INTEGER DEFAULT 0,
  is_enabled INTEGER DEFAULT 1,
  config TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

export const CREATE_POST_CHUNKS_TABLE = `
CREATE TABLE IF NOT EXISTS post_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding TEXT DEFAULT NULL,
  token_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
`;

export const CREATE_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT NULL,
  is_preset INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

export const CREATE_POSTS_TABLE = `
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id INTEGER,
  summary TEXT,
  word_count INTEGER DEFAULT 0,
  is_vectorized INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
`;

export const CREATE_POST_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS post_categories (
  post_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, category_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
`;

/** vec0 向量表：存储文本块的 Embedding 向量 */
export const CREATE_VEC_CHUNKS_TABLE = `
CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(
  chunk_id INTEGER PRIMARY KEY,
  embedding float[1536]
);
`;

/** 对话表 */
export const CREATE_CONVERSATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '新对话',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

/** 消息表 */
export const CREATE_MESSAGES_TABLE = `
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations TEXT DEFAULT '[]',
  tokens_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
`;

/** 所有建表语句集合 */
export const ALL_SCHEMAS = [
  CREATE_AI_MODELS_TABLE,
  CREATE_POST_CHUNKS_TABLE,
  CREATE_CATEGORIES_TABLE,
  CREATE_POSTS_TABLE,
  CREATE_POST_CATEGORIES_TABLE,
  CREATE_VEC_CHUNKS_TABLE,
  CREATE_CONVERSATIONS_TABLE,
  CREATE_MESSAGES_TABLE,
];
