<template>
  <div class="app-toggle-row">
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="label"
      :disabled="disabled"
      class="app-toggle"
      :class="{ 'is-on': modelValue }"
      @click="toggle"
    >
      <span class="toggle-thumb" />
    </button>

    <div v-if="label || description" class="toggle-text">
      <span v-if="label" class="toggle-label">{{ label }}</span>
      <span v-if="description" class="toggle-description">{{ description }}</span>
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

<style scoped>
.app-toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: #e2e8f0;
  border: none;
  cursor: pointer;
  transition: background var(--transition), box-shadow var(--transition);
  padding: 0;
  outline: none;
}

.app-toggle:focus-visible {
  box-shadow: 0 0 0 3px var(--color-primary-ring);
}

.app-toggle.is-on {
  background: var(--color-primary);
}

.app-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-thumb {
  position: absolute;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: var(--radius-full);
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  transition: transform var(--transition);
  will-change: transform;
}

.is-on .toggle-thumb {
  transform: translateX(20px);
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  user-select: none;
}

.toggle-description {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  user-select: none;
}
</style>
