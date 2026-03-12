<template>
  <div class="flex flex-col gap-1.5">
    <!-- Label -->
    <label v-if="label" class="text-sm font-medium text-gray-700 leading-none">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Default slot (any input element) -->
    <slot />

    <!-- Error / hint -->
    <p v-if="error" class="text-xs text-red-600 leading-none">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-gray-400 leading-none">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

withDefaults(defineProps<Props>(), {
  required: false,
})
</script>
