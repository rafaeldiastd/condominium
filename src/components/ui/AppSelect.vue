<template>
  <div class="flex flex-col gap-1.5">
    <!-- Label -->
    <label v-if="label" :for="selectId" class="text-sm font-medium text-gray-700 leading-none">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <!-- Select wrapper -->
    <div class="relative">
      <select
        :id="selectId"
        v-bind="$attrs"
        :value="modelValue"
        :disabled="disabled"
        class="w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-sm text-gray-900
               transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
               disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        :class="error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'"
        @change="onChange"
      >
        <option v-if="placeholder" value="" :selected="!modelValue">{{ placeholder }}</option>
        <slot>
          <option
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </option>
        </slot>
      </select>
      <!-- Chevron icon -->
      <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </span>
    </div>

    <!-- Error / hint -->
    <p v-if="error" class="text-xs text-red-600 leading-none">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-gray-400 leading-none">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface SelectOption {
  value: string
  label: string
}

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  options?: SelectOption[]
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  required: false,
  disabled: false,
})

defineOptions({ inheritAttrs: false })

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectId = computed(() => props.id ?? `select-${Math.random().toString(36).slice(2, 7)}`)

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>
