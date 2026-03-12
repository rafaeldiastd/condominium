<template>
  <div class="app-input-root">
    <!-- Label -->
    <label v-if="label" :for="inputId" class="app-input-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>

    <!-- Input wrapper -->
    <div class="app-input-wrapper" :class="{ 'has-icon': $slots.icon || prefix, 'is-error': error, 'is-focused': focused }">
      <span v-if="prefix" class="app-input-prefix">{{ prefix }}</span>
      <span v-if="$slots.icon" class="app-input-icon">
        <slot name="icon" />
      </span>

      <input
        :id="inputId"
        v-bind="$attrs"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :disabled="disabled"
        class="app-input"
        :class="{ 'has-left-slot': prefix || $slots.icon }"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
      />
    </div>

    <!-- Footer -->
    <div v-if="error || hint || (showCount && maxlength)" class="app-input-footer">
      <p v-if="error" class="input-error">{{ error }}</p>
      <p v-else-if="hint" class="input-hint">{{ hint }}</p>
      <span v-else />
      <p v-if="showCount && maxlength" class="input-count">
        {{ String(modelValue ?? '').length }}/{{ maxlength }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue?: string | number | null
  label?: string
  placeholder?: string
  type?: string
  error?: string
  hint?: string
  prefix?: string
  maxlength?: number
  showCount?: boolean
  required?: boolean
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  showCount: false,
  required: false,
  disabled: false,
})

defineOptions({ inheritAttrs: false })

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const focused = ref(false)
const inputId = computed(() => props.id ?? `input-${Math.random().toString(36).slice(2, 7)}`)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<style scoped>
.app-input-root {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.app-input-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.required-star {
  color: var(--color-danger);
  margin-left: 2px;
}

.app-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  background: #fff;
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
  overflow: hidden;
}

.app-input-wrapper.is-focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-ring);
}

.app-input-wrapper.is-error {
  border-color: var(--color-danger);
}

.app-input-wrapper.is-error.is-focused {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.app-input-prefix,
.app-input-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.app-input {
  width: 100%;
  padding: 0.7rem 1rem;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  outline: none;
  transition: background var(--transition);
}

.app-input::placeholder {
  color: var(--color-text-muted);
}

.app-input:disabled {
  background: #f8fafc;
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.app-input.has-left-slot {
  padding-left: 2.5rem;
}

.app-input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 1rem;
}

.input-error {
  font-size: 0.75rem;
  color: var(--color-danger);
  font-weight: 500;
}

.input-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.input-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
</style>
