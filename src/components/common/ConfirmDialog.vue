<template>
  <div class="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
      <h3 class="text-lg font-bold text-gray-900">{{ title }}</h3>
      <p class="text-sm text-gray-500">{{ message }}</p>
      <div class="flex gap-3">
        <button
          @click="$emit('cancel')"
          class="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          {{ cancelText }}
        </button>
        <button
          @click="$emit('confirm')"
          :disabled="loading"
          class="flex-1 py-3 rounded-xl text-sm font-medium text-white transition disabled:opacity-50"
          :class="danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'"
        >
          {{ loading ? 'Aguarde...' : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
}>(), {
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  danger: false,
  loading: false,
})

defineEmits<{ confirm: []; cancel: [] }>()
</script>
