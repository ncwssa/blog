<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useCategoriesStore } from '@/stores/categories'
import Pagination from '@/components/common/Pagination.vue'
import Empty from '@/components/common/Empty.vue'

const router = useRouter()
const postsStore = usePostsStore()
const categoriesStore = useCategoriesStore()

// 搜索关键词（本地绑定，回车时触发筛选）
const searchKeyword = ref('')

// 初始化：加载数据
onMounted(() => {
  postsStore.fetchPosts()
  categoriesStore.fetchCategories()
})

// 监听筛选条件和页码变化
watch(
  () => [postsStore.page, postsStore.filters],
  () => {
    postsStore.fetchPosts()
  },
  { deep: true }
)

// 搜索处理
function handleSearch() {
  postsStore.setFilter({ keyword: searchKeyword.value || undefined })
}

// 分类筛选
function handleCategoryFilter(event: Event) {
  const target = event.target as HTMLSelectElement
  const value = target.value
  postsStore.setFilter({ categoryId: value ? Number(value) : undefined })
}

// 翻页
function handlePageChange(page: number) {
  postsStore.setPage(page)
  postsStore.fetchPosts()
}

// 跳转到文章详情
function goToPost(id: number) {
  router.push({ name: 'PostDetail', params: { id } })
}

// 跳转到新建页
function goToCreate() {
  router.push({ name: 'PostCreate' })
}

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取摘要：content 前 100 个字符
function getSummary(content: string) {
  if (!content) return ''
  return content.length > 100 ? content.slice(0, 100) + '...' : content
}

// 根据 category_id 获取分类名称
function getCategoryName(categoryId: number | null): string {
  if (!categoryId) return ''
  const cat = categoriesStore.categories.find((c) => c.id === categoryId)
  return cat ? cat.name : ''
}

import { ref } from 'vue'
</script>

<template>
  <div>
    <!-- 顶部：标题 + 写博客按钮 -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">我的博客</h1>
      <button
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        @click="goToCreate"
      >
        + 写博客
      </button>
    </div>

    <!-- 筛选区：分类下拉 + 搜索框 -->
    <div class="flex items-center gap-4 mb-6">
      <!-- 分类筛选 -->
      <select
        class="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        @change="handleCategoryFilter"
      >
        <option value="">全部分类</option>
        <option
          v-for="cat in categoriesStore.categories"
          :key="cat.id"
          :value="cat.id"
        >
          {{ cat.name }}
        </option>
      </select>

      <!-- 搜索框 -->
      <div class="relative flex-1 max-w-md">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索文章标题..."
          class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @keyup.enter="handleSearch"
        />
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
          @click="handleSearch"
        >
          搜索
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="postsStore.loading" class="flex justify-center py-16">
      <div class="text-gray-400 text-sm">加载中...</div>
    </div>

    <!-- 空状态 -->
    <Empty
      v-else-if="postsStore.posts.length === 0"
      message="还没有文章，快来写一篇吧！"
      icon="📝"
    >
      <button
        class="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        @click="goToCreate"
      >
        开始写作
      </button>
    </Empty>

    <!-- 博客卡片列表 -->
    <div v-else class="grid gap-4">
      <div
        v-for="post in postsStore.posts"
        :key="post.id"
        class="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
        @click="goToPost(post.id)"
      >
        <!-- 标题行 -->
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-1">
            {{ post.title }}
          </h2>
          <span
            v-if="getCategoryName(post.category_id)"
            class="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full whitespace-nowrap ml-3"
          >
            {{ getCategoryName(post.category_id) }}
          </span>
        </div>

        <!-- 摘要 -->
        <p class="text-sm text-gray-600 mb-3 line-clamp-2">
          {{ getSummary(post.content) }}
        </p>

        <!-- 元信息 -->
        <div class="flex items-center gap-4 text-xs text-gray-400">
          <span>{{ formatDate(post.created_at) }}</span>
          <span>{{ post.word_count }} 字</span>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <Pagination
      :page="postsStore.page"
      :page-size="postsStore.pageSize"
      :total="postsStore.total"
      @update:page="handlePageChange"
    />
  </div>
</template>
