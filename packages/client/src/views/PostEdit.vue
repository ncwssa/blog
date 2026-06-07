<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostsStore } from '@/stores/posts'
import { useCategoriesStore } from '@/stores/categories'

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()
const categoriesStore = useCategoriesStore()

// 判断是新建还是编辑
const isEdit = computed(() => !!route.params.id)
const postId = computed(() => Number(route.params.id))

// 表单数据
const form = ref({
  title: '',
  content: '',
  categoryId: undefined as number | undefined
})

// 保存中状态
const saving = ref(false)

// 加载分类列表 + 编辑模式加载文章数据
onMounted(async () => {
  try {
    await categoriesStore.fetchCategories()

    if (isEdit.value) {
      const post = await postsStore.fetchPost(postId.value)
      if (post) {
        form.value.title = post.title
        form.value.content = post.content
        form.value.categoryId = post.category_id ?? undefined
      }
    }
  } catch (error) {
    alert('加载数据失败')
  }
})

// 保存文章
async function handleSave() {
  // 验证必填字段
  if (!form.value.title.trim()) {
    alert('请输入文章标题')
    return
  }
  if (!form.value.content.trim()) {
    alert('请输入文章内容')
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      // 更新
      await postsStore.editPost(postId.value, {
        title: form.value.title,
        content: form.value.content,
        categoryId: form.value.categoryId ?? null
      })
      alert('更新成功')
      router.push({ name: 'PostDetail', params: { id: postId.value } })
    } else {
      // 新建
      const newPost = await postsStore.addPost({
        title: form.value.title,
        content: form.value.content,
        categoryId: form.value.categoryId
      })
      alert('创建成功')
      router.push({ name: 'PostDetail', params: { id: newPost.id } })
    }
  } catch (error) {
    alert(isEdit.value ? '更新失败，请稍后重试' : '创建失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

// 取消
function handleCancel() {
  if (isEdit.value) {
    router.push({ name: 'PostDetail', params: { id: postId.value } })
  } else {
    router.push({ name: 'Home' })
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <!-- 页面标题 -->
    <h1 class="text-2xl font-bold text-gray-800 mb-6">
      {{ isEdit ? '编辑文章' : '新建文章' }}
    </h1>

    <!-- 表单 -->
    <div class="space-y-5">
      <!-- 标题输入 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">标题 <span class="text-red-500">*</span></label>
        <input
          v-model="form.title"
          type="text"
          placeholder="请输入文章标题"
          class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- 分类选择 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">分类</label>
        <select
          v-model="form.categoryId"
          class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option :value="undefined">未分类</option>
          <option
            v-for="cat in categoriesStore.categories"
            :key="cat.id"
            :value="cat.id"
          >
            {{ cat.name }}
          </option>
        </select>
      </div>

      <!-- 内容编辑区 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">内容 <span class="text-red-500">*</span></label>
        <textarea
          v-model="form.content"
          placeholder="请输入文章内容（支持 Markdown 格式）"
          rows="18"
          class="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono leading-relaxed"
        ></textarea>
      </div>

      <!-- 底部按钮 -->
      <div class="flex items-center gap-3 pt-2">
        <button
          class="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="saving"
          @click="handleSave"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <button
          class="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          :disabled="saving"
          @click="handleCancel"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>
