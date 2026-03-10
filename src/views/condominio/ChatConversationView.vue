<template>
  <div class="flex flex-col h-[calc(100vh-56px-64px)]">
    <!-- Header -->
    <div class="sticky top-14 z-20 bg-white border-b border-gray-100 flex items-center px-4 py-3 gap-3">
      <button @click="handleBack" class="text-gray-700">←</button>

      <!-- Other participant info -->
      <div class="w-9 h-9 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center flex-shrink-0">
        <img v-if="otherParticipant?.avatar_url" :src="otherParticipant.avatar_url + '?width=72'" class="w-full h-full object-cover" alt="" />
        <span v-else class="text-blue-700 font-bold text-sm">{{ otherParticipant?.full_name?.charAt(0) ?? '?' }}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900 text-sm truncate">{{ otherParticipant?.full_name ?? 'Conversa' }}</p>
        <p v-if="isOtherTyping" class="text-xs text-blue-600">digitando...</p>
      </div>

      <!-- Delete Action -->
      <button
        v-if="!conversationId.startsWith('new_')"
        @click="handleDeleteChat"
        class="ml-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
        title="Apagar Conversa"
      >
        🗑️
      </button>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 bg-gray-50">
      <!-- Load more -->
      <div v-if="hasMoreMessages" class="flex justify-center mb-3">
        <button
          @click="loadMoreMessages"
          :disabled="loadingMessages"
          class="text-xs text-blue-600 hover:underline disabled:opacity-50"
        >
          {{ loadingMessages ? 'Carregando...' : 'Carregar mensagens anteriores' }}
        </button>
      </div>

      <!-- Date separators + messages -->
      <template v-for="(group, date) in groupedMessages" :key="date">
        <div class="flex items-center gap-3 my-4">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span class="text-xs text-gray-400 px-2">{{ formatDateSeparator(date as string) }}</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>
        <ChatMessage
          v-for="(msg, i) in group"
          :key="msg.id"
          :message="msg"
          :show-avatar="i === 0 || group[i - 1]?.sender_id !== msg.sender_id"
        />
      </template>

      <!-- Typing indicator -->
      <div v-if="isOtherTyping" class="flex items-end gap-2 mt-1">
        <div class="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0"></div>
        <div class="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
          <span class="inline-flex gap-1">
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
          </span>
        </div>
      </div>
    </div>

    <!-- Input -->
    <ChatInput @send="handleSend" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChat } from '@/composables/useChat'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { useCondominiumStore } from '@/stores/condominium'
import { supabase } from '@/lib/supabase'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import type { Message, Conversation } from '@/types/app.types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const condominiumStore = useCondominiumStore()
const { fetchMessages, sendMessage, markAsRead, subscribeToConversation, deleteConversation, loadingMessages, hasMoreMessages } = useChat()

const slug = computed(() => condominiumStore.current?.slug ?? '')

function handleBack() {
  router.push(`/${slug.value}/chat`)
}

async function handleDeleteChat() {
  if (confirm('Tem certeza que deseja apagar esta conversa histórico?')) {
    const success = await deleteConversation(conversationId.value)
    if (success) {
      handleBack()
    } else {
      alert('Não foi possível excluir a conversa. Tente novamente.')
    }
  }
}

const conversationId = computed(() => route.params.conversationId as string)
const messages = ref<Message[]>([])
const conversation = ref<Conversation | null>(null)
const messagesContainer = ref<HTMLDivElement>()
const isOtherTyping = ref(false)
const currentPage = ref(1)

let typingTimeout: ReturnType<typeof setTimeout>

const otherParticipant = computed(() => {
  if (!conversation.value || !authStore.user) return null
  return conversation.value.participant_a === authStore.user.id
    ? (conversation.value as any).participant_b_profile
    : (conversation.value as any).participant_a_profile
})

// Group messages by date
const groupedMessages = computed(() => {
  const groups: Record<string, Message[]> = {}
  messages.value.forEach(msg => {
    const date = new Date(msg.created_at).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
  })
  return groups
})

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Hoje'
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

async function scrollToBottom(smooth = false) {
  await nextTick()
  const el = messagesContainer.value
  if (el) {
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }
}

async function loadMoreMessages() {
  currentPage.value++
  const older = await fetchMessages(conversationId.value, currentPage.value)
  messages.value = [...older, ...messages.value]
}

async function handleSend(content: string) {
  let activeId = conversationId.value

  // Create conversation lazily if it's a new one
  if (activeId.startsWith('new_')) {
    const [, annId, authorId] = activeId.split('_')
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        announcement_id: annId,
        participant_a: authStore.user?.id,
        participant_b: authorId,
      })
      .select('id')
      .single()

    if (!newConv) return
    activeId = newConv.id

    // Atualiza a URL sem recarregar e troca a ID local
    window.history.replaceState({}, '', `/${slug.value}/chat/${activeId}`)
    
    // Assinar eventos depois de criar o ID de fato
    setupRealtimeSubscription(activeId)
  }

  const msg = await sendMessage(activeId, content)
  if (msg) {
    if (!messages.value.find(m => m.id === msg.id)) {
      messages.value.push(msg)
    }
    await scrollToBottom(true)
  }
}

function setupRealtimeSubscription(activeId: string) {
  // Subscribe to realtime
  const channel = subscribeToConversation(activeId, (newMsg) => {
    // Avoid duplicates
    if (!messages.value.find(m => m.id === newMsg.id)) {
      messages.value.push(newMsg)
      scrollToBottom(true)
      if (newMsg.sender_id !== authStore.user?.id) {
        markAsRead(activeId)
      }
    }
  })

  // Subscribe to typing via broadcast
  channel.on('broadcast', { event: 'typing' }, (payload: { payload: { userId: string; isTyping: boolean } }) => {
    if (payload.payload.userId !== authStore.user?.id) {
      isOtherTyping.value = payload.payload.isTyping
      clearTimeout(typingTimeout)
      if (payload.payload.isTyping) {
        typingTimeout = setTimeout(() => { isOtherTyping.value = false }, 3000)
      }
    }
  })
}

onMounted(async () => {
  if (conversationId.value.startsWith('new_')) {
    const [, annId, authorId] = conversationId.value.split('_')
    // Build mocked conversation object
    const [{ data: annData }, { data: profileData }] = await Promise.all([
      supabase.from('announcements').select('id, title').eq('id', annId).single(),
      supabase.from('profiles').select('id, full_name, avatar_url').eq('id', authorId).single()
    ])
    
    conversation.value = {
      id: conversationId.value,
      announcement_id: annId,
      participant_a: authStore.user?.id || '',
      participant_b: authorId,
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      announcement: annData,
      participant_b_profile: profileData,
    } as any

    scrollToBottom()
    return
  }
  // Load conversation details
  const { data } = await supabase
    .from('conversations')
    .select(`
      *,
      announcement:announcements(id, title),
      participant_a_profile:profiles!conversations_participant_a_fkey(id, full_name, avatar_url),
      participant_b_profile:profiles!conversations_participant_b_fkey(id, full_name, avatar_url)
    `)
    .eq('id', conversationId.value)
    .single()

  if (data) conversation.value = data as Conversation

  // Load messages
  const msgs = await fetchMessages(conversationId.value, 1)
  messages.value = msgs
  await scrollToBottom()
  await markAsRead(conversationId.value)

  setupRealtimeSubscription(conversationId.value)
})

onUnmounted(() => {
  clearTimeout(typingTimeout)
  chatStore.unsubscribeAll()
})
</script>
