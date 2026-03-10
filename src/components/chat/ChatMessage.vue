<template>
  <div class="flex gap-2 mb-1" :class="isOwn ? 'flex-row-reverse' : 'flex-row'">
    <!-- Avatar (only for other person, first in group) -->
    <div v-if="!isOwn && showAvatar" class="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 overflow-hidden mt-1">
      <img v-if="message.sender?.avatar_url" :src="message.sender.avatar_url + '?width=56'" class="w-full h-full object-cover" alt="" />
      <span v-else class="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
        {{ message.sender?.full_name?.charAt(0) ?? '?' }}
      </span>
    </div>
    <div v-else-if="!isOwn" class="w-7 flex-shrink-0" />

    <!-- Bubble -->
    <div
      class="max-w-[75%] px-3 py-2 rounded-2xl text-sm"
      :class="isOwn
        ? 'bg-blue-600 text-white rounded-br-sm'
        : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'"
    >
      <p class="leading-relaxed whitespace-pre-wrap break-words">{{ message.content }}</p>
      <div class="flex items-center justify-end gap-1 mt-0.5">
        <span class="text-[10px]" :class="isOwn ? 'text-blue-200' : 'text-gray-400'">
          {{ formatTime(message.created_at) }}
        </span>
        <span v-if="isOwn" class="text-[10px]" :class="message.is_read ? 'text-blue-200' : 'text-blue-300'">
          {{ message.is_read ? '✓✓' : '✓' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { Message } from '@/types/app.types'

const props = defineProps<{
  message: Message
  showAvatar?: boolean
}>()

const authStore = useAuthStore()
const isOwn = computed(() => props.message.sender_id === authStore.user?.id)

function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
}
</script>
