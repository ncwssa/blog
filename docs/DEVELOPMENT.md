# 个人本地知识总结博客系统 — 技术开发文档

## 1. 技术架构概览

```
┌─────────────────────────────────────────────────────────┐
│                      客户端 (Browser)                     │
│         Vue 3 + Vite + Tailwind CSS + Vue Router         │
│              Pinia 状态管理 + Axios HTTP 客户端            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP REST API
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   后端服务 (Koa2 + TS)                    │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ 路由层     │  │ 中间件层  │  │ 控制器层              │  │
│  └───────────┘  └──────────┘  └──────────────────────┘  │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ 数据模型   │  │ AI 适配层 │  │ RAG 引擎             │  │
│  └───────────┘  └──────────┘  └──────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    数据层 (SQLite)                        │
│  业务数据表 (posts / categories / ai_models)             │
│  + 向量表 (post_chunks — embedding 以 JSON 列存储)      │
│  余弦相似度在 JS 中计算，无需额外向量扩展                  │
└─────────────────────────────────────────────────────────┘
```

**架构特点：**

- **前后端分离**：前端 SPA 通过 RESTful API 与后端通信
- **Monorepo 单仓库**：使用 pnpm workspace + concurrently 同时启动前后端
- **全栈 TypeScript**：前后端统一使用 TypeScript
- **轻量级存储**：SQLite 单文件数据库，零配置，便于本地部署与迁移
- **AI 多厂商适配**：所有 AI 厂商统一使用 OpenAI 兼容适配器（OpenAIProvider），通过工厂模式灵活切换
- **RAG 实现**：文本分块 → AI Embedding → 向量以 JSON 列存储 → JS 计算余弦相似度 → 三级降级策略

---

## 2. 项目目录结构

```
blog/
├── docs/                          # 项目文档
│   ├── PRD.md                     # 产品需求文档
│   └── DEVELOPMENT.md             # 技术开发文档
├── packages/
│   ├── client/                    # 前端项目 (Vue 3 + Vite)
│   │   ├── src/
│   │   │   ├── api/               # API 请求封装
│   │   │   │   ├── index.ts       # Axios 实例与拦截器
│   │   │   │   ├── posts.ts       # 博客接口
│   │   │   │   ├── categories.ts  # 分类接口
│   │   │   │   ├── ai-models.ts   # AI 模型接口
│   │   │   │   └── search.ts      # 搜索接口
│   │   │   ├── components/
│   │   │   │   ├── common/        # 基础 UI 组件
│   │   │   │   │   ├── CategoryPicker.vue
│   │   │   │   │   ├── CategoryTag.vue
│   │   │   │   │   ├── ConfirmDialog.vue
│   │   │   │   │   ├── Empty.vue
│   │   │   │   │   ├── Icon.vue
│   │   │   │   │   ├── Pagination.vue
│   │   │   │   │   └── Toast.vue
│   │   │   │   └── layout/        # 布局组件
│   │   │   │       ├── AppHeader.vue
│   │   │   │       ├── AppLayout.vue
│   │   │   │       └── AppSidebar.vue
│   │   │   ├── composables/       # 组合式函数
│   │   │   │   └── useToast.ts
│   │   │   ├── router/            # 路由配置
│   │   │   │   └── index.ts
│   │   │   ├── stores/            # Pinia 状态管理
│   │   │   │   ├── index.ts
│   │   │   │   ├── posts.ts
│   │   │   │   └── categories.ts
│   │   │   ├── types/             # TypeScript 类型
│   │   │   │   └── index.ts
│   │   │   ├── utils/             # 工具函数
│   │   │   │   └── colors.ts
│   │   │   ├── views/             # 页面视图
│   │   │   │   ├── Home.vue
│   │   │   │   ├── PostList.vue
│   │   │   │   ├── PostDetail.vue
│   │   │   │   ├── PostEdit.vue
│   │   │   │   ├── Categories.vue
│   │   │   │   ├── Search.vue
│   │   │   │   ├── AIChat.vue
│   │   │   │   └── Settings.vue
│   │   │   ├── style.css          # 全局样式
│   │   │   ├── App.vue            # 根组件
│   │   │   └── main.ts            # 入口文件
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── server/                    # 后端项目 (Koa2 + TS)
│   │   ├── src/
│   │   │   ├── ai/                # AI 模块
│   │   │   │   ├── providers/     # 适配器（仅 openai.ts，支持所有厂商）
│   │   │   │   │   └── openai.ts
│   │   │   │   ├── types.ts       # LLMProvider/LLMConfig 类型
│   │   │   │   └── factory.ts     # 适配器工厂 + supportsEmbedding
│   │   │   ├── controllers/       # 控制器
│   │   │   │   ├── postController.ts
│   │   │   │   ├── categoryController.ts
│   │   │   │   ├── aiModelController.ts
│   │   │   │   └── searchController.ts
│   │   │   ├── database/          # 数据库层
│   │   │   │   ├── index.ts       # 初始化 + 迁移 + 预设数据
│   │   │   │   └── schema.ts      # 建表 SQL
│   │   │   ├── middleware/        # Koa 中间件
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── index.ts
│   │   │   ├── models/            # 数据模型（SQL 查询封装）
│   │   │   │   ├── postModel.ts
│   │   │   │   ├── categoryModel.ts
│   │   │   │   └── aiModelModel.ts
│   │   │   ├── rag/               # RAG 引擎
│   │   │   │   ├── chunker.ts     # 文本分块
│   │   │   │   ├── embedding.ts   # Embedding 生成
│   │   │   │   ├── retriever.ts   # 向量检索
│   │   │   │   └── index.ts       # 流程编排
│   │   │   ├── routes/            # 路由定义
│   │   │   │   ├── index.ts
│   │   │   │   ├── posts.ts
│   │   │   │   ├── categories.ts
│   │   │   │   ├── ai-models.ts
│   │   │   │   └── search.ts
│   │   │   ├── app.ts             # Koa 应用配置
│   │   │   └── index.ts           # 入口文件
│   │   ├── data/                  # SQLite 数据库文件目录
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── shared/                    # 共享类型
│       ├── src/
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
├── pnpm-workspace.yaml
├── package.json
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
| Axios | ^1.6 | HTTP 客户端 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Koa2 | ^2.15 | Web 框架 |
| TypeScript | ^5.3 | 类型安全 |
| better-sqlite3 | ^12.10 | SQLite 驱动（同步，高性能） |
| koa-router | ^12.x | 路由中间件 |
| koa-bodyparser | ^4.4 | 请求体解析 |
| @koa/cors | ^5.x | 跨域中间件 |
| tsx | ^4.7 | TS 直接执行（开发模式 + watch） |
| @types/better-sqlite3 | ^7.6 | SQLite 类型定义 |
| @types/koa-router | ^7.4 | Koa 路由类型 |

### 工具链

| 技术 | 版本 | 用途 |
|------|------|------|
| pnpm | >=8.x | 包管理器 + workspace |
| Node.js | >=18.x | 运行时 |
| concurrently | ^10.0 | 并行启动前后端 |
| Prettier | — | 代码格式化（.prettierrc 配置） |

---

## 4. 数据库设计

### 4.1 业务表结构

#### posts（文章表）

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                    -- 文章标题
  content TEXT NOT NULL,                  -- Markdown 原始内容
  category_id INTEGER,                   -- 关联分类（兼容旧数据）
  summary TEXT,                          -- 内容摘要（自动截取前 200 字）
  word_count INTEGER DEFAULT 0,           -- 字数统计
  is_vectorized INTEGER DEFAULT 0,        -- 是否已向量化：0=未向量化, 1=已向量化
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

> **说明：** 文章与分类通过 `post_categories` 关联表实现多对多关系。

#### post_categories（文章-分类关联表）

```sql
CREATE TABLE post_categories (
  post_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, category_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

#### categories（分类表）

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,              -- 分类名称
  color TEXT DEFAULT NULL,                -- 分类颜色（十六进制色值）
  is_preset INTEGER DEFAULT 0,            -- 是否预设分类
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

#### ai_models（AI 模型配置表）

```sql
CREATE TABLE ai_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,                 -- 厂商标识: openai/zhipu/qwen/deepseek
  name TEXT NOT NULL,                     -- 模型显示名称
  model_id TEXT NOT NULL,                 -- 模型 ID (如 gpt-4o, glm-4)
  api_key TEXT NOT NULL,                  -- API Key
  base_url TEXT DEFAULT '',               -- 自定义 API 地址
  is_default INTEGER DEFAULT 0,           -- 是否为默认模型
  is_enabled INTEGER DEFAULT 1,           -- 是否启用
  config TEXT DEFAULT '{}',               -- 额外配置（JSON: temperature 等）
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 4.2 向量表结构

```sql
-- 文本块表：存储分块后的文本 + Embedding 向量
CREATE TABLE post_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,               -- 关联文章 ID
  chunk_index INTEGER NOT NULL,           -- 块序号（从 0 开始）
  chunk_text TEXT NOT NULL,               -- 块文本内容
  embedding TEXT DEFAULT NULL,            -- 向量（JSON 格式，如 [0.001, 0.002, ...]）
  token_count INTEGER DEFAULT 0,          -- 预估 token 数
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

> **说明：** 向量以 JSON 数组直接存储在 `embedding` 字段中，检索时在 JS 中解析并计算余弦相似度，无需额外的向量数据库或扩展。向量维度由所选 Embedding 模型决定（如 text-embedding-3-small 为 1536 维）。

### 4.3 索引设计

```sql
-- 文章-分类关联表索引（PRIMARY KEY 自带）
CREATE INDEX idx_chunks_post ON post_chunks(post_id);
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

响应示例:
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "title": "Vue 3 组合式 API 入门",
        "categories": [{"id": 2, "name": "前端", "color": "#3b82f6"}],
        "summary": "本文介绍 Vue 3 Composition API...",
        "word_count": 3200,
        "is_vectorized": 1,
        "created_at": "2026-06-07 10:30:00",
        "updated_at": "2026-06-07 10:30:00"
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
    "content": "# Vue 3 组合式 API...",
    "categories": [{"id": 2, "name": "前端", "color": "#3b82f6"}],
    "word_count": 3200,
    "is_vectorized": 1,
    "created_at": "2026-06-07 10:30:00",
    "updated_at": "2026-06-07 10:30:00"
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
  "categoryIds": [2]
}

响应示例:
{
  "code": 0,
  "data": { "id": 43 },
  "message": "创建成功"
}
```

> **说明：** 创建成功后，后端异步触发向量索引（`indexPost`），不阻塞响应。

#### PUT /api/posts/:id — 更新文章

```
请求体:
{
  "title": "更新后的标题",         // 可选
  "content": "# 更新后的内容...",   // 可选
  "categoryIds": [3]               // 可选
}

响应示例:
{
  "code": 0,
  "data": { ...post },
  "message": "更新成功"
}
```

> **说明：** 如果内容或标题改变，后端异步触发重新索引。

#### DELETE /api/posts/:id — 删除文章

```
响应示例:
{
  "code": 0,
  "data": null,
  "message": "删除成功"
}
```

> **说明：** 删除时同步清理 `post_chunks` 中的分块数据（ON DELETE CASCADE）。

### 5.3 分类接口

#### GET /api/categories — 获取所有分类

```
响应示例:
{
  "code": 0,
  "data": [
    {
      "id": 1, "name": "前端", "color": "#3b82f6", "is_preset": 1,
      "post_count": 15, "created_at": "...", "updated_at": "..."
    },
    {
      "id": 2, "name": "后端", "color": "#10b981", "is_preset": 1,
      "post_count": 8, "created_at": "...", "updated_at": "..."
    }
  ],
  "message": "ok"
}
```

#### POST /api/categories — 创建分类

```
请求体:
{ "name": "数据库", "color": "#f59e0b" }    // color 可选

响应示例:
{ "code": 0, "data": { "id": 11 }, "message": "创建成功" }
```

#### PUT /api/categories/:id — 更新分类

```
请求体:
{ "name": "数据库技术", "color": "#ef4444" }

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
      "model_id": "gpt-4o",
      "api_key": "sk-xxx",      // 仅编辑时返回
      "base_url": "https://api.openai.com/v1",
      "is_default": 1,
      "is_enabled": 1,
      "config": {},
      "supportsEmbedding": true
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
  "isDefault": false
}

响应示例:
{ "code": 0, "data": { "id": 3 }, "message": "创建成功" }
```

#### PUT /api/ai-models/:id — 更新 AI 模型配置

```
请求体:
{
  "name": "GLM-4 Plus",
  "modelId": "glm-4-plus",
  "apiKey": "new-api-key",
  "baseUrl": "...",
  "isDefault": true
}

响应示例:
{ "code": 0, "data": null, "message": "更新成功" }
```

#### DELETE /api/ai-models/:id — 删除 AI 模型

```
响应示例:
{ "code": 0, "data": null, "message": "删除成功" }
```

#### POST /api/ai-models/:id/test — 测试模型连接

```
请求体: 空

响应示例:
{ "code": 0, "data": "连接成功！回复: 连接成功", "message": "ok" }
```

### 5.5 RAG 搜索接口

#### POST /api/search — 语义搜索

```
请求体:
{
  "query": "Vue 响应式原理是什么",
  "topK": 5,              // 可选，默认 5
  "threshold": 0.0        // 可选，相似度阈值
}

响应示例:
{
  "code": 0,
  "data": {
    "results": [
      {
        "postId": 1,
        "postTitle": "Vue 3 响应式系统详解",
        "chunkId": 5,
        "chunkText": "Vue 3 使用 Proxy 实现响应式...",
        "chunkIndex": 0,
        "score": 0.92
      }
    ],
    "hasVectorData": true,
    "isFallback": false
  },
  "message": "success"
}
```

**搜索降级策略：**
1. 有向量数据 → 余弦相似度语义搜索
2. 有分块无向量 → `chunk_text LIKE` 关键词匹配
3. 从未索引 → `title LIKE` 标题搜索

#### POST /api/search/reindex — 全量重建向量索引

```
请求体: 空

响应示例:
{
  "code": 0,
  "message": "索引重建完成: 5 篇文章",
  "data": {
    "total": 5,
    "succeeded": 5,
    "failed": 0,
    "vectorized": 3,
    "chunked": 2,
    "errors": [],
    "hasEmbeddingModel": true,
    "tip": "模型已识别但 Embedding API 调用失败..."
  }
}
```

#### POST /api/search/index/:postId — 单篇重建索引

```
响应示例:
{
  "code": 0,
  "message": "索引完成",
  "data": {
    "success": true,
    "chunks": 5,
    "vectorized": true
  }
}
```

---

## 6. AI 模块设计

### 6.1 适配器模式架构

所有 AI 厂商统一使用 OpenAI 兼容适配器（`OpenAIProvider`），无需为各厂商单独实现 Provider。

```typescript
// packages/server/src/ai/types.ts
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider?: string;        // 厂商类型
  embeddingModel?: string;  // 指定 Embedding 模型名
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  chat(messages: ChatMessage[], config?: Partial<LLMConfig>): Promise<ChatResult>;
  chatStream(messages: ChatMessage[], config?: Partial<LLMConfig>): AsyncGenerator<StreamChunk>;
  embedding(text: string): Promise<number[]>;
  embeddingBatch(texts: string[]): Promise<number[][]>;
}

export interface ChatResult {
  content: string;
  tokensUsed: { prompt: number; completion: number; total: number };
}
```

### 6.2 适配器工厂

```typescript
// packages/server/src/ai/factory.ts
import { OpenAIProvider } from './providers/openai';

export type ProviderType = 'openai' | 'zhipu' | 'qwen' | 'deepseek';

// 所有厂商统一使用 OpenAI 兼容适配器
const providerMap: Record<ProviderType, new (config: LLMConfig) => LLMProvider> = {
  openai: OpenAIProvider,
  zhipu: OpenAIProvider,
  qwen: OpenAIProvider,
  deepseek: OpenAIProvider,
};

// 各厂商默认 Base URL 和 Embedding 模型
const DEFAULT_BASE_URLS: Record<ProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  deepseek: 'https://api.deepseek.com',
};

// 支持 Embedding 的厂商
const EMBEDDING_ENABLED_PROVIDERS: ProviderType[] = ['openai', 'zhipu', 'qwen'];
export function supportsEmbedding(provider: string): boolean {
  return EMBEDDING_ENABLED_PROVIDERS.includes(provider as ProviderType);
}
```

### 6.3 Embedding URL 构建

不同厂商的 baseUrl 版本号不同，通过正则自动适配：

```typescript
private getEmbeddingUrl(baseUrl: string): string {
  if (/\/v\d+$/.test(baseUrl)) {
    return `${baseUrl}/embeddings`;
  }
  return `${baseUrl}/v1/embeddings`;
}
// 示例:
//   https://api.openai.com/v1              → /v1/embeddings
//   https://open.bigmodel.cn/api/paas/v4    → /v4/embeddings
//   https://api.deepseek.com                → /v1/embeddings
```

Embedding 模型自动选择：优先使用用户配置的聊天模型（如包含 "embedding"），否则使用厂商默认的 Embedding 模型。

### 6.4 厂商 Embedding 支持一览

| 厂商 | ProviderType | 支持 Embedding | 默认 Embedding 模型 | 说明 |
|------|-------------|:------------:|-------------------|------|
| OpenAI | `openai` | ✅ | `text-embedding-3-small` (1536维) | 推荐，费用极低 |
| 智谱AI | `zhipu` | ✅ | `embedding-2` (1024维) | 中文优化 |
| 通义千问 | `qwen` | ✅ | `text-embedding-v2` (1536维) | 有免费额度 |
| DeepSeek | `deepseek` | ❌ | — | 无 Embedding API |

---

## 7. RAG 流程设计

### 7.1 整体流程

```
【索引构建流程 — 写入】
创建/更新文章 → postController 异步调用 indexPost()
  → 清空旧分块
  → chunker.splitText() — 按 Markdown 结构分块
  → embedding.generateEmbeddings() — AI 模型批量向量化（失败则记录错误，继续分块存储）
  → 存储到 post_chunks 表（文本 + 向量 JSON）
  → 标记 posts.is_vectorized = 1

【语义搜索流程 — 读取】
用户输入查询 → semanticSearch()
  第 1 级: 有向量 → 生成查询向量 → 余弦相似度检索
  第 2 级: 无向量 → chunk_text LIKE 关键词匹配
  第 3 级: 无分块 → title LIKE 标题搜索
```

### 7.2 文本分块 — chunker.ts

```typescript
// 分隔符优先级
separator: ['\n## ', '\n### ', '\n\n', '\n', '。', '. ']
// 参数
maxTokens: 512    // 每块最大 token 数
overlap: 50       // 相邻块重叠 token 数
```

**处理步骤：**
1. `stripMetadata()` — 去除 YAML frontmatter
2. `splitBySeparator()` — 按最高优先级分隔符递归切分
3. `mergeShortChunks()` — 合并过短片段
4. `addOverlap()` — 超过 80% 阈值的块添加重叠
5. `estimateTokens()` — 中英混合估算（中文≈1.5字符/token，英文≈4字符/token）

### 7.3 Embedding 生成 — embedding.ts

**Provider 自动发现：** 遍历所有已启用模型，按 `is_default DESC` 排序，用 `supportsEmbedding()` 过滤，找到第一个可用的。若无可用模型返回 `null`（触发降级）。

```typescript
export async function generateEmbeddings(texts: string[]): Promise<number[][] | null> {
  const provider = getAvailableProvider();  // 只查找支持 Embedding 的模型
  if (!provider) return null;
  return await provider.embeddingBatch(texts);  // 不 catch，让 indexPost 处理错误
}
```

### 7.4 向量检索 — retriever.ts

在 JS 中计算余弦相似度，无需额外的向量数据库：

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

检索步骤：查询所有有向量的块 → 解析 JSON 向量 → 计算余弦相似度 → 排序取 Top-K。

### 7.5 索引编排 — index.ts

**`indexPost(postId)`：** 清旧块 → 分块 → 批量向量化（可能失败）→ 存储 → 标记。返回 `{ success, chunks, vectorized, error? }`。

**`reindexAll()`：** 遍历所有文章 → 逐篇 `indexPost` → 收集统计。返回 `{ total, vectorized, chunked, errors[] }`。

**`semanticSearch(query)`：** 三级降级搜索，返回 `{ results, hasVectorData, isFallback }`。

### 7.6 自动向量化触发

在 [postController.ts](e:\project\blog\packages\server\src\controllers\postController.ts) 中：
- **创建文章后**（第 86 行）：`indexPost(result.id).catch(...)` — 异步，不阻塞响应
- **更新文章后**（第 139 行）：内容/标题改变时 `indexPost(id).catch(...)`
- **删除文章时**（第 146 行）：`deletePostChunks(postId)` — 同步清理

### 7.7 错误传播设计

系统设计了三层错误传播机制，确保问题不会静默吞没：
1. `generateEmbeddings()` — API 错误直接 throw，不 catch
2. `indexPost()` — catch 错误并以 `{ vectorized: false, error }` 返回
3. `reindexAll()` — 收集所有错误到 `errors[]` 数组
4. 前端收到详细统计后，通过 Toast 显示具体失败原因（API Key 错误 / 余额不足 / 模型不支持等）

---

## 8. 前端架构设计

### 8.1 路由设计

```typescript
// packages/client/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'Home', component: () => import('@/views/Home.vue') },
      { path: 'posts', name: 'PostList', component: () => import('@/views/PostList.vue') },
      { path: 'post/new', name: 'PostCreate', component: () => import('@/views/PostEdit.vue') },
      { path: 'post/edit/:id', name: 'PostEdit', component: () => import('@/views/PostEdit.vue') },
      { path: 'post/:id', name: 'PostDetail', component: () => import('@/views/PostDetail.vue') },
      { path: 'categories', name: 'Categories', component: () => import('@/views/Categories.vue') },
      { path: 'search', name: 'Search', component: () => import('@/views/Search.vue') },
      { path: 'ai', name: 'AIChat', component: () => import('@/views/AIChat.vue') },
      { path: 'settings', name: 'Settings', component: () => import('@/views/Settings.vue') },
    ]
  }
]

export default router
```

### 8.2 状态管理（Pinia Stores）

实际仅包含两个 Store（位于 `packages/client/src/stores/`）：
- **posts.ts** — 文章 CRUD 与列表管理（含分页、分类筛选）
- **categories.ts** — 分类列表与选中状态

> 没有 AI Store，AI 模型配置直接在 Settings 页面中通过 API 调用管理。

```typescript
// packages/client/src/stores/posts.ts
import { defineStore } from 'pinia';

// 实际实现包含: posts, currentPost, loading, total,
// fetchPosts, fetchPost, createPost, updatePost, deletePost
```

### 8.3 组件结构

```
components/
├── common/                    # 基础 UI 组件
│   ├── CategoryPicker.vue     # 分类选择器
│   ├── CategoryTag.vue        # 分类标签
│   ├── ConfirmDialog.vue      # 确认弹窗
│   ├── Empty.vue              # 空状态占位
│   ├── Icon.vue               # SVG 图标
│   ├── Pagination.vue         # 分页组件
│   └── Toast.vue              # 消息提示
└── layout/                    # 布局组件
    ├── AppHeader.vue          # 顶部导航栏
    ├── AppLayout.vue          # 整体布局容器
    └── AppSidebar.vue         # 侧边栏（分类导航）
```

> 没有独立的 editor/、post/、ai/ 组件目录，相关 UI 直接在视图文件中实现。

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
pnpm add -D typescript prettier -w
```

### 9.3 安装和启动命令

```bash
# 安装所有依赖
pnpm install

# 启动前端开发服务器
pnpm --filter @knowledge-blog/client dev

# 启动后端开发服务器
pnpm --filter @knowledge-blog/server dev

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
  "name": "knowledge-blog",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm --filter @knowledge-blog/server dev\" \"pnpm --filter @knowledge-blog/client dev\"",
    "build": "pnpm --filter @knowledge-blog/server build && pnpm --filter @knowledge-blog/client build",
    "start": "pnpm --filter @knowledge-blog/server start"
  }
}
```

### 9.5 开发工作流

1. **功能分支开发**：从 `main` 切出 `feat/xxx` 分支
2. **前后端并行开发**：`pnpm dev` 同时启动前后端（通过 `concurrently`），前端 Vite 代理 API 请求到后端
3. **数据库变更**：数据库 schema 在 `packages/server/src/database/schema.ts` 中集中管理，修改后需删除旧 `.db` 文件或手动重建

**Vite 代理配置：**

```typescript
// packages/client/vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
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

# 2. 构建后端
pnpm --filter @knowledge-blog/server build

# 3. 构建前端
pnpm --filter @knowledge-blog/client build

# 4. 启动生产服务
pnpm start
```

> 生产模式下后端运行在 `http://localhost:3000`，前端构建产物位于 `packages/client/dist`，需通过 Nginx 或类似工具托管并代理 `/api` 请求到后端。

### 10.2 数据迁移方案

#### JSON 导出/导入

- **导出**：将所有业务数据序列化为 JSON 文件，附带版本号和时间戳
- **导入**：支持合并（不覆盖已有）和覆盖两种策略
- **注意**：API Key 等敏感信息不包含在导出数据中

#### SQLite 文件迁移

- 直接复制 `packages/server/data/blog.db` 文件即可完成数据迁移
- 优点：完整保留所有数据，包括向量 Embedding
- 缺点：文件体积较大

#### 迁移数据结构

```typescript
interface ExportData {
  version: string;
  exportedAt: string;
  data: {
    posts: Post[];
    categories: Category[];
    // aiModels 不导出 apiKey
    aiModels: Omit<AIModel, 'apiKey'>[];
  };
}
```

### 10.3 环境变量

```bash
# .env（开发环境）
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/blog.db

# .env.production（生产环境）
NODE_ENV=production
PORT=3000
DATABASE_PATH=./data/blog.db
```

---

## 附录：快速参考

### 常用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装所有依赖 |
| `pnpm dev` | 启动开发环境（前后端同时） |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务 |

### 端口规划

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 Dev Server | 5173 | Vite 开发服务器 |
| 后端 API Server | 3000 | Koa2 API 服务 |
