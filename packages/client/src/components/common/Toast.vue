<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

const typeStyles: Record<string, { bg: string; icon: string }> = {
  success: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: '✓' },
  error: { bg: 'bg-red-50 border-red-200 text-red-700', icon: '✕' },
  warning: { bg: 'bg-amber-50 border-amber-200 text-amber-700', icon: '!' },
  info: { bg: 'bg-gray-50 border-gray-200 text-gray-700', icon: 'i' },
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-sm text-sm font-medium max-w-sm animate-slide-in"
          :class="typeStyles[toast.type]?.bg || typeStyles.info.bg"
        >
          <span
            class="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
            :class="{
              'bg-emerald-500 text-white': toast.type === 'success',
              'bg-red-500 text-white': toast.type === 'error',
              'bg-amber-500 text-white': toast.type === 'warning',
              'bg-gray-500 text-white': toast.type === 'info',
            }"
          >{{ typeStyles[toast.type]?.icon }}</span>
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.25s ease;
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
