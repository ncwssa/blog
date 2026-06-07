<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useCategoriesStore } from '@/stores/categories'
import { useToast } from '@/composables/useToast'
import CategoryPicker from '@/components/common/CategoryPicker.vue'

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()
const categoriesStore = useCategoriesStore()

const isEdit = computed(() => !!route.params.id)
const postId = computed(() => Number(route.params.id))

const form = ref({
  title: '',
  content: '',
  categoryIds: [] as number[]
})

const toast = useToast()
const saving = ref(false)

onMounted(async () => {
  try {
    await categoriesStore.fetchCategories()
    if (isEdit.value) {
      const post = await postsStore.fetchPost(postId.value)
      if (post) {
        form.value.title = post.title
        form.value.content = post.content
        form.value.categoryIds = post.categories.map((c) => c.id)
      }
    }
  } catch {
    toast.error('加载数据失败')
  }
})

async function handleSave() {
  if (!form.value.title.trim()) { toast.warning('请输入文章标题'); return }
  if (!form.value.content.trim()) { toast.warning('请输入文章内容'); return }

  saving.value = true
  try {
    if (isEdit.value) {
      await postsStore.editPost(postId.value, {
        title: form.value.title,
        content: form.value.content,
        categoryIds: form.value.categoryIds
      })
      router.push({ name: 'PostDetail', params: { id: postId.value } })
    } else {
      const newPost = await postsStore.addPost({
        title: form.value.title,
        content: form.value.content,
        categoryIds: form.value.categoryIds
      })
      router.push({ name: 'PostDetail', params: { id: newPost.id } })
    }
  } catch {
    toast.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  if (isEdit.value) {
    router.push({ name: 'PostDetail', params: { id: postId.value } })
  } else {
    router.push({ name: 'Home' })
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- 标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-[#0a0a0a]">{{ isEdit ? '编辑文章' : '写文章' }}</h1>
      <p class="text-sm text-gray-400 mt-0.5">{{ isEdit ? '修改已有文章内容' : '创建一篇新的知识文章' }}</p>
    </div>

    <!-- 表单 -->
    <div class="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <!-- 标题 -->
      <div>
        <label class="block text-sm font-medium text-[#0a0a0a] mb-1.5">标题 <span class="text-red-400">*</span></label>
        <input
          v-model="form.title"
          type="text"
          placeholder="输入文章标题..."
          class="w-full px-4 h-10 text-sm bg-gray-50 border-0 rounded-xl outline-none focus:bg-gray-100 transition-colors placeholder:text-gray-300"
        />
      </div>

      <!-- 分类（多选 + 新建） -->
      <div>
        <label class="block text-sm font-medium text-[#0a0a0a] mb-1.5">分类</label>
        <CategoryPicker v-model="form.categoryIds" />
      </div>

      <!-- 内容 -->
      <div>
        <label class="block text-sm font-medium text-[#0a0a0a] mb-1.5">内容 <span class="text-red-400">*</span></label>
        <textarea
          v-model="form.content"
          placeholder="支持 Markdown 格式..."
          rows="18"
          class="w-full px-4 py-3 text-sm bg-gray-50 border-0 rounded-xl outline-none focus:bg-gray-100 transition-colors resize-y font-mono leading-relaxed placeholder:text-gray-300"
        ></textarea>
      </div>

      <!-- 按钮 -->
      <div class="flex items-center gap-3 pt-2">
        <button
          class="px-5 h-10 bg-[#0a0a0a] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="saving"
          @click="handleSave"
        >
          <svg v-if="saving" class="w-4 h-4 inline animate-spin mr-1.5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <button
          class="px-5 h-10 border border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          :disabled="saving"
          @click="handleCancel"
        >取消</button>
      </div>
    </div>
  </div>
</template>
