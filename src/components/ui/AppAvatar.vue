<template>
  <div
    class="rounded-full overflow-hidden bg-blue-100 flex items-center justify-center shrink-0 select-none"
    :class="sizeClasses"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name"
      class="w-full h-full object-cover"
      @error="onError"
    />
    <span
      v-else
      class="font-bold text-blue-700 leading-none uppercase"
      :class="initialSizeClasses"
    >
      {{ initial }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  src?: string
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const imgError = ref(false)

const initial = computed(() => props.name?.trim().charAt(0) ?? '?')

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}[props.size]

const initialSizeClasses = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
}[props.size]

function onError() {
  imgError.value = true
}

const src = computed(() => (imgError.value ? undefined : props.src))
</script>
