[English](./README_EN.md) | 中文

<div align="center">

# 📚 Knowledge Blog

**个人本地知识总结博客系统 — AI 增强的知识管理平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 📖 项目简介

Knowledge Blog 是一款面向个人开发者的**本地知识总结博客系统**，集成 AI 能力，支持语义搜索与智能总结，打造个人专属的知识管理与复习平台。

- 🔒 所有数据本地存储，无需服务器，隐私安全
- 🚀 一键启动，零配置，无需登录
- 🧠 基于 RAG 技术，让 AI 基于你的知识库回答问题

---

## ✨ 功能特性

- 📝 **博客管理** — Markdown 编辑器，支持分类、标签管理，实时预览
- 🤖 **AI 智能助手** — 基于 RAG 的知识问答，多轮对话，引用来源标注
- 🔍 **语义搜索** — 基于向量相似度的智能检索，自然语言查询
- 🔄 **多模型支持** — OpenAI、智谱AI、通义千问、DeepSeek 灵活切换
- 📦 **数据迁移** — 一键导出/导入 JSON，轻松备份与迁移
- 🚀 **本地部署** — 零配置启动，单用户使用，无需登录

---

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | Vue 3 + Vite | Composition API，快速热更新 |
| **UI 框架** | Tailwind CSS | 原子化 CSS，快速构建界面 |
| **状态管理** | Pinia | 轻量级状态管理 |
| **路由** | Vue Router 4 | 前端路由方案 |
| **后端** | Koa2 + TypeScript | 轻量 Web 框架 |
| **数据库** | SQLite + sqlite-vss | 零配置数据库 + 向量搜索 |
| **AI 接口** | 多厂商适配器模式 | 统一接口，灵活切换 |
| **包管理** | pnpm Workspace | Monorepo 管理 |
| **语言** | TypeScript | 全栈类型安全 |

---

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18.0.0
- [pnpm](https://pnpm.io/) >= 8.0.0

### 安装与启动

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/knowledge-blog.git
cd knowledge-blog

# 2. 安装依赖
pnpm install

# 3. 启动开发环境（前后端同时启动）
pnpm dev
```

启动后访问：
- 前端：http://localhost:3000
- 后端 API：http://localhost:3001

### 构建生产版本

```bash
pnpm build
pnpm start
```

---

## 📁 项目结构

```
knowledge-blog/
├── packages/
│   ├── client/              # 前端 - Vue 3 + Vite
│   │   ├── src/
│   │   │   ├── api/         # API 请求封装
│   │   │   ├── components/  # 通用组件
│   │   │   ├── composables/ # 组合式函数
│   │   │   ├── pages/       # 页面视图
│   │   │   ├── router/      # 路由配置
│   │   │   ├── stores/      # Pinia 状态管理
│   │   │   └── types/       # 类型定义
│   │   └── package.json
│   ├── server/              # 后端 - Koa2 + TypeScript
│   │   ├── src/
│   │   │   ├── ai/          # AI 多厂商适配器
│   │   │   ├── controllers/ # 控制器层
│   │   │   ├── database/    # 数据库初始化与迁移
│   │   │   ├── middlewares/ # Koa 中间件
│   │   │   ├── rag/         # RAG 引擎
│   │   │   ├── routes/      # 路由定义
│   │   │   └── services/    # 业务逻辑层
│   │   └── package.json
│   └── shared/              # 共享类型与工具
│       ├── src/
│       │   └── types/       # 前后端共享类型定义
│       └── package.json
├── docs/                    # 项目文档
│   ├── PRD.md               # 产品需求文档
│   └── DEVELOPMENT.md       # 技术开发文档
├── package.json             # 根配置
├── pnpm-workspace.yaml      # pnpm 工作区配置
└── .gitignore
```

---

## 📚 开发指南

详细的技术架构、API 设计、数据库设计等内容请参阅：

- [技术开发文档](./docs/DEVELOPMENT.md) — 完整的架构设计与实现细节
- [产品需求文档](./docs/PRD.md) — 功能需求与页面规划

---

## 📄 License

本项目采用 [MIT License](./LICENSE) 开源协议。
