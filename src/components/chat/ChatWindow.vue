<template>
  <div class="flex flex-col h-full">
    <div ref="scrollRef" class="flex-1 overflow-y-auto p-3 space-y-2">
      <ChatMessage
        v-for="message in messages"
        :key="message.id"
        :message="message"
        :is-mine="message.sender_id === currentUserId"
      />
      <div v-if="!messages.length" class="text-center text-gray-400 text-sm py-8">
        Nenhuma mensagem ainda. Diga olá!
      </div>
    </div>
    <ChatInput @send="$emit('send', $event)" />
  </div>
</template>

<script setup lang="ts">
import type { Message } from '@/types/app.types'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'

defineProps<{
  messages: Message[]
  currentUserId: string
}>()
defineEmits<{ send: [content: string] }>()
</script>
