# 侧边栏瘦身 + 网页空白优化

## Context

用户反馈侧边栏"太大了、设计不好"，且"网页中有大量空白"。经分析：

**侧边栏问题**：
- `w-60`（240px）对于仅7个导航项过宽
- 用户信息区（logo+名称+描述）与Header中的Logo重复，浪费约80px垂直空间
- 底部版本号无实际用途
- 导航项内边距偏大（`px-3 py-2.5 gap-3`）

**网页空白问题**：
- 主内容区 `max-w-5xl`（1024px）在宽屏下两侧空白极大（每侧约328px）
- 垂直间距 `py-8` 和 `mb-8` 偏大

**SVG图标冗余**：侧边栏和Home.vue中各有一组v-if/v-else-if SVG链，代码重复、难以维护。

## 修改计划

### Task 1: 创建统一 Icon 组件
- **新建** `e:\project\blog\packages\client\src\components\common\Icon.vue`
- 封装所有使用到的SVG图标（home, file-text, edit, folder, search, bot, settings, plus, chevron-left, trash）
- 通过 `name` prop 选择图标，`size` prop 控制大小
- 消除多处的 v-if/v-else-if SVG 链

### Task 2: 侧边栏瘦身 — AppSidebar.vue
- `w-60` → `w-48`（240px → 192px）
- 移除用户信息区（logo+名称+描述+分隔线）
- 移除底部版本号
- 导航容器：`p-3` → `p-2`
- 导航项：`px-3 py-2.5 gap-3 rounded-xl` → `px-2.5 py-2 gap-2.5 rounded-lg`
- SVG图标替换为 `<Icon :name="item.icon" />`
- mobile保留pt-14，desktop移除：`pt-14 lg:pt-0`

### Task 3: 主布局加宽 — AppLayout.vue
- 内容区 `max-w-5xl` → `max-w-7xl`（1024px → 1280px）
- 顶部间距 `py-8` → `py-6`
- sidebar margin：`lg:ml-60` → `lg:ml-48`

### Task 4: Home.vue 图标替换 + 间距微调
- SVG图标替换为 `<Icon :name="..." :size="20" />`
- `mb-8` → `mb-6`（两处）
- 剩余蓝色链接统一：`text-blue-600` → `text-[#0a0a0a]`（"去搜索→"、"查看全部→"）

### Task 5: PostDetail.vue 剩余蓝色链接清理
- 404页面的"返回首页"：`text-blue-600 hover:text-blue-700` → `text-gray-500 hover:text-[#0a0a0a]`

## 宽度变化量化（1920px屏幕，侧边栏展开）

| 指标 | 改动前 | 改动后 | 优化 |
|------|--------|--------|------|
| 侧边栏宽度 | 240px | 192px | -48px |
| 内容max-width | 1024px | 1280px | +256px |
| 每侧空白 | ~328px | ~224px | -104px |

## 验证方式

```bash
cd e:\project\blog\packages\client && npx vite build
```
确认无编译错误后，运行 `npx vite` 在浏览器中验证：
- 侧边栏已变窄、无用户区、无版本号
- 内容区更宽，空白减少
- 所有图标正常显示
- 响应式：移动端侧边栏收起/展开正常
