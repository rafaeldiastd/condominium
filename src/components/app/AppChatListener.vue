<template>
  <!-- Renderless component -->
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useChat } from '@/composables/useChat'
import type { RealtimeChannel } from '@supabase/supabase-js'

const authStore = useAuthStore()
const { fetchConversations } = useChat()

let channel: RealtimeChannel | null = null

async function setupSubscription() {
  cleanupSubscription()

  if (!authStore.user) return

  const userId = authStore.user.id

  // Fetch initial conversations to populate unread count
  await fetchConversations()

  channel = supabase
    .channel(`app-chat-listener:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE on conversations table
        schema: 'public',
        table: 'conversations',
        filter: `participant_a=eq.${userId}`,
      },
      () => {
        fetchConversations()
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*', 
        schema: 'public',
        table: 'conversations',
        filter: `participant_b=eq.${userId}`,
      },
      () => {
        fetchConversations()
      }
    )
    // We also need to listen for messages to update the unread count when a new message arrives
    // but the conversation itself wasn't updated (some edge cases or direct message inserts)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        // If the message is not from the current user, refresh the conversations
        // Wait conditionally, we could just re-fetch conversations to get the latest unread count
         fetchConversations()
      }
    )
    .on(
      'postgres_changes',
       {
        event: 'UPDATE', // Catch when messages are read
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
         fetchConversations()
      }
    )
    .subscribe()
}

function cleanupSubscription() {
  if (channel) {
    channel.unsubscribe()
    channel = null
  }
}

// Watch auth state to setup/cleanup
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    setupSubscription()
  } else {
    cleanupSubscription()
  }
}, { immediate: true })

onUnmounted(() => {
  cleanupSubscription()
})
</script>
