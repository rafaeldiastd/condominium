<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-10 opacity-0 sm:translate-y-0 sm:translate-x-10"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="uiStore.toast"
      class="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] max-w-sm"
    >
      <div
        class="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md"
        :class="containerClasses"
      >
        <component
          :is="icon"
          class="w-5 h-5 flex-shrink-0"
          :class="iconClasses"
        />
        <p class="text-sm font-medium">{{ uiStore.toast.message }}</p>
        <button
          @click="uiStore.clearToast"
          class="ml-auto p-1 rounded-lg hover:bg-black/5 transition-colors"
        >
          <PhX class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import {
  PhCheckCircle,
  PhXCircle,
  PhInfo,
  PhX
} from '@phosphor-icons/vue'

const uiStore = useUIStore()

const containerClasses = computed(() => {
  const type = uiStore.toast?.type
  switch (type) {
    case 'success':
      return 'bg-emerald-50/90 border-emerald-100 text-emerald-900'
    case 'error':
      return 'bg-red-50/90 border-red-100 text-red-900'
    case 'info':
    default:
      return 'bg-blue-50/90 border-blue-100 text-blue-900'
  }
})

const iconClasses = computed(() => {
  const type = uiStore.toast?.type
  switch (type) {
    case 'success':
      return 'text-emerald-600'
    case 'error':
      return 'text-red-600'
    case 'info':
    default:
      return 'text-blue-600'
  }
})

const icon = computed(() => {
  const type = uiStore.toast?.type
  switch (type) {
    case 'success':
      return PhCheckCircle
    case 'error':
      return PhXCircle
    case 'info':
    default:
      return PhInfo
  }
})
</script>
