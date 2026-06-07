English | [中文](./README.md)

<div align="center">

# 📚 Knowledge Blog

**Personal Local Knowledge Blog System — AI-Enhanced Knowledge Management Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 📖 Introduction

Knowledge Blog is a **local-first knowledge blog system** designed for individual developers. It integrates AI capabilities with semantic search and intelligent summarization, creating your personal knowledge management and review platform.

- 🔒 All data stored locally, no server required, privacy guaranteed
- 🚀 One-click startup, zero configuration, no login needed
- 🧠 RAG-powered AI that answers questions based on your knowledge base

---

## ✨ Features

- 📝 **Blog Management** — Markdown editor with category & tag management, live preview
- 🤖 **AI Assistant** — RAG-based knowledge Q&A, multi-turn conversations, source citations
- 🔍 **Semantic Search** — Vector similarity-based intelligent retrieval, natural language queries
- 🔄 **Multi-Model Support** — Flexibly switch between OpenAI, Zhipu AI, Qwen, and DeepSeek
- 📦 **Data Migration** — One-click JSON export/import for easy backup and migration
- 🚀 **Local Deployment** — Zero-config startup, single-user, no authentication required

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|-------|-----------|-------------|
| **Frontend** | Vue 3 + Vite | Composition API, fast HMR |
| **UI Framework** | Tailwind CSS | Utility-first CSS framework |
| **State Management** | Pinia | Lightweight state management |
| **Routing** | Vue Router 4 | Client-side routing |
| **Backend** | Koa2 + TypeScript | Lightweight web framework |
| **Database** | SQLite + sqlite-vss | Zero-config DB + vector search |
| **AI Interface** | Multi-provider adapter pattern | Unified API, flexible switching |
| **Package Manager** | pnpm Workspace | Monorepo management |
| **Language** | TypeScript | Full-stack type safety |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [pnpm](https://pnpm.io/) >= 8.0.0

### Installation & Startup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/knowledge-blog.git
cd knowledge-blog

# 2. Install dependencies
pnpm install

# 3. Start development environment (frontend & backend simultaneously)
pnpm dev
```

After startup, visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

```bash
pnpm build
pnpm start
```

---

## 📁 Project Structure

```
knowledge-blog/
├── packages/
│   ├── client/              # Frontend - Vue 3 + Vite
│   │   ├── src/
│   │   │   ├── api/         # API request modules
│   │   │   ├── components/  # Reusable components
│   │   │   ├── composables/ # Composition functions
│   │   │   ├── pages/       # Page views
│   │   │   ├── router/      # Route configuration
│   │   │   ├── stores/      # Pinia state management
│   │   │   └── types/       # Type definitions
│   │   └── package.json
│   ├── server/              # Backend - Koa2 + TypeScript
│   │   ├── src/
│   │   │   ├── ai/          # AI multi-provider adapters
│   │   │   ├── controllers/ # Controller layer
│   │   │   ├── database/    # Database init & migrations
│   │   │   ├── middlewares/ # Koa middlewares
│   │   │   ├── rag/         # RAG engine
│   │   │   ├── routes/      # Route definitions
│   │   │   └── services/    # Business logic layer
│   │   └── package.json
│   └── shared/              # Shared types & utilities
│       ├── src/
│       │   └── types/       # Shared type definitions
│       └── package.json
├── docs/                    # Documentation
│   ├── PRD.md               # Product Requirements Document
│   └── DEVELOPMENT.md       # Technical Development Document
├── package.json             # Root configuration
├── pnpm-workspace.yaml      # pnpm workspace config
└── .gitignore
```

---

## 📚 Development Guide

For detailed technical architecture, API design, and database schema, please refer to:

- [Technical Development Document](./docs/DEVELOPMENT.md) — Complete architecture design and implementation details
- [Product Requirements Document](./docs/PRD.md) — Feature requirements and page planning

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
