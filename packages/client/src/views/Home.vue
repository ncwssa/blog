<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useCategoriesStore } from '@/stores/categories'
import Icon from '@/components/common/Icon.vue'
import CategoryTag from '@/components/common/CategoryTag.vue'

const router = useRouter()
const postsStore = usePostsStore()
const categoriesStore = useCategoriesStore()

const totalPosts = computed(() => postsStore.total)
const totalCategories = computed(() => categoriesStore.categories.length)
const recentPosts = computed(() => postsStore.posts.slice(0, 5))

const categoryStats = computed(() =>
  [...categoriesStore.categories]
    .map((c) => ({ name: c.name, color: c.color, count: c.post_count ?? 0 }))
    .sort((a, b) => b.count - a.count)
)

const quickActions = [
  { label: '写文章', route: 'PostCreate', icon: 'edit' as const },
  { label: '浏览博客', route: 'PostList', icon: 'file-text' as const },
  { label: '搜索知识', route: 'Search', icon: 'search' as const },
  { label: 'AI 问答', route: 'AIChat', icon: 'bot' as const },
]

onMounted(async () => {
  postsStore.pageSize = 5
  await Promise.all([
    postsStore.fetchPosts(),
    categoriesStore.fetchCategories()
  ])
})

function goToPost(id: number) {
  router.push({ name: 'PostDetail', params: { id: String(id) } })
}

function go(name: string) {
  router.push({ name })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div>
    <!-- 欢迎 -->
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-[#0a0a0a]">仪表盘</h1>
      <p class="text-sm text-gray-400 mt-1">知识博客系统概览</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl border border-gray-100 p-5">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-lg">📄</div>
          <div>
            <p class="text-xs text-gray-400 mb-0.5">文章总数</p>
            <p class="text-2xl font-bold text-[#0a0a0a]">{{ totalPosts }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 p-5">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-lg">📂</div>
          <div>
            <p class="text-xs text-gray-400 mb-0.5">分类数量</p>
            <p class="text-2xl font-bold text-[#0a0a0a]">{{ totalCategories }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 p-5">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-lg">🔍</div>
          <div>
            <p class="text-xs text-gray-400 mb-0.5">知识检索</p>
            <button class="text-xs text-gray-500 hover:text-[#0a0a0a] font-medium" @click="go('Search')">
              去搜索 →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="mb-6">
      <h2 class="text-sm font-semibold text-[#0a0a0a] mb-3">快捷操作</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          v-for="a in quickActions"
          :key="a.label"
          class="flex flex-col items-center gap-2 bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all"
          @click="go(a.route)"
        >
          <Icon :name="a.icon" :size="20" class="text-gray-500" />
          <span class="text-xs font-medium text-gray-600">{{ a.label }}</span>
        </button>
      </div>
    </div>

    <!-- 最近文章 + 分类分布 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-[#0a0a0a]">最近文章</h2>
          <button
            v-if="totalPosts > 0"
            class="text-xs text-gray-500 hover:text-[#0a0a0a]"
            @click="go('PostList')"
          >查看全部 →</button>
        </div>

        <div v-if="postsStore.loading" class="text-center py-8 text-sm text-gray-300">加载中...</div>

        <div v-else-if="recentPosts.length === 0" class="text-center py-8">
          <p class="text-sm text-gray-300 mb-3">还没有文章</p>
          <button
            class="px-4 py-2 bg-[#0a0a0a] text-white text-sm rounded-xl hover:opacity-90 transition-opacity"
            @click="go('PostCreate')"
          >开始写作</button>
        </div>

        <div v-else class="divide-y divide-gray-50">
          <div
            v-for="post in recentPosts"
            :key="post.id"
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
            @click="goToPost(post.id)"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-[#0a0a0a] truncate">{{ post.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(post.created_at) }} · {{ post.word_count }} 字</p>
            </div>
            <div v-if="post.categories?.length" class="ml-3 flex flex-wrap gap-1">
              <CategoryTag v-for="cat in post.categories" :key="cat.id" :category="cat" size="sm" />
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 class="text-sm font-semibold text-[#0a0a0a] mb-4">分类分布</h2>

        <div v-if="categoryStats.length === 0" class="text-center py-8 text-sm text-gray-300">暂无分类</div>

        <div v-else class="space-y-3">
          <div v-for="cat in categoryStats" :key="cat.name" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :style="{ backgroundColor: cat.color || '#d1d5db' }"
              />
              <span class="text-sm text-gray-600">{{ cat.name }}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{
                    width: Math.min(100, (cat.count / Math.max(1, categoryStats[0].count)) * 80) + '%',
                    backgroundColor: cat.color || '#0a0a0a'
                  }"
                />
              </div>
              <span class="text-xs text-gray-400 w-4 text-right">{{ cat.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
