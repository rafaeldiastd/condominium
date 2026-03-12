<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="onCancel"
      >
        <div class="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          <!-- Icon + Title -->
          <div class="px-6 pt-6 pb-4">
            <div
              v-if="iconType"
              class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              :class="iconBgClass"
            >
              <PhTrash v-if="iconType === 'danger'" class="w-6 h-6" :class="iconColorClass" />
              <PhWarning v-else-if="iconType === 'warning'" class="w-6 h-6" :class="iconColorClass" />
              <PhInfo v-else class="w-6 h-6" :class="iconColorClass" />
            </div>

            <h3 class="text-lg font-bold text-gray-900 text-center leading-tight">{{ title }}</h3>
            <p v-if="description" class="mt-2 text-sm text-gray-500 text-center leading-relaxed">{{ description }}</p>
          </div>

          <!-- Actions -->
          <div class="flex border-t border-gray-100">
            <button
              class="flex-1 py-4 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              @click="onCancel"
            >
              {{ cancelLabel }}
            </button>
            <div class="w-px bg-gray-100" />
            <button
              class="flex-1 py-4 text-sm font-bold transition"
              :class="confirmColorClass"
              :disabled="loading"
              @click="onConfirm"
            >
              <span v-if="loading" class="flex items-center justify-center gap-1.5">
                <AppSpinner size="xs" /> Aguarde...
              </span>
              <span v-else>{{ confirmLabel }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhTrash, PhWarning, PhInfo } from '@phosphor-icons/vue'
import AppSpinner from './AppSpinner.vue'

interface Props {
  visible: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  iconType?: 'danger' | 'warning' | 'info' | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'danger',
  iconType: 'danger',
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:visible': [value: boolean]
}>()

const iconBgClass = computed(() => ({
  danger:  'bg-red-100',
  warning: 'bg-amber-100',
  info:    'bg-blue-100',
}[props.variant]))

const iconColorClass = computed(() => ({
  danger:  'text-red-600',
  warning: 'text-amber-600',
  info:    'text-blue-600',
}[props.variant]))

const confirmColorClass = computed(() => ({
  danger:  'text-red-600 hover:bg-red-50',
  warning: 'text-amber-600 hover:bg-amber-50',
  info:    'text-blue-600 hover:bg-blue-50',
}[props.variant]))

function onConfirm() {
  if (!props.loading) emit('confirm')
}

function onCancel() {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 200ms ease;
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(24px);
}
</style>
