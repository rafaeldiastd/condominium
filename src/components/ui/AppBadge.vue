<template>
  <span
    class="inline-flex items-center font-medium"
    :class="[sizeClasses, variantClasses]"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'green' | 'amber' | 'blue' | 'red' | 'gray' | 'indigo' | 'purple'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'gray',
  size: 'md',
})

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px] rounded tracking-wide uppercase',
  md: 'px-2.5 py-1 text-xs rounded-lg',
}[props.size]

const variantClasses = {
  green:  'bg-emerald-100 text-emerald-700',
  amber:  'bg-amber-100 text-amber-700',
  blue:   'bg-blue-100 text-blue-700',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-gray-100 text-gray-600',
  indigo: 'bg-indigo-100 text-indigo-700',
  purple: 'bg-purple-100 text-purple-700',
}[props.variant]
</script>
