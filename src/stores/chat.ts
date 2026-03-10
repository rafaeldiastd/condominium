import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Conversation, Message } from '@/types/app.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const messages = ref<Message[]>([])
  const activeConversationId = ref<string | null>(null)
  const channels = ref<RealtimeChannel[]>([])

  const totalUnreadCount = computed(() =>
    conversations.value.reduce((sum, c) => sum + (c.unread_count ?? 0), 0),
  )

  function addChannel(channel: RealtimeChannel) {
    channels.value.push(channel)
  }

  function unsubscribeAll() {
    channels.value.forEach(c => c.unsubscribe())
    channels.value = []
  }

  return {
    conversations,
    messages,
    activeConversationId,
    channels,
    totalUnreadCount,
    addChannel,
    unsubscribeAll,
  }
})
