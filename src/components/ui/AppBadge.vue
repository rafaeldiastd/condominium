<template>
  <span class="app-badge" :class="[sizeClass, variantClass]">
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

const sizeClass = {
  sm: 'badge-sm',
  md: 'badge-md',
}[props.size]

const variantClass = {
  green:  'badge-green',
  amber:  'badge-amber',
  blue:   'badge-blue',
  red:    'badge-red',
  gray:   'badge-gray',
  indigo: 'badge-indigo',
  purple: 'badge-purple',
}[props.variant]
</script>

<style scoped>
.app-badge {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.badge-sm {
  padding: 2px 8px;
  font-size: 10px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-md {
  padding: 3px 10px;
  font-size: 0.75rem;
  border-radius: var(--radius-md);
}

.badge-green  { background: #dcfce7; color: #16a34a; }
.badge-amber  { background: #fef3c7; color: #b45309; }
.badge-blue   { background: #dbeafe; color: #1d4ed8; }
.badge-red    { background: #fee2e2; color: #dc2626; }
.badge-gray   { background: #f1f5f9; color: #475569; }
.badge-indigo { background: #e0e7ff; color: #4338ca; }
.badge-purple { background: #f3e8ff; color: #7e22ce; }
</style>
