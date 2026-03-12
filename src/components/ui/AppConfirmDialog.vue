<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="modal-backdrop"
        @click.self="onCancel"
      >
        <div class="modal-box">
          <!-- Icon + Title -->
          <div class="modal-body">
            <div v-if="iconType" class="modal-icon" :class="iconBgClass">
              <PhTrash v-if="iconType === 'danger'" class="icon" :class="iconColorClass" />
              <PhWarning v-else-if="iconType === 'warning'" class="icon" :class="iconColorClass" />
              <PhInfo v-else class="icon" :class="iconColorClass" />
            </div>
            <h3 class="modal-title">{{ title }}</h3>
            <p v-if="description" class="modal-description">{{ description }}</p>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button class="btn-cancel" @click="onCancel">
              {{ cancelLabel }}
            </button>
            <button
              class="btn-confirm"
              :class="confirmClass"
              :disabled="loading"
              @click="onConfirm"
            >
              <span v-if="loading" class="loading-inner">
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
  danger:  'icon-bg-danger',
  warning: 'icon-bg-warning',
  info:    'icon-bg-info',
}[props.variant]))

const iconColorClass = computed(() => ({
  danger:  'icon-color-danger',
  warning: 'icon-color-warning',
  info:    'icon-color-info',
}[props.variant]))

const confirmClass = computed(() => ({
  danger:  'btn-confirm-danger',
  warning: 'btn-confirm-warning',
  info:    'btn-confirm-info',
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
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(6px);
}

@media (min-width: 640px) {
  .modal-backdrop {
    align-items: center;
  }
}

.modal-box {
  width: 100%;
  max-width: 22rem;
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-body {
  padding: 1.75rem 1.5rem 1.25rem;
}

.modal-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.icon-bg-danger  { background: #fee2e2; }
.icon-bg-warning { background: #fef3c7; }
.icon-bg-info    { background: #dbeafe; }

.icon { width: 24px; height: 24px; }
.icon-color-danger  { color: #dc2626; }
.icon-color-warning { color: #d97706; }
.icon-color-info    { color: #2563eb; }

.modal-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-align: center;
  line-height: 1.3;
}

.modal-description {
  margin-top: 6px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.55;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--color-border-subtle);
}

.btn-cancel,
.btn-confirm {
  padding: 1rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background var(--transition);
  outline: none;
}

.btn-cancel {
  background: transparent;
  color: var(--color-text-secondary);
  border-right: 1px solid var(--color-border-subtle);
  border-radius: 0 0 0 var(--radius-2xl);
}

.btn-cancel:hover {
  background: #f8fafc;
}

.btn-confirm {
  background: transparent;
  border-radius: 0 0 var(--radius-2xl) 0;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-confirm-danger  { color: #dc2626; }
.btn-confirm-warning { color: #d97706; }
.btn-confirm-info    { color: #2563eb; }

.btn-confirm-danger:hover:not(:disabled)  { background: #fff5f5; }
.btn-confirm-warning:hover:not(:disabled) { background: #fffbeb; }
.btn-confirm-info:hover:not(:disabled)    { background: #eff6ff; }

.loading-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* Animação */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 220ms ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition: transform 220ms cubic-bezier(.34,1.56,.64,1);
}
.modal-enter-from .modal-box,
.modal-leave-to .modal-box {
  transform: translateY(20px) scale(0.96);
}
</style>
