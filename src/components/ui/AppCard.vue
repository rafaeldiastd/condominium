<template>
  <div class="app-card" :class="[paddingClass, shadowClass, roundedClass, hoverable ? 'hoverable' : '']" v-bind="$attrs">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md'
  rounded?: 'lg' | 'xl' | '2xl'
  hoverable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  shadow: 'sm',
  rounded: '2xl',
  hoverable: false,
})

const paddingClass = {
  none: 'p-none',
  sm:   'p-sm',
  md:   'p-md',
  lg:   'p-lg',
}[props.padding]

const shadowClass = {
  none: 'shadow-none',
  sm:   'shadow-sm',
  md:   'shadow-md',
}[props.shadow]

const roundedClass = {
  lg:   'rounded-lg',
  xl:   'rounded-xl',
  '2xl': 'rounded-2xl',
}[props.rounded]
</script>

<style scoped>
.app-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  transition: box-shadow var(--transition), transform var(--transition);
}

/* Padding */
.p-none { padding: 0; }
.p-sm   { padding: 0.75rem; }
.p-md   { padding: 1rem; }
.p-lg   { padding: 1.5rem; }

/* Shadow */
.shadow-none { box-shadow: none; border-color: var(--color-border); }
.shadow-sm   { box-shadow: var(--shadow-sm); }
.shadow-md   { box-shadow: var(--shadow-md); }

/* Radius */
.rounded-lg  { border-radius: var(--radius-lg); }
.rounded-xl  { border-radius: var(--radius-xl); }
.rounded-2xl { border-radius: var(--radius-2xl); }

/* Hover */
.hoverable:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
</style>
