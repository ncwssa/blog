<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import type { Conversation, Message, Citation } from '@/types'
import {
  getConversations,
  createConversation,
  deleteConversation,
  getMessages,
  chatStreamAsync,
} from '@/api/ai'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const toast = useToast()

// ===== 状态 =====
const conversations = ref<Conversation[]>([])
const currentConversationId = ref<number | null>(null)
const messages = ref<Message[]>([])
const inputText = ref('')
const isStreaming = ref(false)
const loadingConversations = ref(false)
const loadingMessages = ref(false)
const streamingContent = ref('')
const streamingCitations = ref<Citation[]>([])
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<number | null>(null)
const hasError = ref(false)

const messagesContainer = ref<HTMLElement | null>(null)

// ===== 对话管理 =====
async function loadConversations() {
  loadingConversations.value = true
  try {
    const res = await getConversations()
    conversations.value = res.data
  } catch (err: any) {
    console.error('加载对话列表失败:', err)
  } finally {
    loadingConversations.value = false
  }
}

async function handleCreateConversation() {
  try {
    const res = await createConversation()
    conversations.value.unshift(res.data)
    await switchConversation(res.data.id)
  } catch (err: any) {
    toast.error('创建对话失败')
  }
}

function handleDeleteClick(id: number) {
  deleteTargetId.value = id
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTargetId.value === null) return
  try {
    await deleteConversation(deleteTargetId.value)
    conversations.value = conversations.value.filter((c) => c.id !== deleteTargetId.value)
    if (currentConversationId.value === deleteTargetId.value) {
      currentConversationId.value = null
      messages.value = []
    }
  } catch (err: any) {
    toast.error('删除对话失败')
  }
  deleteTargetId.value = null
}

async function switchConversation(id: number) {
  if (isStreaming.value) return
  currentConversationId.value = id
  await loadMessages(id)
}

async function loadMessages(conversationId: number) {
  loadingMessages.value = true
  hasError.value = false
  try {
    const res = await getMessages(conversationId)
    messages.value = res.data
    await scrollToBottom()
  } catch (err: any) {
    hasError.value = true
    toast.error('加载消息失败')
  } finally {
    loadingMessages.value = false
  }
}

// ===== 流式聊天 =====
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return

  // 如果没有对话，先创建
  if (!currentConversationId.value) {
    try {
      const res = await createConversation()
      conversations.value.unshift(res.data)
      currentConversationId.value = res.data.id
    } catch {
      toast.error('创建对话失败')
      return
    }
  }

  const conversationId = currentConversationId.value!
  inputText.value = ''

  // 添加用户消息到本地
  const userMsg: Message = {
    id: Date.now(),
    conversation_id: conversationId,
    role: 'user',
    content: text,
    citations: [],
    tokens_used: 0,
    created_at: new Date().toISOString(),
  }
  messages.value.push(userMsg)

  // 准备流式接收
  isStreaming.value = true
  streamingContent.value = ''
  streamingCitations.value = []
  await scrollToBottom()

  try {
    for await (const data of chatStreamAsync(conversationId, text)) {
      if (data.error) {
        toast.error(data.error)
        break
      }

      if (data.content) {
        streamingContent.value += data.content
        await scrollToBottom()
      }

      if (data.done) {
        if (data.citations) {
          streamingCitations.value = data.citations
        }

        // 添加助手消息到本地
        const assistantMsg: Message = {
          id: Date.now() + 1,
          conversation_id: conversationId,
          role: 'assistant',
          content: streamingContent.value,
          citations: data.citations || [],
          tokens_used: data.tokensUsed || 0,
          created_at: new Date().toISOString(),
        }
        messages.value.push(assistantMsg)
        streamingContent.value = ''

        // 刷新对话列表（标题可能已更新）
        await loadConversations()
        break
      }
    }
  } catch (err: any) {
    toast.error(err.message || '对话失败')
  } finally {
    isStreaming.value = false
    await scrollToBottom()
  }
}

// ===== Markdown 渲染 =====
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
  html = html.replace(/(<\/([uo]l|h[1-3]|pre|hr)>)(<\/p>)?/g, '</$2>')
  return html
}

// ===== 工具函数 =====
async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// ===== 生命周期 =====
onMounted(() => {
  loadConversations()
})

// 输入框自动聚焦
watch(currentConversationId, () => {
  setTimeout(() => {
    const input = document.querySelector('.chat-input') as HTMLTextAreaElement
    input?.focus()
  }, 100)
})
</script>

<template>
  <div class="flex h-[calc(100vh-140px)] -mx-6 -mb-6">
    <ConfirmDialog
      v-model:show="showDeleteConfirm"
      title="删除对话"
      message="确定要删除这个对话吗？此操作不可撤销。"
      confirm-text="删除"
      :danger="true"
      @confirm="confirmDelete"
    />

    <!-- 左侧对话列表 -->
    <div class="w-64 shrink-0 border-r border-gray-100 bg-white flex flex-col">
      <!-- 头部 -->
      <div class="p-4 border-b border-gray-100">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-[#0a0a0a]">对话列表</h2>
          <button
            class="w-7 h-7 rounded-lg bg-[#0a0a0a] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
            @click="handleCreateConversation"
            title="新建对话"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 列表 -->
      <div class="flex-1 overflow-y-auto sidebar-scroll">
        <div v-if="loadingConversations" class="p-4 text-center">
          <div class="text-sm text-gray-300">加载中...</div>
        </div>
        <div v-else-if="conversations.length === 0" class="p-4 text-center">
          <div class="text-sm text-gray-300">暂无对话</div>
        </div>
        <div v-else class="p-2 space-y-0.5">
          <div
            v-for="conv in conversations"
            :key="conv.id"
            class="group flex items-center gap-1 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
            :class="currentConversationId === conv.id ? 'bg-gray-100' : 'hover:bg-gray-50'"
            @click="switchConversation(conv.id)"
          >
            <svg class="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
            </svg>
            <span class="flex-1 text-sm truncate text-gray-600 group-hover:text-[#0a0a0a]">{{ conv.title }}</span>
            <button
              class="shrink-0 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
              @click.stop="handleDeleteClick(conv.id)"
            >
              <svg class="w-3.5 h-3.5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="flex-1 flex flex-col bg-white">
      <!-- 消息列表 -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto px-6 py-6 space-y-6"
      >
        <!-- 加载中 -->
        <div v-if="loadingMessages" class="flex justify-center py-20">
          <div class="text-sm text-gray-300">加载中...</div>
        </div>

        <!-- 错误 -->
        <div v-else-if="hasError" class="flex flex-col items-center justify-center py-20">
          <span class="text-4xl mb-3">😥</span>
          <p class="text-sm text-gray-400">加载消息失败</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="messages.length === 0 && !isStreaming" class="flex flex-col items-center justify-center py-20">
          <span class="text-5xl mb-4">🤖</span>
          <h3 class="text-base font-semibold text-[#0a0a0a] mb-2">向我提问关于你的知识库...</h3>
          <p class="text-sm text-gray-400 text-center max-w-md">基于 RAG 技术检索你的博客内容，AI 将为你提供精准的回答</p>
        </div>

        <!-- 消息气泡 -->
        <template v-for="msg in messages" :key="msg.id">
          <!-- 用户消息 -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="max-w-[70%] bg-[#0a0a0a] text-white rounded-2xl rounded-br-md px-4 py-3">
              <div class="text-sm leading-relaxed whitespace-pre-wrap">{{ msg.content }}</div>
            </div>
          </div>

          <!-- 助手消息 -->
          <div v-else class="flex justify-start">
            <div class="max-w-[75%]">
              <div class="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3">
                <div class="prose prose-sm max-w-none" v-html="renderMarkdown(msg.content)"></div>
              </div>
              <!-- 引用来源 -->
              <div v-if="msg.citations && msg.citations.length > 0" class="mt-2 flex flex-wrap gap-2 px-1">
                <a
                  v-for="(cite, idx) in msg.citations"
                  :key="idx"
                  :href="`/post/${cite.postId}`"
                  target="_blank"
                  class="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>
                  </svg>
                  来源: {{ cite.title }}
                </a>
              </div>
            </div>
          </div>
        </template>

        <!-- 流式输出中的助手消息 -->
        <div v-if="isStreaming" class="flex justify-start">
          <div class="max-w-[75%]">
            <div class="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3">
              <div class="prose prose-sm max-w-none" v-html="renderMarkdown(streamingContent)"></div>
              <div v-if="!streamingContent" class="flex items-center gap-1.5 py-2">
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
              </div>
            </div>
            <!-- 流式引用 -->
            <div v-if="streamingCitations.length > 0" class="mt-2 flex flex-wrap gap-2 px-1">
              <a
                v-for="(cite, idx) in streamingCitations"
                :key="idx"
                :href="`/post/${cite.postId}`"
                target="_blank"
                class="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/>
                </svg>
                来源: {{ cite.title }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="border-t border-gray-100 p-4">
        <div class="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            class="chat-input flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-gray-300 focus:bg-white transition-all min-h-[44px] max-h-[120px]"
            :placeholder="isStreaming ? 'AI 正在回复...' : '输入你的问题...'"
            :disabled="isStreaming"
            v-model="inputText"
            @keydown="handleKeydown"
            rows="1"
          ></textarea>
          <button
            class="shrink-0 h-11 w-11 rounded-xl bg-[#0a0a0a] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            :disabled="!inputText.trim() || isStreaming"
            @click="sendMessage"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose-sm {
  font-size: 0.875rem;
  line-height: 1.6;
}
.prose-sm :deep(p) {
  margin-bottom: 0.5rem;
}
.prose-sm :deep(p:last-child) {
  margin-bottom: 0;
}
.prose-sm :deep(code) {
  @apply px-1 py-0.5 bg-gray-100 rounded text-xs font-mono text-pink-600;
}
.prose-sm :deep(pre) {
  @apply bg-[#0a0a0a] text-gray-100 rounded-lg p-3 mb-2 overflow-x-auto text-xs;
}
.prose-sm :deep(pre code) {
  @apply bg-transparent text-gray-100 p-0;
}
.prose-sm :deep(a) {
  @apply text-blue-600 hover:text-blue-700 underline underline-offset-2;
}
.prose-sm :deep(ul), .prose-sm :deep(ol) {
  @apply pl-5 mb-2;
}
.prose-sm :deep(li) {
  @apply mb-0.5;
}
.prose-sm :deep(h1), .prose-sm :deep(h2), .prose-sm :deep(h3) {
  @apply font-semibold text-[#0a0a0a] mt-3 mb-1.5;
}
.prose-sm :deep(h1) { @apply text-base; }
.prose-sm :deep(h2) { @apply text-sm; }
.prose-sm :deep(h3) { @apply text-sm; }
.prose-sm :deep(strong) { @apply font-semibold text-[#0a0a0a]; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); }
  40% { transform: scale(1); }
}
.animate-bounce {
  animation: bounce 1.2s ease-in-out infinite;
}
</style>
