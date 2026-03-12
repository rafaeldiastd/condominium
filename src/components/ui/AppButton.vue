<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="app-btn"
    :class="[sizeClass, variantClass, full ? 'w-full' : '']"
    v-bind="$attrs"
  >
    <AppSpinner v-if="loading" :size="spinnerSize" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import AppSpinner from './AppSpinner.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  full?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  type: 'button',
  full: false,
})

const sizeClass = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}[props.size]

const spinnerSize = {
  sm: 'xs',
  md: 'sm',
  lg: 'sm',
}[props.size] as 'xs' | 'sm' | 'md'

const variantClass = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  warning:   'btn-warning',
  success:   'btn-success',
  ghost:     'btn-ghost',
  outline:   'btn-outline',
}[props.variant]
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: inherit;
  font-weight: 600;
  letter-spacing: -0.01em;
  border: none;
  cursor: pointer;
  transition:
    background-color var(--transition),
    box-shadow var(--transition),
    transform var(--transition),
    opacity var(--transition);
  user-select: none;
  white-space: nowrap;
  outline: none;
}

.app-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.app-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.app-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Tamanhos */
.btn-sm {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  border-radius: var(--radius-md);
}
.btn-md {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  border-radius: var(--radius-lg);
}
.btn-lg {
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
  border-radius: var(--radius-xl);
}

/* Variantes */
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: #f1f5f9;
  color: var(--color-text-primary);
}
.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-danger {
  background: var(--color-danger);
  color: #fff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}
.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
}

.btn-warning {
  background: var(--color-warning);
  color: #fff;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}
.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-success {
  background: var(--color-success);
  color: #fff;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}
.btn-success:hover:not(:disabled) {
  background: #16a34a;
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
.btn-ghost:hover:not(:disabled) {
  background: #f1f5f9;
  color: var(--color-text-primary);
}

.btn-outline {
  background: transparent;
  color: var(--color-text-primary);
  box-shadow: inset 0 0 0 1.5px var(--color-border);
}
.btn-outline:hover:not(:disabled) {
  background: #f8fafc;
  box-shadow: inset 0 0 0 1.5px #cbd5e1;
}

.w-full {
  width: 100%;
}
</style>
