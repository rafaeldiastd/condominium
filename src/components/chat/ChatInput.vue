<template>
  <div class="border-t border-gray-100 bg-white px-3 py-2 flex items-end gap-2" :class="{ 'opacity-75': disabled }">
    <textarea
      ref="inputRef"
      v-model="text"
      :placeholder="placeholder ?? 'Escreva uma mensagem...'"
      :disabled="disabled"
      rows="1"
      class="flex-1 px-4 py-2.5 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 transition disabled:cursor-not-allowed"
      @keydown="handleKeydown"
      @input="autoResize"
    />
    <button
      @click="handleSend"
      :disabled="!text.trim() || sending || disabled"
      class="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition"
      :class="text.trim() && !disabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'"
    >
      <svg class="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = withDefaults(defineProps<{ disabled?: boolean; placeholder?: string }>(), {
  disabled: false,
  placeholder: undefined,
})

const emit = defineEmits<{ send: [content: string] }>()

const text = ref('')
const sending = ref(false)
const inputRef = ref<HTMLTextAreaElement>()

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function autoResize() {
  nextTick(() => {
    const el = inputRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 128) + 'px'
  })
}

async function handleSend() {
  const content = text.value.trim()
  if (!content || sending.value) return
  sending.value = true
  text.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
  emit('send', content)
  sending.value = false
}

function setSending(val: boolean) { sending.value = val }
function focus() { inputRef.value?.focus() }
defineExpose({ setSending, focus })
</script>
