<template>
  <div class="flex items-center gap-3">
    <!-- Toggle button -->
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="label"
      :disabled="disabled"
      class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors
             focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed"
      :class="modelValue ? 'bg-blue-600' : 'bg-gray-200'"
      @click="toggle"
    >
      <span
        class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
        :class="modelValue ? 'translate-x-6' : 'translate-x-1'"
        aria-hidden="true"
      />
    </button>

    <!-- Label + description -->
    <div v-if="label || description" class="flex flex-col gap-0.5">
      <span v-if="label" class="text-sm font-medium text-gray-700 leading-none select-none">{{ label }}</span>
      <span v-if="description" class="text-xs text-gray-500 leading-none select-none">{{ description }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  description?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>
