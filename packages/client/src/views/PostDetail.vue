<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useCategoriesStore } from '@/stores/categories'

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()
const categoriesStore = useCategoriesStore()

const postId = computed(() => Number(route.params.id))

// 加载文章详情
onMounted(async () => {
  try {
    await postsStore.fetchPost(postId.value)
    // 确保分类列表已加载
    if (categoriesStore.categories.length === 0) {
      await categoriesStore.fetchCategories()
    }
  } catch (error) {
    alert('加载文章失败，请稍后重试')
  }
})

// 当前文章
const post = computed(() => postsStore.currentPost)

// 获取分类名称
const categoryName = computed(() => {
  if (!post.value?.category_id) return ''
  const cat = categoriesStore.categories.find((c) => c.id === post.value!.category_id)
  return cat ? cat.name : ''
})

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 返回列表
function goBack() {
  router.push({ name: 'Home' })
}

// 编辑文章
function goToEdit() {
  router.push({ name: 'PostEdit', params: { id: postId.value } })
}

// 删除文章
async function handleDelete() {
  if (!window.confirm('确定要删除这篇文章吗？此操作不可撤销。')) return
  try {
    await postsStore.removePost(postId.value)
    alert('删除成功')
    router.push({ name: 'Home' })
  } catch (error) {
    alert('删除失败，请稍后重试')
  }
}
</script>

<template>
  <div>
    <!-- 加载状态 -->
    <div v-if="postsStore.loading" class="flex justify-center py-16">
      <div class="text-gray-400 text-sm">加载中...</div>
    </div>

    <!-- 文章内容 -->
    <div v-else-if="post">
      <!-- 顶部操作栏 -->
      <div class="flex items-center justify-between mb-6">
        <button
          class="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          @click="goBack"
        >
          ← 返回列表
        </button>
        <div class="flex items-center gap-3">
          <button
            class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            @click="goToEdit"
          >
            编辑
          </button>
          <button
            class="px-3 py-1.5 text-sm border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            @click="handleDelete"
          >
            删除
          </button>
        </div>
      </div>

      <!-- 文章头部 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ post.title }}</h1>
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <span v-if="categoryName" class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            {{ categoryName }}
          </span>
          <span>{{ formatDate(post.created_at) }}</span>
          <span>{{ post.word_count }} 字</span>
        </div>
      </div>

      <!-- 文章内容区 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <pre class="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">{{ post.content }}</pre>
      </div>
    </div>

    <!-- 文章不存在 -->
    <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400">
      <span class="text-5xl mb-4">😥</span>
      <p class="text-base">文章不存在或已被删除</p>
      <button
        class="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        @click="goBack"
      >
        返回列表
      </button>
    </div>
  </div>
</template>
