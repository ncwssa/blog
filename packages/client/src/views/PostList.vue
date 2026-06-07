<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useCategoriesStore } from '@/stores/categories'
import Pagination from '@/components/common/Pagination.vue'
import Empty from '@/components/common/Empty.vue'

const router = useRouter()
const postsStore = usePostsStore()
const categoriesStore = useCategoriesStore()

const searchKeyword = ref('')
const selectedCategoryId = ref<number | undefined>()

onMounted(() => {
  postsStore.pageSize = 10
  postsStore.fetchPosts()
  categoriesStore.fetchCategories()
})

watch(
  () => [postsStore.page, postsStore.filters],
  () => postsStore.fetchPosts(),
  { deep: true }
)

function handleSearch() {
  postsStore.setFilter({ keyword: searchKeyword.value || undefined })
}

function handleCategoryFilter() {
  postsStore.setFilter({ categoryId: selectedCategoryId.value })
}

function handlePageChange(page: number) {
  postsStore.setPage(page)
}

function goToPost(id: number) {
  router.push({ name: 'PostDetail', params: { id: String(id) } })
}

function goToCreate() {
  router.push({ name: 'PostCreate' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  })
}

function getSummary(content: string) {
  if (!content) return ''
  return content.length > 100 ? content.slice(0, 100) + '...' : content
}
</script>

<template>
  <div>
    <!-- 顶部 -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-lg font-semibold text-[#0a0a0a]">博客列表</h1>
        <p class="text-sm text-gray-400 mt-0.5">浏览所有知识文章</p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 h-9 bg-[#0a0a0a] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
        @click="goToCreate"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        写文章
      </button>
    </div>

    <!-- 筛选区 -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="relative flex-1 max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索文章标题..."
          class="w-full pl-9 pr-3 h-9 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 focus:ring-0 transition-colors"
          @keyup.enter="handleSearch"
        />
      </div>
      <select
        v-model="selectedCategoryId"
        class="h-9 px-3 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors"
        @change="handleCategoryFilter"
      >
        <option :value="undefined">全部分类</option>
        <option v-for="cat in categoriesStore.categories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </option>
      </select>
      <button
        class="h-9 px-4 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        @click="handleSearch"
      >搜索</button>
    </div>

    <!-- 加载/空/列表 -->
    <div v-if="postsStore.loading" class="flex justify-center py-20">
      <div class="text-sm text-gray-300">加载中...</div>
    </div>

    <Empty v-else-if="postsStore.posts.length === 0" message="还没有文章，快来写一篇吧！" icon="📝">
      <button
        class="mt-4 px-4 py-2 bg-[#0a0a0a] text-white text-sm rounded-xl hover:opacity-90 transition-opacity"
        @click="goToCreate"
      >开始写作</button>
    </Empty>

    <div v-else class="space-y-3">
      <div
        v-for="post in postsStore.posts"
        :key="post.id"
        class="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer"
        @click="goToPost(post.id)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-semibold text-[#0a0a0a] mb-1.5 line-clamp-1">{{ post.title }}</h2>
            <p class="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">{{ getSummary(post.content) }}</p>
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span>{{ formatDate(post.created_at) }}</span>
              <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>{{ post.word_count }} 字</span>
            </div>
          </div>
          <span
            v-if="post.category_name"
            class="shrink-0 px-2.5 py-1 text-[11px] bg-gray-50 text-gray-500 rounded-lg whitespace-nowrap"
          >{{ post.category_name }}</span>
        </div>
      </div>
    </div>

    <Pagination
      :page="postsStore.page"
      :page-size="postsStore.pageSize"
      :total="postsStore.total"
      @update:page="handlePageChange"
    />
  </div>
</template>
