# 个人本地知识总结博客系统 — 技术开发文档

## 1. 技术架构概览

```
┌─────────────────────────────────────────────────────────┐
│                      客户端 (Browser)                     │
│         Vue 3 + Vite + Tailwind CSS + Vue Router         │
│              Pinia 状态管理 + Markdown 编辑器              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP REST API
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   后端服务 (Koa2 + TS)                    │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ 路由层     │  │ 中间件层  │  │ 控制器层              │  │
│  └───────────┘  └──────────┘  └──────────────────────┘  │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ 服务层     │  │ AI 适配层 │  │ RAG 引擎             │  │
│  └───────────┘  └──────────┘  └──────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    数据层 (SQLite)                        │
│         业务数据表 + sqlite-vss 向量索引表                 │
└─────────────────────────────────────────────────────────┘
```

**架构特点：**

- **前后端分离**：前端 SPA 通过 RESTful API 与后端通信
- **Monorepo 单仓库**：使用 pnpm workspace 管理前后端代码
- **全栈 TypeScript**：前后端共享类型定义，提高开发效率
- **轻量级存储**：SQLite 单文件数据库，零配置，便于本地部署与迁移
- **AI 多厂商适配**：适配器模式统一接口，灵活切换 AI 服务商

---

## 2. 项目目录结构

```
blog/
├── docs/                          # 项目文档
│   └── DEVELOPMENT.md             # 技术开发文档
├── packages/
│   ├── client/                    # 前端项目
│   │   ├── public/                # 静态资源
│   │   ├── src/
│   │   │   ├── api/               # API 请求封装
│   │   │   │   ├── index.ts       # Axios 实例与拦截器
│   │   │   │   ├── posts.ts       # 博客相关接口
│   │   │   │   ├── categories.ts  # 分类相关接口
│   │   │   │   ├── ai.ts          # AI 相关接口
│   │   │   │   └── search.ts      # 搜索相关接口
│   │   │   ├── assets/            # 样式、图片等资源
│   │   │   ├── components/        # 通用组件
│   │   │   │   ├── common/        # 基础 UI 组件
│   │   │   │   ├── editor/        # Markdown 编辑器组件
│   │   │   │   ├── post/          # 文章相关组件
│   │   │   │   └── ai/            # AI 功能组件
│   │   │   ├── composables/       # 组合式函数 (hooks)
│   │   │   ├── layouts/           # 页面布局
│   │   │   ├── pages/             # 页面视图
│   │   │   │   ├── Home.vue       # 首页
│   │   │   │   ├── PostList.vue   # 文章列表
│   │   │   │   ├── PostDetail.vue # 文章详情
│   │   │   │   ├── PostEdit.vue   # 文章编辑
│   │   │   │   ├── Search.vue     # 搜索页
│   │   │   │   ├── AIChat.vue     # AI 问答
│   │   │   │   └── Settings.vue   # 设置页
│   │   │   ├── router/            # 路由配置
│   │   │   │   └── index.ts
│   │   │   ├── stores/            # Pinia 状态管理
│   │   │   │   ├── post.ts        # 文章状态
│   │   │   │   ├── category.ts    # 分类状态
│   │   │   │   ├── ai.ts          # AI 配置状态
│   │   │   │   └── app.ts         # 全局应用状态
│   │   │   ├── types/             # 前端类型定义
│   │   │   ├── utils/             # 工具函数
│   │   │   ├── App.vue            # 根组件
│   │   │   └── main.ts            # 入口文件
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── server/                    # 后端项目
│   │   ├── src/
│   │   │   ├── config/            # 配置文件
│   │   │   │   ├── index.ts       # 统一配置导出
│   │   │   │   └── database.ts    # 数据库配置
│   │   │   ├── controllers/       # 控制器层
│   │   │   │   ├── post.ts
│   │   │   │   ├── category.ts
│   │   │   │   ├── ai.ts
│   │   │   │   ├── search.ts
│   │   │   │   └── migrate.ts
│   │   │   ├── services/          # 服务层（业务逻辑）
│   │   │   │   ├── post.ts
│   │   │   │   ├── category.ts
│   │   │   │   ├── ai.ts
│   │   │   │   ├── rag.ts
│   │   │   │   └── migrate.ts
│   │   │   ├── ai/                # AI 模块
│   │   │   │   ├── providers/     # 各厂商适配器
│   │   │   │   │   ├── openai.ts
│   │   │   │   │   ├── zhipu.ts
│   │   │   │   │   ├── qwen.ts
│   │   │   │   │   └── deepseek.ts
│   │   │   │   ├── types.ts       # AI 接口类型定义
│   │   │   │   └── factory.ts     # 适配器工厂
│   │   │   ├── rag/               # RAG 模块
│   │   │   │   ├── chunker.ts     # 文本分块
│   │   │   │   ├── embedding.ts   # 向量生成
│   │   │   │   ├── retriever.ts   # 向量检索
│   │   │   │   └── index.ts       # RAG 流程编排
│   │   │   ├── database/          # 数据库层
│   │   │   │   ├── index.ts       # 数据库初始化
│   │   │   │   ├── migrations/    # 数据库迁移脚本
│   │   │   │   └── schema.sql     # 建表 SQL
│   │   │   ├── middlewares/       # Koa 中间件
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── logger.ts
│   │   │   │   └── cors.ts
│   │   │   ├── routes/            # 路由定义
│   │   │   │   └── index.ts
│   │   │   ├── types/             # 后端类型定义
│   │   │   ├── utils/             # 工具函数
│   │   │   └── app.ts             # 应用入口
│   │   ├── data/                  # SQLite 数据库文件目录
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── shared/                    # 前后端共享类型/工具
│       ├── src/
│       │   ├── types/             # 共享类型定义
│       │   │   ├── post.ts
│       │   │   ├── category.ts
│       │   │   ├── ai.ts
│       │   │   └── api.ts         # API 通用响应类型
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
├── pnpm-workspace.yaml            # pnpm workspace 配置
├── package.json                   # 根 package.json
├── tsconfig.base.json             # 基础 TS 配置
├── .gitignore
└── .prettierrc
```

---

## 3. 技术栈详细说明

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.4 | 前端框架，使用 Composition API |
| Vite | ^5.x | 构建工具，开发服务器 |
| TypeScript | ^5.4 | 类型安全 |
| Tailwind CSS | ^3.4 | 原子化 CSS 框架 |
| Vue Router | ^4.3 | 前端路由 |
| Pinia | ^2.1 | 状态管理 |
| Vditor | ^3.10 | Markdown 编辑器 |
| Axios | ^1.7 | HTTP 客户端 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Koa2 | ^2.15 | Web 框架 |
| TypeScript | ^5.4 | 类型安全 |
| better-sqlite3 | ^11.x | SQLite 驱动（同步，高性能） |
| sqlite-vss | ^0.1 | SQLite 向量搜索扩展 |
| koa-router | ^12.x | 路由中间件 |
| koa-bodyparser | ^4.4 | 请求体解析 |
| @koa/cors | ^5.x | 跨域中间件 |
| tsx | ^4.x | TS 直接执行（开发模式） |
| tsup | ^8.x | TS 构建打包 |

### 工具链

| 技术 | 版本 | 用途 |
|------|------|------|
| pnpm | ^9.x | 包管理器 + workspace |
| Node.js | ^20.x | 运行时 |
| Prettier | ^3.x | 代码格式化 |
| ESLint | ^9.x | 代码检查 |

---

## 4. 数据库设计

### 4.1 业务表结构

#### posts（文章表）

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                    -- 文章标题
  content TEXT NOT NULL,                  -- Markdown 原始内容
  summary TEXT DEFAULT '',                -- 文章摘要（AI 生成或手动）
  category_id INTEGER,                    -- 分类 ID
  tags TEXT DEFAULT '[]',                 -- 标签（JSON 数组）
  is_published INTEGER DEFAULT 1,         -- 是否发布：1=已发布, 0=草稿
  word_count INTEGER DEFAULT 0,           -- 字数统计
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

#### categories（分类表）

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,              -- 分类名称
  description TEXT DEFAULT '',            -- 分类描述
  sort_order INTEGER DEFAULT 0,          -- 排序权重
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
```

#### ai_models（AI 模型配置表）

```sql
CREATE TABLE ai_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,                 -- 厂商标识: openai/zhipu/qwen/deepseek
  name TEXT NOT NULL,                     -- 模型显示名称
  model_id TEXT NOT NULL,                 -- 模型 ID (如 gpt-4o, glm-4)
  api_key TEXT NOT NULL,                  -- API Key（加密存储）
  base_url TEXT DEFAULT '',               -- 自定义 API 地址
  is_default INTEGER DEFAULT 0,           -- 是否为默认模型
  is_enabled INTEGER DEFAULT 1,          -- 是否启用
  config TEXT DEFAULT '{}',               -- 额外配置（JSON: temperature 等）
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);
```

#### settings（系统设置表）

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,                   -- 设置键名
  value TEXT NOT NULL,                    -- 设置值（JSON 格式）
  description TEXT DEFAULT '',            -- 设置说明
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);
```

#### conversations（对话表）

```sql
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '新对话',       -- 对话标题（取首次提问的摘要）
  model_id INTEGER,                       -- 使用的模型
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (model_id) REFERENCES ai_models(id) ON DELETE SET NULL
);
```

#### messages（对话消息表）

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,        -- 关联对话 ID
  role TEXT NOT NULL,                      -- 角色: user/assistant/system
  content TEXT NOT NULL,                   -- 消息内容
  references_json TEXT DEFAULT '[]',       -- 引用来源（JSON数组：[{postId, postTitle, chunkText, score}]）
  tokens_used INTEGER DEFAULT 0,           -- token 消耗
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
```

### 4.2 向量表结构（sqlite-vss）

```sql
-- 文本块表：存储分块后的文本
CREATE TABLE post_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,               -- 关联文章 ID
  chunk_index INTEGER NOT NULL,           -- 块序号
  chunk_text TEXT NOT NULL,               -- 块文本内容
  token_count INTEGER DEFAULT 0,          -- token 数
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 向量虚拟表：存储 embedding 向量
-- sqlite-vss 使用虚拟表实现向量索引
CREATE VIRTUAL TABLE vss_post_chunks USING vss0(
  embedding(1536)                         -- 向量维度（对应 embedding 模型输出维度）
);
```

> **说明：** `vss_post_chunks` 的 rowid 与 `post_chunks.id` 一一对应，通过 rowid 关联查询原始文本。

### 4.3 索引设计

```sql
-- 文章表索引
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_published ON posts(is_published);

-- 文本块索引
CREATE INDEX idx_chunks_post ON post_chunks(post_id);

-- 对话历史索引
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
```

---

## 5. RESTful API 接口设计

### 5.1 通用响应格式

```typescript
// 成功响应
interface ApiResponse<T> {
  code: number;       // 状态码: 0=成功
  data: T;            // 响应数据
  message: string;    // 提示信息
}

// 分页响应
interface PaginatedResponse<T> {
  code: number;
  data: {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
  };
  message: string;
}

// 错误响应
interface ErrorResponse {
  code: number;       // 错误码: 非0
  data: null;
  message: string;    // 错误描述
}
```

### 5.2 博客 CRUD 接口

#### GET /api/posts — 获取文章列表

```
Query 参数:
  page: number        (默认 1)
  pageSize: number    (默认 20)
  categoryId?: number
  keyword?: string
  isPublished?: 0 | 1

响应示例:
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "title": "Vue 3 组合式 API 入门",
        "summary": "本文介绍 Vue 3 Composition API 的核心概念...",
        "categoryId": 2,
        "tags": ["Vue", "前端"],
        "isPublished": 1,
        "wordCount": 3200,
        "createdAt": "2024-03-15T10:30:00",
        "updatedAt": "2024-03-15T10:30:00"
      }
    ],
    "total": 42,
    "page": 1,
    "pageSize": 20
  },
  "message": "ok"
}
```

#### GET /api/posts/:id — 获取文章详情

```
响应示例:
{
  "code": 0,
  "data": {
    "id": 1,
    "title": "Vue 3 组合式 API 入门",
    "content": "# Vue 3 组合式 API\n\n## 什么是 Composition API...",
    "summary": "本文介绍...",
    "categoryId": 2,
    "tags": ["Vue", "前端"],
    "isPublished": 1,
    "wordCount": 3200,
    "createdAt": "2024-03-15T10:30:00",
    "updatedAt": "2024-03-15T10:30:00"
  },
  "message": "ok"
}
```

#### POST /api/posts — 创建文章

```
请求体:
{
  "title": "新文章标题",
  "content": "# Markdown 内容...",
  "categoryId": 2,
  "tags": ["TypeScript"],
  "isPublished": 1
}

响应示例:
{
  "code": 0,
  "data": { "id": 43 },
  "message": "创建成功"
}
```

#### PUT /api/posts/:id — 更新文章

```
请求体:
{
  "title": "更新后的标题",
  "content": "# 更新后的内容...",
  "categoryId": 3,
  "tags": ["TypeScript", "Node.js"],
  "isPublished": 1
}

响应示例:
{
  "code": 0,
  "data": null,
  "message": "更新成功"
}
```

#### DELETE /api/posts/:id — 删除文章

```
响应示例:
{
  "code": 0,
  "data": null,
  "message": "删除成功"
}
```

### 5.3 分类接口

#### GET /api/categories — 获取所有分类

```
响应示例:
{
  "code": 0,
  "data": [
    { "id": 1, "name": "前端", "description": "前端技术笔记", "sortOrder": 1, "postCount": 15 },
    { "id": 2, "name": "后端", "description": "后端技术笔记", "sortOrder": 2, "postCount": 8 }
  ],
  "message": "ok"
}
```

#### POST /api/categories — 创建分类

```
请求体:
{ "name": "数据库", "description": "数据库相关知识", "sortOrder": 3 }

响应示例:
{ "code": 0, "data": { "id": 4 }, "message": "创建成功" }
```

#### PUT /api/categories/:id — 更新分类

```
请求体:
{ "name": "数据库技术", "description": "SQL/NoSQL 相关", "sortOrder": 3 }

响应示例:
{ "code": 0, "data": null, "message": "更新成功" }
```

#### DELETE /api/categories/:id — 删除分类

```
响应示例:
{ "code": 0, "data": null, "message": "删除成功" }
```

### 5.4 AI 模型管理接口

#### GET /api/ai-models — 获取所有 AI 模型配置

```
响应示例:
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "provider": "openai",
      "name": "GPT-4o",
      "modelId": "gpt-4o",
      "baseUrl": "https://api.openai.com/v1",
      "isDefault": 1,
      "isEnabled": 1,
      "config": { "temperature": 0.7, "maxTokens": 4096 }
    },
    {
      "id": 2,
      "provider": "deepseek",
      "name": "DeepSeek Chat",
      "modelId": "deepseek-chat",
      "baseUrl": "https://api.deepseek.com",
      "isDefault": 0,
      "isEnabled": 1,
      "config": { "temperature": 0.7 }
    }
  ],
  "message": "ok"
}
```

#### POST /api/ai-models — 添加 AI 模型

```
请求体:
{
  "provider": "zhipu",
  "name": "GLM-4",
  "modelId": "glm-4",
  "apiKey": "your-api-key-here",
  "baseUrl": "https://open.bigmodel.cn/api/paas/v4",
  "isDefault": 0,
  "config": { "temperature": 0.7 }
}

响应示例:
{ "code": 0, "data": { "id": 3 }, "message": "创建成功" }
```

#### PUT /api/ai-models/:id — 更新 AI 模型配置

```
请求体:
{
  "name": "GLM-4 Plus",
  "apiKey": "new-api-key",
  "isDefault": 1,
  "config": { "temperature": 0.5 }
}

响应示例:
{ "code": 0, "data": null, "message": "更新成功" }
```

#### DELETE /api/ai-models/:id — 删除 AI 模型

```
响应示例:
{ "code": 0, "data": null, "message": "删除成功" }
```

### 5.5 AI 智能助手接口

#### POST /api/ai/chat — 知识问答（带 RAG 检索）

```
请求体:
{
  "question": "帮我解释一下 Vue 3 的 ref 和 reactive 有什么区别？",
  "conversationId": 1,         // 可选，不传则创建新对话
  "modelId": 1                 // 可选，不传使用默认模型
}

响应（流式 SSE）:
event: references
data: {"references": [{"postId": 1, "postTitle": "Vue 3 响应式系统详解", "chunkText": "ref 用于包装基本类型...", "score": 0.92}]}

event: message
data: {"content": "ref", "done": false}

event: message
data: {"content": " 和 reactive", "done": false}

event: message
data: {"content": "", "done": true, "conversationId": 1, "messageId": 15, "tokensUsed": 520}
```

**流程说明：**
1. 接收用户问题，将问题向量化（Embedding）
2. 在向量数据库中语义检索 Top-K 相关片段
3. 先通过 SSE 返回引用来源（references 事件）
4. 构造 Prompt（系统提示 + 检索上下文 + 对话历史 + 用户问题）
5. 调用大模型流式输出，通过 SSE 实时推送到前端
6. 完成后将问答持久化到 messages 表

#### POST /api/ai/summarize — 博客总结

```
请求体:
{
  "postIds": [1, 2, 3],         // 要总结的博客 ID 数组
  "modelId": 1,                 // 可选，不传使用默认模型
  "type": "summary"             // summary=摘要 | keypoints=关键点 | outline=大纲
}

响应示例:
{
  "code": 0,
  "data": {
    "result": "本文主要介绍了 Vue 3 组合式 API 的核心概念...",
    "tokensUsed": 350,
    "model": "gpt-4o"
  },
  "message": "ok"
}
```

#### GET /api/ai/conversations — 获取对话历史列表

```
Query 参数:
  page: number        (默认 1)
  pageSize: number    (默认 20)

响应示例:
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "title": "Vue 3 响应式原理讨论",
        "messageCount": 6,
        "createdAt": "2024-03-15T10:30:00",
        "updatedAt": "2024-03-15T11:20:00"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 20
  },
  "message": "ok"
}
```

#### GET /api/ai/conversations/:id — 获取对话详情

```
响应示例:
{
  "code": 0,
  "data": {
    "id": 1,
    "title": "Vue 3 响应式原理讨论",
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "Vue 3 的响应式原理是什么？",
        "createdAt": "2024-03-15T10:30:00"
      },
      {
        "id": 2,
        "role": "assistant",
        "content": "Vue 3 使用 Proxy 实现响应式系统...",
        "references": [
          {"postId": 1, "postTitle": "Vue 3 响应式系统详解", "chunkText": "...", "score": 0.92}
        ],
        "tokensUsed": 350,
        "createdAt": "2024-03-15T10:30:05"
      }
    ],
    "createdAt": "2024-03-15T10:30:00",
    "updatedAt": "2024-03-15T11:20:00"
  },
  "message": "ok"
}
```

#### DELETE /api/ai/conversations/:id — 删除对话

```
响应示例:
{ "code": 0, "data": null, "message": "删除成功" }
```

### 5.6 RAG 搜索接口

#### POST /api/search — 语义搜索

```
请求体:
{
  "query": "Vue 响应式原理是什么",
  "topK": 5,              // 返回前 K 个最相关结果
  "threshold": 0.7        // 相似度阈值
}

响应示例:
{
  "code": 0,
  "data": {
    "results": [
      {
        "postId": 1,
        "postTitle": "Vue 3 响应式系统详解",
        "chunkText": "Vue 3 使用 Proxy 实现响应式，相比 Vue 2 的 defineProperty...",
        "score": 0.92
      },
      {
        "postId": 5,
        "postTitle": "前端框架对比",
        "chunkText": "在响应式方面，Vue 采用了细粒度的依赖追踪...",
        "score": 0.85
      }
    ],
    "total": 2
  },
  "message": "ok"
}
```

#### POST /api/search/reindex — 重建向量索引

```
请求体:
{
  "postIds": [1, 2, 3]     // 可选，不传则全量重建
}

响应示例:
{
  "code": 0,
  "data": { "indexed": 3, "chunks": 45 },
  "message": "索引重建完成"
}
```

### 5.7 数据迁移接口

#### GET /api/migrate/export — 导出数据

```
Query 参数:
  format: "json" | "sqlite"   (默认 json)

响应:
- format=json: 返回 JSON 文件下载
  {
    "version": "1.0.0",
    "exportedAt": "2024-03-15T10:30:00",
    "data": {
      "posts": [...],
      "categories": [...],
      "settings": [...],
      "aiModels": [...]      // apiKey 不导出
    }
  }
- format=sqlite: 返回 SQLite 数据库文件下载
```

#### POST /api/migrate/import — 导入数据

```
请求体 (multipart/form-data):
  file: 上传的 JSON 或 SQLite 文件
  strategy: "merge" | "overwrite"   (合并/覆盖)

响应示例:
{
  "code": 0,
  "data": {
    "imported": { "posts": 42, "categories": 5, "settings": 8 }
  },
  "message": "导入成功"
}
```

---

## 6. AI 模块设计

### 6.1 适配器模式架构

```typescript
// packages/server/src/ai/types.ts

/** 聊天消息 */
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** LLM 配置 */
interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/** 统一 LLM Provider 接口 */
interface LLMProvider {
  /** 普通对话（非流式） */
  chat(messages: ChatMessage[], config?: Partial<LLMConfig>): Promise<ChatResult>;

  /** 流式对话 */
  chatStream(messages: ChatMessage[], config?: Partial<LLMConfig>): AsyncGenerator<StreamChunk>;

  /** 生成 Embedding 向量 */
  embedding(text: string): Promise<number[]>;

  /** 批量生成 Embedding */
  embeddingBatch(texts: string[]): Promise<number[][]>;
}

/** 对话结果 */
interface ChatResult {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

/** 流式数据块 */
interface StreamChunk {
  content: string;
  done: boolean;
  tokensUsed?: number;
}
```

### 6.2 各厂商实现

```typescript
// packages/server/src/ai/providers/openai.ts
import type { LLMProvider, ChatMessage, LLMConfig, ChatResult, StreamChunk } from '../types';

export class OpenAIProvider implements LLMProvider {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[]): Promise<ChatResult> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 4096,
      }),
    });

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokensUsed: {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
    };
  }

  async *chatStream(messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
    // 流式实现，使用 SSE 读取
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: true,
      }),
    });

    // 逐行读取 SSE 流
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          const json = JSON.parse(line.slice(6));
          const content = json.choices[0]?.delta?.content || '';
          yield { content, done: false };
        }
      }
    }

    yield { content: '', done: true };
  }

  async embedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  async embeddingBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: texts,
      }),
    });

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }
}
```

### 6.3 适配器工厂

```typescript
// packages/server/src/ai/factory.ts
import type { LLMProvider, LLMConfig } from './types';
import { OpenAIProvider } from './providers/openai';
import { ZhipuProvider } from './providers/zhipu';
import { QwenProvider } from './providers/qwen';
import { DeepSeekProvider } from './providers/deepseek';

type ProviderType = 'openai' | 'zhipu' | 'qwen' | 'deepseek';

const providerMap: Record<ProviderType, new (config: LLMConfig) => LLMProvider> = {
  openai: OpenAIProvider,
  zhipu: ZhipuProvider,
  qwen: QwenProvider,
  deepseek: DeepSeekProvider,
};

export function createLLMProvider(provider: ProviderType, config: LLMConfig): LLMProvider {
  const ProviderClass = providerMap[provider];
  if (!ProviderClass) {
    throw new Error(`不支持的 AI 厂商: ${provider}`);
  }
  return new ProviderClass(config);
}
```

> **说明：** DeepSeek 和通义千问的 API 格式兼容 OpenAI，可继承 OpenAIProvider 仅修改 baseUrl 和 embedding 模型。智谱 AI 的接口略有差异，需单独实现。

---

## 7. RAG 流程设计

### 7.1 整体流程

```
【知识库构建流程】
文章写入/更新 → 文本分块(Chunking) → 生成 Embedding → 存入 sqlite-vss 向量索引

【RAG 知识问答流程】
用户提问
  → Embedding 用户问题
  → 向量相似度检索（sqlite-vss）
  → 取 Top-K 相关片段
  → 构造 Prompt（系统提示 + 检索上下文 + 对话历史 + 用户问题）
  → 调用大模型流式生成
  → 返回答案 + 引用来源
  → 持久化对话记录
```

### 7.2 文本分块策略

```typescript
// packages/server/src/rag/chunker.ts

interface ChunkOptions {
  maxTokens: number;      // 每块最大 token 数，默认 512
  overlap: number;        // 重叠 token 数，默认 50
  separator: string[];    // 分隔符优先级
}

const defaultOptions: ChunkOptions = {
  maxTokens: 512,
  overlap: 50,
  separator: ['\n## ', '\n### ', '\n\n', '\n', '。', '. '],
};

/**
 * 递归字符分割：按分隔符优先级切割文本
 * 优先在 Markdown 标题处分割，保持语义完整性
 */
export function splitText(text: string, options: ChunkOptions = defaultOptions): string[] {
  const chunks: string[] = [];
  // 1. 去除 Markdown 元信息（frontmatter）
  // 2. 按最高优先级分隔符切分
  // 3. 如果单块超过 maxTokens，递归使用下一级分隔符
  // 4. 相邻块之间保留 overlap 个 token 的重叠
  return chunks;
}
```

**分块规则：**
- 最大块长度：512 tokens
- 块间重叠：50 tokens（保证上下文连贯）
- 按 Markdown 结构分割：优先在 `##`、`###` 标题处断开
- 过短段落合并：少于 100 tokens 的段落与下一段合并

### 7.3 向量生成

**Embedding 模型选择：**

| 厂商 | 模型 | 维度 | 说明 |
|------|------|------|------|
| OpenAI | text-embedding-3-small | 1536 | 性价比高，推荐默认使用 |
| 智谱 AI | embedding-2 | 1024 | 中文优化 |
| 通义千问 | text-embedding-v2 | 1536 | 中文效果好 |

```typescript
// packages/server/src/rag/embedding.ts
import { createLLMProvider } from '../ai/factory';

export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = await getDefaultProvider(); // 获取默认 AI 模型的 provider
  return provider.embedding(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const provider = await getDefaultProvider();
  return provider.embeddingBatch(texts);
}
```

### 7.4 存储与检索流程

```typescript
// packages/server/src/rag/retriever.ts
import Database from 'better-sqlite3';

/**
 * 向 sqlite-vss 插入向量
 */
export function insertChunkVector(db: Database.Database, chunkId: number, embedding: number[]) {
  const stmt = db.prepare(`
    INSERT INTO vss_post_chunks (rowid, embedding)
    VALUES (?, ?)
  `);
  stmt.run(chunkId, JSON.stringify(embedding));
}

/**
 * 语义检索：根据查询向量找到最相似的文本块
 */
export function searchSimilarChunks(
  db: Database.Database,
  queryEmbedding: number[],
  topK: number = 5,
  threshold: number = 0.7
) {
  const results = db.prepare(`
    SELECT rowid, distance
    FROM vss_post_chunks
    WHERE vss_search(embedding, ?)
    LIMIT ?
  `).all(JSON.stringify(queryEmbedding), topK);

  // 关联查询原始文本
  return results
    .filter((r: any) => (1 - r.distance) >= threshold)
    .map((r: any) => {
      const chunk = db.prepare(`
        SELECT pc.*, p.title as post_title
        FROM post_chunks pc
        JOIN posts p ON pc.post_id = p.id
        WHERE pc.id = ?
      `).get(r.rowid);
      return { ...chunk, score: 1 - r.distance };
    });
}
```

### 7.5 RAG 增强问答完整流程

```typescript
// packages/server/src/rag/index.ts

/**
 * RAG 增强知识问答完整流程
 */
export async function ragChat(
  question: string,
  conversationId?: number
): Promise<{ stream: AsyncGenerator<StreamChunk>; references: Reference[] }> {
  // 1. 生成用户问题的向量
  const queryEmbedding = await generateEmbedding(question);

  // 2. 向量相似度检索 Top-K 相关片段
  const relevantChunks = searchSimilarChunks(db, queryEmbedding, 5, 0.7);

  // 3. 构造引用来源信息
  const references = relevantChunks.map(c => ({
    postId: c.post_id,
    postTitle: c.post_title,
    chunkText: c.chunk_text,
    score: c.score,
  }));

  // 4. 组装检索上下文
  const context = relevantChunks
    .map(c => `【${c.post_title}】\n${c.chunk_text}`)
    .join('\n\n---\n\n');

  // 5. 构建系统 Prompt
  const systemPrompt = `你是一个基于个人知识库的智能助手。请根据以下知识库内容回答用户问题。
如果知识库中没有相关信息，请如实告知并提供你所知道的通用性建议。
回答时请标注引用来源，格式为 [来源: 博客标题]。

---知识库内容---
${context}
---结束---`;

  // 6. 获取对话历史（多轮对话支持）
  const historyMessages = conversationId
    ? await getConversationMessages(conversationId, 10) // 取最近 10 条
    : [];

  // 7. 组装完整消息列表
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: question },
  ];

  // 8. 调用大模型流式生成回答
  const stream = provider.chatStream(messages);

  return { stream, references };
}
```

---

## 8. 前端架构设计

### 8.1 路由设计

```typescript
// packages/client/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'Home', component: () => import('../pages/Home.vue') },
      { path: 'posts', name: 'PostList', component: () => import('../pages/PostList.vue') },
      { path: 'posts/:id', name: 'PostDetail', component: () => import('../pages/PostDetail.vue') },
      { path: 'posts/new', name: 'PostCreate', component: () => import('../pages/PostEdit.vue') },
      { path: 'posts/:id/edit', name: 'PostEdit', component: () => import('../pages/PostEdit.vue') },
      { path: 'categories', name: 'Categories', component: () => import('../pages/Categories.vue') },
      { path: 'search', name: 'Search', component: () => import('../pages/Search.vue') },
      { path: 'ai/chat', name: 'AIChat', component: () => import('../pages/AIChat.vue') },
      { path: 'ai/chat/:id', name: 'AIChatDetail', component: () => import('../pages/AIChat.vue') },
      { path: 'settings', name: 'Settings', component: () => import('../pages/Settings.vue') },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

### 8.2 状态管理（Pinia Stores）

```typescript
// packages/client/src/stores/post.ts
import { defineStore } from 'pinia';
import type { Post } from '@blog/shared';

export const usePostStore = defineStore('post', () => {
  const posts = ref<Post[]>([]);
  const currentPost = ref<Post | null>(null);
  const loading = ref(false);
  const total = ref(0);

  async function fetchPosts(params?: { page?: number; categoryId?: number }) { /* ... */ }
  async function fetchPost(id: number) { /* ... */ }
  async function createPost(data: Partial<Post>) { /* ... */ }
  async function updatePost(id: number, data: Partial<Post>) { /* ... */ }
  async function deletePost(id: number) { /* ... */ }

  return { posts, currentPost, loading, total, fetchPosts, fetchPost, createPost, updatePost, deletePost };
});
```

```typescript
// packages/client/src/stores/ai.ts
import { defineStore } from 'pinia';

export const useAIStore = defineStore('ai', () => {
  const models = ref([]);
  const conversations = ref([]);        // 对话列表
  const currentConversation = ref(null); // 当前对话详情（含消息）
  const streaming = ref(false);

  async function fetchModels() { /* ... */ }
  async function fetchConversations() { /* 获取对话列表 */ }
  async function fetchConversation(id: number) { /* 获取对话详情 */ }
  async function sendMessage(question: string, conversationId?: number) { /* RAG 问答 */ }
  async function deleteConversation(id: number) { /* 删除对话 */ }
  async function summarizePosts(postIds: number[], type: string) { /* 博客总结 */ }

  return {
    models, conversations, currentConversation, streaming,
    fetchModels, fetchConversations, fetchConversation,
    sendMessage, deleteConversation, summarizePosts
  };
});
```

### 8.3 组件结构

```
components/
├── common/
│   ├── AppHeader.vue          # 顶部导航栏
│   ├── AppSidebar.vue         # 侧边栏（分类导航）
│   ├── Pagination.vue         # 分页组件
│   ├── ConfirmDialog.vue      # 确认弹窗
│   ├── TagInput.vue           # 标签输入
│   └── Loading.vue            # 加载状态
├── editor/
│   ├── MarkdownEditor.vue     # Markdown 编辑器封装
│   └── EditorToolbar.vue      # 编辑器工具栏（含 AI 按钮）
├── post/
│   ├── PostCard.vue           # 文章卡片
│   ├── PostContent.vue        # 文章内容渲染
│   └── PostMeta.vue           # 文章元信息（日期、分类、字数）
└── ai/
    ├── ChatPanel.vue          # AI 对话主面板（消息列表 + 输入框）
    ├── ChatMessage.vue        # 单条对话消息（含引用来源展示）
    ├── ChatSidebar.vue        # 对话列表侧边栏（历史对话列表）
    ├── ReferenceList.vue      # 检索引用来源展示组件
    ├── SummaryPanel.vue       # AI 摘要面板
    └── ModelSelector.vue      # 模型选择器
```

### 8.4 页面布局

```
┌──────────────────────────────────────────────────┐
│                  AppHeader (顶部导航)              │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Sidebar   │           Main Content              │
│  (分类导航) │          (路由视图区域)              │
│            │                                     │
│            │                                     │
│            │                                     │
├────────────┴─────────────────────────────────────┤
│                    (可选底部)                      │
└──────────────────────────────────────────────────┘
```

- **响应式设计**：移动端侧边栏收起为抽屉式
- **暗色模式**：支持 light/dark 主题切换（Tailwind CSS `dark:` 前缀）
- **编辑器页面**：全屏布局，左编辑右预览

---

## 9. 开发环境搭建

### 9.1 环境要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 20.x | 推荐使用 LTS 版本 |
| pnpm | >= 9.x | 包管理器 |
| Git | >= 2.x | 版本管理 |

### 9.2 初始化项目

```bash
# 1. 克隆/创建项目
mkdir blog && cd blog
git init

# 2. 初始化根 package.json
pnpm init

# 3. 创建 pnpm workspace 配置
# pnpm-workspace.yaml 内容:
# packages:
#   - 'packages/*'

# 4. 创建子包
mkdir -p packages/client packages/server packages/shared

# 5. 安装全局依赖
pnpm add -D typescript prettier eslint -w
```

### 9.3 安装和启动命令

```bash
# 安装所有依赖
pnpm install

# 启动前端开发服务器
pnpm --filter @blog/client dev

# 启动后端开发服务器
pnpm --filter @blog/server dev

# 同时启动前后端（根 package.json 中配置）
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm typecheck
```

### 9.4 根 package.json 脚本配置

```json
{
  "name": "blog",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --filter @blog/client --filter @blog/server dev",
    "build": "pnpm --filter @blog/shared build && pnpm --parallel --filter @blog/client --filter @blog/server build",
    "typecheck": "pnpm -r typecheck",
    "lint": "eslint packages/*/src --ext .ts,.vue",
    "format": "prettier --write \"packages/*/src/**/*.{ts,vue,css}\""
  }
}
```

### 9.5 开发工作流

1. **功能分支开发**：从 `main` 切出 `feat/xxx` 分支
2. **前后端并行开发**：`pnpm dev` 同时启动前后端，前端 Vite 代理 API 请求到后端
3. **共享类型优先**：新功能先在 `packages/shared` 定义类型接口
4. **数据库变更**：通过 migration 脚本管理 schema 变更

**Vite 代理配置：**

```typescript
// packages/client/vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 10. 部署与迁移

### 10.1 本地部署步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 构建共享包
pnpm --filter @blog/shared build

# 3. 构建前端（产出 dist 目录）
pnpm --filter @blog/client build

# 4. 构建后端
pnpm --filter @blog/server build

# 5. 启动生产服务（后端同时托管前端静态文件）
cd packages/server
node dist/app.js
```

**生产模式后端配置：**

```typescript
// packages/server/src/app.ts（生产模式下）
import serve from 'koa-static';
import path from 'path';

if (process.env.NODE_ENV === 'production') {
  // 托管前端构建产物
  app.use(serve(path.resolve(__dirname, '../../client/dist')));
}
```

### 10.2 数据迁移方案

#### JSON 导出/导入

- **导出**：将所有业务数据序列化为 JSON 文件，附带版本号和时间戳
- **导入**：支持合并（不覆盖已有）和覆盖两种策略
- **注意**：API Key 等敏感信息不包含在导出数据中

#### SQLite 文件迁移

- 直接复制 `packages/server/data/blog.db` 文件即可完成数据迁移
- 优点：完整保留所有数据，包括向量索引
- 缺点：文件体积较大

#### 迁移数据结构

```typescript
interface ExportData {
  version: string;
  exportedAt: string;
  data: {
    posts: Post[];
    categories: Category[];
    settings: Setting[];
    conversations: Conversation[];       // 对话及消息记录
    // aiModels 不导出 apiKey
    aiModels: Omit<AIModel, 'apiKey'>[];
  };
}
```

### 10.3 环境变量

```bash
# .env（开发环境）
NODE_ENV=development
PORT=3001
DATABASE_PATH=./data/blog.db

# .env.production（生产环境）
NODE_ENV=production
PORT=3001
DATABASE_PATH=./data/blog.db
```

---

## 附录：快速参考

### 常用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装所有依赖 |
| `pnpm dev` | 启动开发环境（前后端） |
| `pnpm build` | 构建生产版本 |
| `pnpm --filter @blog/server db:migrate` | 执行数据库迁移 |
| `pnpm --filter @blog/server db:seed` | 填充测试数据 |
| `pnpm typecheck` | 全量类型检查 |
| `pnpm lint` | 代码检查 |
| `pnpm format` | 代码格式化 |

### 端口规划

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Dev Server | 3000 | Vite 开发服务器 |
| 后端 API Server | 3001 | Koa2 API 服务 |
