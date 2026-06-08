<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { semanticSearch } from '@/api/search'

const route = useRoute()
const router = useRouter()

const query = ref('')
const results = ref<any[]>([])
const loading = ref(false)
const searched = ref(false)
const hasVectorData = ref(false)
const isFallback = ref(false)

onMounted(() => {
  // 首次加载自动获取所有文章
  loadAll()
  if (route.query.q) {
    query.value = route.query.q as string
    handleSearch()
  }
})

async function loadAll() {
  loading.value = true
  try {
    const res = await semanticSearch({ query: '', topK: 20 })
    results.value = res.data.results
    hasVectorData.value = res.data.hasVectorData
    isFallback.value = res.data.isFallback
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  if (!query.value.trim()) {
    loadAll()
    return
  }
  searched.value = true
  try {
    const res = await semanticSearch({ query: query.value.trim(), topK: 10 })
    results.value = res.data.results
    hasVectorData.value = res.data.hasVectorData
    isFallback.value = res.data.isFallback
  } catch (error) {
    console.error('搜索失败:', error)
    results.value = []
  } finally {
    loading.value = false
  }
}

function goToPost(id: number) {
  router.push({ name: 'PostDetail', params: { id: String(id) } })
}

function formatScore(score: number) {
  return (score * 100).toFixed(1) + '%'
}
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-[#0a0a0a]">知识库搜索</h1>
      <p class="text-sm text-gray-400 mt-1">通过自然语言搜索你的知识笔记，找到相关内容</p>
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
          placeholder="输入自然语言搜索你的知识库..."
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

    <!-- 降级搜索提示 -->
    <div v-if="isFallback && results.length > 0"
      class="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-700">
      ⚡ 当前为关键词匹配模式，搜索结果可能不够精准。
      前往 <router-link to="/settings" class="font-medium underline">设置 → AI 模型管理</router-link>
      配置并设默认模型后重建索引，即可启用智能语义搜索。
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="text-sm text-gray-300">搜索中...</div>
    </div>

    <!-- 搜索结果 -->
    <div v-else-if="results.length > 0" class="space-y-4">
      <p class="text-sm text-gray-400 mb-3">共找到 {{ results.length }} 个相关片段</p>
      <div
        v-for="item in results"
        :key="item.chunkId"
        class="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer"
        @click="goToPost(item.postId)"
      >
        <!-- 匹配度 + 来源标题 -->
        <div class="flex items-center gap-3 mb-2">
          <span
            class="text-[11px] font-medium px-2 py-0.5 rounded-full"
            :class="item.score >= 0.8 ? 'bg-green-50 text-green-600' : item.score >= 0.6 ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-500'"
          >
            {{ formatScore(item.score) }} 匹配
          </span>
          <span class="text-xs text-gray-400 truncate">
            来源: {{ item.postTitle }}
          </span>
        </div>

        <!-- 匹配片段 -->
        <p class="text-sm text-gray-600 leading-relaxed line-clamp-4">
          {{ item.chunkText }}
        </p>
      </div>
    </div>

    <!-- 无结果 -->
    <div v-else-if="searched" class="flex flex-col items-center justify-center py-20">
      <span class="text-4xl mb-4">🔍</span>
      <p class="text-sm text-gray-400">未找到匹配的内容</p>
      <p class="text-xs text-gray-300 mt-2">试试其他关键词或更自然的描述</p>
    </div>

    <!-- 初始状态 -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <span class="text-4xl mb-4">📚</span>
      <p class="text-sm text-gray-400">输入自然语言开始搜索你的知识库</p>
      <p class="text-xs text-gray-300 mt-2">例如：Vue 3 响应式原理是什么？</p>
    </div>
  </div>
</template>
