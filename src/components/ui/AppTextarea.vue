<template>
  <div class="flex flex-col gap-1.5">
    <!-- Label -->
    <label v-if="label" :for="textareaId" class="text-sm font-medium text-gray-700 leading-none">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Textarea -->
    <textarea
      :id="textareaId"
      v-bind="$attrs"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      :maxlength="maxlength"
      :disabled="disabled"
      class="w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400
             transition-shadow resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
             disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
      :class="error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'"
      @input="onInput"
    />

    <!-- Footer -->
    <div v-if="error || hint || (showCount && maxlength)" class="flex items-center justify-between gap-2 min-h-[1rem]">
      <p v-if="error" class="text-xs text-red-600 leading-none">{{ error }}</p>
      <p v-else-if="hint" class="text-xs text-gray-400 leading-none">{{ hint }}</p>
      <span v-else />
      <p v-if="showCount && maxlength" class="text-xs text-gray-400 leading-none shrink-0">
        {{ String(modelValue ?? '').length }}/{{ maxlength }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  rows?: number
  error?: string
  hint?: string
  maxlength?: number
  showCount?: boolean
  required?: boolean
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  rows: 4,
  showCount: false,
  required: false,
  disabled: false,
})

defineOptions({ inheritAttrs: false })

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaId = computed(() => props.id ?? `textarea-${Math.random().toString(36).slice(2, 7)}`)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>
