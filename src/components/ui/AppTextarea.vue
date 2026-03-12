<template>
  <div class="app-textarea-root">
    <label v-if="label" :for="textareaId" class="app-textarea-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>

    <div class="app-textarea-wrapper" :class="{ 'is-error': error, 'is-focused': focused }">
      <textarea
        :id="textareaId"
        v-bind="$attrs"
        :value="modelValue"
        :placeholder="placeholder"
        :rows="rows"
        :maxlength="maxlength"
        :disabled="disabled"
        class="app-textarea"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
      />
    </div>

    <div v-if="error || hint || (showCount && maxlength)" class="app-textarea-footer">
      <p v-if="error" class="textarea-error">{{ error }}</p>
      <p v-else-if="hint" class="textarea-hint">{{ hint }}</p>
      <span v-else />
      <p v-if="showCount && maxlength" class="textarea-count">
        {{ String(modelValue ?? '').length }}/{{ maxlength }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue?: string | null
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

const focused = ref(false)
const textareaId = computed(() => props.id ?? `textarea-${Math.random().toString(36).slice(2, 7)}`)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<style scoped>
.app-textarea-root {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.app-textarea-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.required-star {
  color: var(--color-danger);
  margin-left: 2px;
}

.app-textarea-wrapper {
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--color-border);
  background: #fff;
  overflow: hidden;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.app-textarea-wrapper.is-focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-ring);
}

.app-textarea-wrapper.is-error {
  border-color: var(--color-danger);
}

.app-textarea-wrapper.is-error.is-focused {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.app-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  outline: none;
  resize: none;
  display: block;
}

.app-textarea::placeholder {
  color: var(--color-text-muted);
}

.app-textarea:disabled {
  background: #f8fafc;
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.app-textarea-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 1rem;
}

.textarea-error {
  font-size: 0.75rem;
  color: var(--color-danger);
  font-weight: 500;
}

.textarea-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.textarea-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
</style>
