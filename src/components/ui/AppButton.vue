<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none"
    :class="[sizeClasses, variantClasses, full ? 'w-full' : '']"
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

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-2xl',
}[props.size]

const spinnerSize = {
  sm: 'xs',
  md: 'sm',
  lg: 'sm',
}[props.size] as 'xs' | 'sm' | 'md'

const variantClasses = {
  primary:   'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
  warning:   'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 focus-visible:ring-amber-400',
  success:   'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400',
  outline:   'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400',
}[props.variant]
</script>
