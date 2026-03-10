<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <component :is="icon" v-if="icon" class="w-16 h-16 text-gray-400 mb-4" />
    <h3 class="text-base font-semibold text-gray-900 mb-1">{{ title }}</h3>
    <p class="text-sm text-gray-500 mb-4 max-w-xs">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  title: string
  description?: string
}>()
</script>
