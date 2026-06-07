<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const query = ref('')
const results = ref<any[]>([])
const loading = ref(false)
const searched = ref(false)

onMounted(() => {
  // 如果 URL 有 q 参数，自动搜索
  if (route.query.q) {
    query.value = route.query.q as string
    handleSearch()
  }
})

async function handleSearch() {
  if (!query.value.trim()) return

  loading.value = true
  searched.value = true
  try {
    // 简单关键词搜索通过博客列表接口实现
    const { getPosts } = await import('@/api/posts')
    const res = await getPosts({ keyword: query.value.trim(), pageSize: 50 })
    results.value = res.data.list
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

function goToPost(id: number) {
  router.push({ name: 'PostDetail', params: { id: String(id) } })
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-[#0a0a0a]">知识库搜索</h1>
      <p class="text-sm text-gray-400 mt-1">通过关键词搜索你的知识笔记，快速找到相关内容</p>
    </div>

    <!-- 搜索框 -->
    <div class="mb-8">
      <div class="relative max-w-xl">
        <svg
          class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
        <input
          v-model="query"
          type="text"
          placeholder="输入关键词搜索文章..."
          class="w-full pl-10 pr-24 h-11 text-sm bg-gray-50 border-0 rounded-xl outline-none focus:bg-gray-100 transition-colors placeholder:text-gray-300"
          @keyup.enter="handleSearch"
        />
        <button
          class="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 h-8 bg-[#0a0a0a] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          @click="handleSearch"
        >
          搜索
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="text-sm text-gray-300">搜索中...</div>
    </div>

    <!-- 搜索结果 -->
    <div v-else-if="results.length > 0" class="space-y-3">
      <p class="text-sm text-gray-400 mb-3">共找到 {{ results.length }} 篇相关文章</p>
      <div
        v-for="post in results"
        :key="post.id"
        class="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer"
        @click="goToPost(post.id)"
      >
        <h3 class="text-base font-semibold text-[#0a0a0a] mb-2 line-clamp-1">{{ post.title }}</h3>
        <p class="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {{ post.summary || post.content?.slice(0, 150) }}
        </p>
        <div class="flex items-center gap-3 text-xs text-gray-400">
          <span>{{ formatDate(post.created_at) }}</span>
          <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span>{{ post.word_count }} 字</span>
        </div>
      </div>
    </div>

    <!-- 无结果 -->
    <div v-else-if="searched" class="flex flex-col items-center justify-center py-20">
      <span class="text-4xl mb-4">🔍</span>
      <p class="text-sm text-gray-400">未找到匹配的文章</p>
      <p class="text-xs text-gray-300 mt-2">试试其他关键词</p>
    </div>

    <!-- 初始状态 -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <span class="text-4xl mb-4">📚</span>
      <p class="text-sm text-gray-400">输入关键词开始搜索你的知识库</p>
    </div>
  </div>
</template>
