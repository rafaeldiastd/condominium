<template>
  <div class="app-select-root">
    <label v-if="label" :for="selectId" class="app-select-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>

    <div class="app-select-wrapper" :class="{ 'is-error': error, 'is-focused': focused }">
      <select
        :id="selectId"
        v-bind="$attrs"
        :value="modelValue"
        :disabled="disabled"
        class="app-select"
        @change="onChange"
        @focus="focused = true"
        @blur="focused = false"
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
      <span class="select-chevron">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </span>
    </div>

    <p v-if="error" class="select-error">{{ error }}</p>
    <p v-else-if="hint" class="select-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface SelectOption {
  value: string
  label: string
}

interface Props {
  modelValue?: string | null
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

const focused = ref(false)
const selectId = computed(() => props.id ?? `select-${Math.random().toString(36).slice(2, 7)}`)

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<style scoped>
.app-select-root {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.app-select-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.required-star {
  color: var(--color-danger);
  margin-left: 2px;
}

.app-select-wrapper {
  position: relative;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  background: #fff;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.app-select-wrapper.is-focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-ring);
}

.app-select-wrapper.is-error {
  border-color: var(--color-danger);
}

.app-select {
  width: 100%;
  appearance: none;
  padding: 0.7rem 2.5rem 0.7rem 1rem;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  outline: none;
  cursor: pointer;
}

.app-select:disabled {
  background: #f8fafc;
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.select-chevron {
  pointer-events: none;
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
}

.select-chevron svg {
  width: 16px;
  height: 16px;
}

.select-error {
  font-size: 0.75rem;
  color: var(--color-danger);
  font-weight: 500;
}

.select-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
