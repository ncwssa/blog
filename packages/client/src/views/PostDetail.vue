<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useCategoriesStore } from '@/stores/categories'
import { useToast } from '@/composables/useToast'
import CategoryTag from '@/components/common/CategoryTag.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { summarizePost } from '@/api/ai'

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()
const categoriesStore = useCategoriesStore()

const postId = computed(() => Number(route.params.id))
const post = computed(() => postsStore.currentPost)

const toast = useToast()
const showDeleteConfirm = ref(false)

onMounted(async () => {
  try {
    await postsStore.fetchPost(postId.value)
    if (categoriesStore.categories.length === 0) {
      await categoriesStore.fetchCategories()
    }
  } catch {
    // handled by store
  }
})

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

const aiSummaryLoading = ref(false)
const aiSummaryContent = ref('')
const showAiSummary = ref(false)

async function handleAiSummary() {
  if (aiSummaryLoading.value) return
  aiSummaryLoading.value = true
  aiSummaryContent.value = ''
  showAiSummary.value = true
  try {
    const res = await summarizePost(postId.value)
    aiSummaryContent.value = res.data.summary
  } catch (err: any) {
    toast.error(err.message || 'AI 总结失败')
    showAiSummary.value = false
  } finally {
    aiSummaryLoading.value = false
  }
}

function renderSummaryMarkdown(content: string): string {
  if (!content) return ''
  let html = content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\`\`\`(\w*)\n([\s\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^\s*[-*+] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\s*(\d+)\.\s(.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  html = '<p>' + html + '</p>'
  html = html.replace(/<p><(\/?[uo]l|h[1-3]|pre)/g, '<$1')
  html = html.replace(/(<\/([uo]l|h[1-3]|pre)>)(<\/p>)?/g, '</$2>')
  return html
}

function goBack() { router.push({ name: 'Home' }) }
function goToEdit() { router.push({ name: 'PostEdit', params: { id: postId.value } }) }

function handleDelete() {
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  showDeleteConfirm.value = false
  try {
    await postsStore.removePost(postId.value)
    router.push({ name: 'Home' })
  } catch {
    toast.error('删除失败')
  }
}

function renderMarkdown(content: string): string {
  if (!content) return ''
  let html = content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^\s*[-*+] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\s*(\d+)\.\s(.+)$/gm, '<li>$2</li>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  html = '<p>' + html + '</p>'
  html = html.replace(/<p><(\/?[uo]l|h[1-3]|pre|hr)/g, '<$1')
  html = html.replace(/(<\/([uo]l|h[1-3]|pre|hr)>)<\/p>/g, '</$2>')
  return html
}
</script>

<template>
  <div>
    <!-- 确认删除弹窗 -->
    <ConfirmDialog
      v-model:show="showDeleteConfirm"
      title="删除文章"
      message="确定要删除这篇文章吗？此操作不可撤销。"
      confirm-text="删除"
      :danger="true"
      @confirm="confirmDelete"
    />

    <!-- AI 总结弹窗 -->
    <div
      v-if="showAiSummary"
      class="fixed inset-0 z-[100] flex items-center justify-center"
      @click.self="showAiSummary = false"
    >
      <div class="absolute inset-0 bg-black/30" />
      <div class="relative bg-white rounded-2xl shadow-xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col">
        <!-- 头部 -->
        <div class="flex items-center justify-between p-5 border-b border-gray-100">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-[#0a0a0a]">AI 文章总结</h3>
          </div>
          <button
            class="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            @click="showAiSummary = false"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <!-- 内容 -->
        <div class="flex-1 overflow-y-auto p-5">
          <div v-if="aiSummaryLoading" class="flex items-center justify-center py-12">
            <div class="flex items-center gap-2 text-sm text-gray-400">
              <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/>
              </svg>
              <span>AI 正在分析文章...</span>
            </div>
          </div>
          <div v-else class="prose prose-sm max-w-none" v-html="renderSummaryMarkdown(aiSummaryContent)"></div>
        </div>
        <!-- 底部 -->
        <div class="border-t border-gray-100 p-4 flex justify-end">
          <button
            class="px-4 h-9 text-sm font-medium text-white bg-[#0a0a0a] rounded-xl hover:opacity-90 transition-opacity"
            @click="showAiSummary = false"
          >关闭</button>
        </div>
      </div>
    </div>

    <!-- 加载 -->
    <div v-if="postsStore.loading" class="flex justify-center py-20">
      <div class="text-sm text-gray-300">加载中...</div>
    </div>

    <!-- 文章内容 -->
    <div v-else-if="post">
      <!-- 操作栏 -->
      <div class="flex items-center justify-between mb-6">
        <button
          class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0a0a0a] transition-colors"
          @click="goBack"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5m7 7l-7-7 7-7"/>
          </svg>
          返回
        </button>
        <div class="flex items-center gap-2">
          <button
            class="px-3 h-8 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            @click="goToEdit"
          >
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/>
            </svg>
            编辑
          </button>
          <button
            class="px-3 h-8 text-sm text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
            :disabled="aiSummaryLoading"
            @click="handleAiSummary"
          >
            <svg class="w-3.5 h-3.5 inline mr-1" :class="{ 'animate-spin': aiSummaryLoading }" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path v-if="!aiSummaryLoading" stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/>
            </svg>
            {{ aiSummaryLoading ? '总结中...' : 'AI 总结' }}
          </button>
          <button
            class="px-3 h-8 text-sm text-red-500 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            @click="handleDelete"
          >
            <svg class="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            删除
          </button>
        </div>
      </div>

      <!-- 文章头部 -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-[#0a0a0a] leading-tight mb-3">{{ post.title }}</h1>
        <div class="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          <div v-if="post.categories?.length" class="flex flex-wrap gap-1.5">
            <CategoryTag v-for="cat in post.categories" :key="cat.id" :category="cat" />
          </div>
          <span>{{ formatDate(post.created_at) }}</span>
          <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span>{{ post.word_count }} 字</span>
        </div>
      </div>

      <!-- 文章正文 -->
      <div class="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <div class="prose" v-html="renderMarkdown(post.content)"></div>
      </div>
    </div>

    <!-- 404 -->
    <div v-else class="flex flex-col items-center justify-center py-20 text-gray-300">
      <span class="text-5xl mb-4">😥</span>
      <p class="text-sm mb-4">文章不存在或已被删除</p>
      <button class="text-sm text-gray-500 hover:text-[#0a0a0a]" @click="goBack">返回首页</button>
    </div>
  </div>
</template>
