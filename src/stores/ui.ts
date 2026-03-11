import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  message: string
  type: ToastType
  id: number
}

export const useUIStore = defineStore('ui', () => {
  const toast = ref<Toast | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null

  function showToast(message: string, type: ToastType = 'success', duration = 3000) {
    if (timer) clearTimeout(timer)
    
    toast.value = {
      message,
      type,
      id: Date.now()
    }

    timer = setTimeout(() => {
      toast.value = null
      timer = null
    }, duration)
  }

  function clearToast() {
    toast.value = null
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return {
    toast,
    showToast,
    clearToast
  }
})
