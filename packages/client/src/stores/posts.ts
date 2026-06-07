import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Post } from '@/types'
import { getPosts, getPost, createPost, updatePost, deletePost } from '@/api/posts'

export const usePostsStore = defineStore('posts', () => {
  // state
  const posts = ref<Post[]>([])
  const currentPost = ref<Post | null>(null)
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)
  const filters = ref<{ categoryId?: number; keyword?: string }>({})

  // 获取博客列表
  async function fetchPosts() {
    loading.value = true
    try {
      const res = await getPosts({
        page: page.value,
        pageSize: pageSize.value,
        categoryId: filters.value.categoryId,
        keyword: filters.value.keyword
      })
      posts.value = res.data.list
      total.value = res.data.total
    } catch (error) {
      console.error('获取博客列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取博客详情
  async function fetchPost(id: number) {
    loading.value = true
    try {
      const res = await getPost(id)
      currentPost.value = res.data
      return res.data
    } catch (error) {
      console.error('获取博客详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建博客（支持多分类）
  async function addPost(data: { title: string; content: string; categoryIds?: number[] }) {
    try {
      const res = await createPost(data)
      return res.data
    } catch (error) {
      console.error('创建博客失败:', error)
      throw error
    }
  }

  // 更新博客（支持多分类）
  async function editPost(
    id: number,
    data: { title?: string; content?: string; categoryIds?: number[] }
  ) {
    try {
      const res = await updatePost(id, data)
      return res.data
    } catch (error) {
      console.error('更新博客失败:', error)
      throw error
    }
  }

  // 删除博客
  async function removePost(id: number) {
    try {
      await deletePost(id)
    } catch (error) {
      console.error('删除博客失败:', error)
      throw error
    }
  }

  // 设置筛选条件
  function setFilter(filter: { categoryId?: number; keyword?: string }) {
    filters.value = { ...filters.value, ...filter }
    page.value = 1 // 重置页码
  }

  // 设置页码
  function setPage(p: number) {
    page.value = p
  }

  return {
    posts,
    currentPost,
    total,
    page,
    pageSize,
    loading,
    filters,
    fetchPosts,
    fetchPost,
    addPost,
    editPost,
    removePost,
    setFilter,
    setPage
  }
})
