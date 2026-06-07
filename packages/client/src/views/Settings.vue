<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { AIModel, AIModelForm } from '@/types'
import { getModels, createModel, updateModel, deleteModel, testModelConnection } from '@/api/ai-models'
import { reindexAll as reindexAllApi } from '@/api/search'
import { useToast } from '@/composables/useToast'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const toast = useToast()

// ===== AI 模型管理 =====
const models = ref<AIModel[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingModel = ref<AIModel | null>(null)
const formData = ref<AIModelForm>({
  provider: 'openai',
  name: '',
  modelId: '',
  apiKey: '',
  baseUrl: '',
  isDefault: false
})
const testingId = ref<number | null>(null)
const reindexing = ref(false)

// 确认弹窗状态
const showDeleteConfirm = ref(false)
const deleteTarget = ref<AIModel | null>(null)
const showReindexConfirm = ref(false)

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', defaultUrl: 'https://api.openai.com/v1', supportsEmbedding: true },
  { value: 'zhipu', label: '智谱AI', defaultUrl: 'https://open.bigmodel.cn/api/paas/v4', supportsEmbedding: true },
  { value: 'qwen', label: '通义千问', defaultUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', supportsEmbedding: true },
  { value: 'deepseek', label: 'DeepSeek', defaultUrl: 'https://api.deepseek.com', supportsEmbedding: false }
]

function getProviderInfo(providerValue: string) {
  return PROVIDERS.find(p => p.value === providerValue)
}

// 当前表单选择的厂商是否支持 Embedding
const selectedProviderSupportsEmbedding = computed(() => {
  return getProviderInfo(formData.value.provider)?.supportsEmbedding ?? true
})

onMounted(() => {
  fetchModels()
})

async function fetchModels() {
  loading.value = true
  try {
    const res = await getModels()
    models.value = res.data
  } catch (err) {
    toast.show('加载模型列表失败', 'error')
  } finally {
    loading.value = false
  }
}

function openCreateForm() {
  editingModel.value = null
  formData.value = {
    provider: 'openai',
    name: '',
    modelId: '',
    apiKey: '',
    baseUrl: '',
    isDefault: false
  }
  showForm.value = true
}

function openEditForm(model: AIModel) {
  editingModel.value = model
  formData.value = {
    provider: model.provider,
    name: model.name,
    modelId: model.model_id,
    apiKey: model.api_key || '',
    baseUrl: model.base_url || '',
    isDefault: model.is_default === 1
  }
  showForm.value = true
}

function onProviderChange() {
  // 自动填充默认 baseUrl
  const provider = PROVIDERS.find(p => p.value === formData.value.provider)
  if (provider && !editingModel.value) {
    formData.value.baseUrl = provider.defaultUrl
  }
}

async function handleSubmit() {
  if (!formData.value.name.trim() || !formData.value.modelId.trim() || !formData.value.apiKey.trim()) {
    toast.show('请填写所有必填项', 'warning')
    return
  }

  try {
    if (editingModel.value) {
      const res = await updateModel(editingModel.value.id, {
        name: formData.value.name,
        modelId: formData.value.modelId,
        apiKey: formData.value.apiKey,
        baseUrl: formData.value.baseUrl || undefined,
        isDefault: formData.value.isDefault,
      })
      // 更新本地列表
      const idx = models.value.findIndex(m => m.id === editingModel.value!.id)
      if (idx !== -1) models.value[idx] = res.data
      toast.show('更新成功', 'success')
    } else {
      const res = await createModel({
        provider: formData.value.provider,
        name: formData.value.name,
        modelId: formData.value.modelId,
        apiKey: formData.value.apiKey,
        baseUrl: formData.value.baseUrl || undefined,
        isDefault: formData.value.isDefault,
      })
      models.value.push(res.data)
      toast.show('创建成功', 'success')
    }
    showForm.value = false
  } catch (err) {
    toast.show('操作失败', 'error')
  }
}

async function handleDelete(model: AIModel) {
  deleteTarget.value = model
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  const model = deleteTarget.value
  showDeleteConfirm.value = false
  deleteTarget.value = null
  try {
    await deleteModel(model.id)
    models.value = models.value.filter(m => m.id !== model.id)
    toast.show('删除成功', 'success')
  } catch (err) {
    toast.show('删除失败', 'error')
  }
}

async function handleTest(model: AIModel) {
  testingId.value = model.id
  try {
    const res = await testModelConnection(model.id)
    if (res.data.success) {
      toast.show('连接成功: ' + res.data.message.slice(0, 100), 'success')
    } else {
      toast.show('连接失败: ' + res.data.message, 'error')
    }
  } catch (err) {
    toast.show('测试请求失败', 'error')
  } finally {
    testingId.value = null
  }
}

async function handleSetDefault(model: AIModel) {
  try {
    await updateModel(model.id, { isDefault: true })
    // 刷新列表
    await fetchModels()
    toast.show(`已设为默认模型`, 'success')
  } catch (err) {
    toast.show('设置失败', 'error')
  }
}

async function handleReindex() {
  showReindexConfirm.value = true
}

async function confirmReindex() {
  showReindexConfirm.value = false
  reindexing.value = true
  try {
    const res = await reindexAllApi()
    const d = res.data
    // 显示真实结果
    if (d.vectorized > 0) {
      toast.show(`✅ 向量索引完成: ${d.vectorized} 篇已向量化${d.chunked > 0 ? `，${d.chunked} 篇仅分块` : ''}${d.failed > 0 ? `，${d.failed} 篇失败` : ''}`, 'success')
    } else if (d.chunked > 0) {
      // 有分块但无向量
      const reason = d.tip || (d.errors.length > 0 ? d.errors[0] : '未生成向量')
      toast.show(`⚠️ 仅完成分块，未生成向量: ${reason}`, 'warning')
    } else if (d.failed > 0) {
      toast.show(`❌ 重建失败: ${d.errors.join('; ')}`, 'error')
    } else {
      toast.show('重建完成，但无文章需要处理', 'info')
    }
  } catch (err: any) {
    toast.show(err.message || '重建失败', 'error')
  } finally {
    reindexing.value = false
  }
}
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-[#0a0a0a]">系统设置</h1>
      <p class="text-sm text-gray-400 mt-1">管理系统配置、AI 模型和数据迁移</p>
    </div>

    <div class="grid gap-4">
      <!-- ===== AI 模型管理 ===== -->
      <div class="bg-white rounded-2xl border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-sm font-semibold text-[#0a0a0a]">🤖 AI 模型管理</h2>
            <p class="text-sm text-gray-500 mt-0.5">配置和管理 AI 大模型 API，支持 OpenAI、智谱AI、通义千问、DeepSeek 等。</p>
          </div>
          <button
            class="px-4 h-8 bg-[#0a0a0a] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            @click="openCreateForm"
          >
            + 添加模型
          </button>
        </div>

        <!-- 模型列表 -->
        <div v-if="loading" class="text-sm text-gray-400 py-4">加载中...</div>
        <div v-else-if="models.length === 0" class="text-sm text-gray-300 py-4">
          暂无配置，点击上方按钮添加第一个 AI 模型
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="model in models"
            :key="model.id"
            class="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
            :class="{ 'border-l-2 border-l-[#0a0a0a]': model.is_default }"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-medium text-[#0a0a0a]">{{ model.name }}</span>
                <span v-if="model.is_default" class="text-[10px] bg-[#0a0a0a] text-white px-1.5 py-0.5 rounded">默认</span>
                <span v-if="model.supportsEmbedding === false" class="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">无 Embedding</span>
                <span :class="model.is_enabled ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'"
                  class="text-[10px] px-1.5 py-0.5 rounded">
                  {{ model.is_enabled ? '已启用' : '已禁用' }}
                </span>
              </div>
              <div class="text-xs text-gray-400 flex items-center gap-3">
                <span>{{ model.provider }}</span>
                <span>{{ model.model_id }}</span>
                <span class="text-gray-300 truncate max-w-[200px]">{{ model.base_url }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 ml-4 shrink-0">
              <button
                v-if="!model.is_default"
                class="px-3 h-7 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                @click="handleSetDefault(model)"
              >
                设为默认
              </button>
              <button
                class="px-3 h-7 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                :disabled="testingId === model.id"
                @click="handleTest(model)"
              >
                {{ testingId === model.id ? '测试中...' : '测试' }}
              </button>
              <button
                class="px-3 h-7 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                @click="openEditForm(model)"
              >
                编辑
              </button>
              <button
                class="px-3 h-7 text-xs text-red-400 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                @click="handleDelete(model)"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 索引管理 -->
        <div class="mt-6 pt-5 border-t border-gray-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-[#0a0a0a]">🔄 向量索引管理</h3>
              <p class="text-xs text-gray-400 mt-0.5">对已有文章重新分块并生成向量嵌入，用于语义搜索</p>
            </div>
            <button
              class="px-4 h-8 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              :disabled="reindexing"
              @click="handleReindex"
            >
              {{ reindexing ? '重建中...' : '重建索引' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ===== 数据管理（占位） ===== -->
      <div class="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 class="text-sm font-semibold text-[#0a0a0a] mb-1">📦 数据管理</h2>
        <p class="text-sm text-gray-500 mb-4">导出或导入博客数据，支持 JSON 格式，保障数据安全可迁移。</p>
        <p class="text-xs text-gray-300">将在后续阶段实现</p>
      </div>
    </div>

    <!-- ===== 添加/编辑模型弹窗 ===== -->
    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20" @click.self="showForm = false">
        <div class="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-xl">
          <h3 class="text-sm font-semibold text-[#0a0a0a] mb-5">
            {{ editingModel ? '编辑模型' : '添加 AI 模型' }}
          </h3>

          <div class="space-y-4">
            <!-- 厂商选择（仅在新建时可选） -->
            <div>
              <label class="text-xs text-gray-500 mb-1.5 block">厂商 *</label>
              <select
                v-model="formData.provider"
                :disabled="!!editingModel"
                class="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none focus:border-gray-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                @change="onProviderChange"
              >
                <option v-for="p in PROVIDERS" :key="p.value" :value="p.value">{{ p.label }}</option>
              </select>
            </div>

            <!-- 名称 -->
            <div>
              <label class="text-xs text-gray-500 mb-1.5 block">名称 *</label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="例如: GPT-4o"
                class="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none focus:border-gray-400"
              />
            </div>

            <!-- 模型 ID -->
            <div>
              <label class="text-xs text-gray-500 mb-1.5 block">模型 ID *</label>
              <input
                v-model="formData.modelId"
                type="text"
                placeholder="例如: gpt-4o, glm-4-flash, deepseek-chat"
                class="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none focus:border-gray-400"
              />
            </div>

            <!-- API Key -->
            <div>
              <label class="text-xs text-gray-500 mb-1.5 block">API Key *</label>
              <input
                v-model="formData.apiKey"
                type="password"
                placeholder="sk-..."
                class="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none focus:border-gray-400"
              />
              <!-- Embedding 不可用提示 -->
              <p v-if="!selectedProviderSupportsEmbedding" class="mt-2 text-xs text-amber-600">
                ⚠️ {{ getProviderInfo(formData.provider)?.label }} 不支持向量嵌入（Embedding），
                添加此模型后仍需配置一个支持 Embedding 的模型（如 OpenAI、智谱AI、通义千问）
                才能使用智能语义搜索。
              </p>
            </div>

            <!-- Base URL -->
            <div>
              <label class="text-xs text-gray-500 mb-1.5 block">API 地址（可选）</label>
              <input
                v-model="formData.baseUrl"
                type="text"
                placeholder="留空使用厂商默认地址"
                class="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none focus:border-gray-400"
              />
            </div>

            <!-- 设为默认 -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="formData.isDefault"
                type="checkbox"
                class="w-4 h-4 accent-[#0a0a0a]"
              />
              <span class="text-sm text-gray-600">设为默认模型（用于语义搜索和 AI 问答）</span>
            </label>
          </div>

          <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              class="px-4 h-8 text-sm text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
              @click="showForm = false"
            >
              取消
            </button>
            <button
              class="px-5 h-8 bg-[#0a0a0a] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              @click="handleSubmit"
            >
              {{ editingModel ? '保存' : '添加' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 确认删除模型弹窗 -->
    <ConfirmDialog
      v-model:show="showDeleteConfirm"
      title="删除模型"
      :message="`确定要删除模型「${deleteTarget?.name || ''}」吗？`"
      confirm-text="删除"
      :danger="true"
      @confirm="confirmDelete"
    />

    <!-- 确认重建索引弹窗 -->
    <ConfirmDialog
      v-model:show="showReindexConfirm"
      title="重建向量索引"
      message="确定全量重建向量索引吗？这会对所有文章重新分块并生成向量嵌入，用于语义搜索。"
      confirm-text="重建"
      @confirm="confirmReindex"
    />
  </div>
</template>
