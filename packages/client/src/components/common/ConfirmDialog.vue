<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:show': [value: boolean]
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:show', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:show', false)
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-[100] flex items-center justify-center"
    @click.self="handleCancel"
  >
    <!-- 遮罩 -->
    <div class="absolute inset-0 bg-black/30" />
    <!-- 弹窗 -->
    <div class="relative bg-white rounded-2xl shadow-xl p-6 w-[360px] max-w-[90vw]">
      <div class="flex items-start gap-3 mb-4">
        <!-- 图标 -->
        <div
          class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          :class="danger ? 'bg-red-50' : 'bg-gray-50'"
        >
          <svg
            v-if="danger"
            class="w-5 h-5 text-red-500"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
          <svg
            v-else
            class="w-5 h-5 text-gray-500"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-[#0a0a0a]">{{ title }}</h3>
          <p class="text-sm text-gray-500 mt-1 leading-relaxed">{{ message }}</p>
        </div>
      </div>
      <div class="flex items-center justify-end gap-2.5">
        <button
          class="px-4 h-9 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          @click="handleCancel"
        >{{ cancelText || '取消' }}</button>
        <button
          class="px-4 h-9 text-sm font-medium text-white rounded-xl transition-opacity hover:opacity-90"
          :class="danger ? 'bg-red-500' : 'bg-[#0a0a0a]'"
          @click="handleConfirm"
        >{{ confirmText || '确定' }}</button>
      </div>
    </div>
  </div>
</template>
