<template>
  <div :class="[paddingClasses, shadowClasses, roundedClasses, 'bg-white']" v-bind="$attrs">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md'
  rounded?: 'lg' | 'xl' | '2xl'
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md',
  shadow: 'sm',
  rounded: '2xl',
})

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
}[props.padding]

const shadowClasses = {
  none: 'border border-gray-100',
  sm:   'border border-gray-100 shadow-sm',
  md:   'border border-gray-100 shadow-md',
}[props.shadow]

const roundedClasses = {
  lg:   'rounded-lg',
  xl:   'rounded-xl',
  '2xl': 'rounded-2xl',
}[props.rounded]
</script>
