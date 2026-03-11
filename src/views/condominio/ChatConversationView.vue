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

      <!-- Actions menu -->
      <div class="ml-auto flex items-center gap-1">
        <!-- Block user (only for ad owner, on real conversations) -->
        <button
          v-if="isOwnAd && !conversationId.startsWith('new_') && otherParticipant"
          @click="handleBlockUser"
          :disabled="blockingUser"
          class="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
          title="Bloquear usuário"
        >
          <PhProhibit class="w-5 h-5" />
        </button>

        <!-- Delete conversation -->
        <button
          v-if="!conversationId.startsWith('new_')"
          @click="handleDeleteChat"
          class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
          title="Apagar Conversa"
        >
          <PhTrash class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Announcement Summary Card -->
    <div v-if="conversation?.announcement" class="bg-white border-b border-gray-100 p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0" @click="goToAnnouncement">
      <div class="w-12 h-12 rounded bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
        <img v-if="conversation.announcement.images?.[0]?.url" :src="conversation.announcement.images[0].url + '?width=100'" class="w-full h-full object-cover">
        <PhPackage v-else class="w-6 h-6 text-gray-400" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">{{ conversation.announcement.title }}</p>
        <p class="text-sm font-bold text-blue-600">{{ formatPrice(conversation.announcement.price, conversation.announcement.price_negotiable) }}</p>
      </div>
      <!-- Paused badge in ad card -->
      <span
        v-if="isAdPaused"
        class="flex-shrink-0 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-wider"
      >
        Pausado
      </span>
      <PhCaretRight v-else class="w-5 h-5 text-gray-400 flex-shrink-0" />
    </div>

    <!-- Paused Banner (shown to non-owner) -->
    <div
      v-if="isAdPaused && !isOwnAd"
      class="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center gap-2 flex-shrink-0"
    >
      <PhPause class="w-4 h-4 text-amber-600 flex-shrink-0" />
      <p class="text-xs text-amber-700 font-medium">
        Este anúncio está pausado. Você não pode enviar novas mensagens no momento.
      </p>
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

    <!-- Input: disabled for non-owner when ad is paused -->
    <ChatInput
      @send="handleSend"
      :disabled="isAdPaused && !isOwnAd"
      :placeholder="isAdPaused && !isOwnAd ? 'Anúncio pausado — mensagens desativadas' : undefined"
    />
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
import { formatPrice } from '@/utils/formatters'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import { PhTrash, PhPackage, PhCaretRight, PhProhibit, PhPause } from '@phosphor-icons/vue'
import type { Message, Conversation } from '@/types/app.types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const condominiumStore = useCondominiumStore()
const { fetchMessages, sendMessage, markAsRead, subscribeToConversation, deleteConversation, blockUser, loadingMessages, hasMoreMessages } = useChat()

const slug = computed(() => condominiumStore.current?.slug ?? '')

function handleBack() {
  router.push(`/${slug.value}/chat`)
}

function goToAnnouncement() {
  if (conversation.value?.announcement?.id) {
    router.push(`/${slug.value}/announcements/${conversation.value.announcement.id}`)
  }
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

async function handleBlockUser() {
  if (!otherParticipant.value) return
  const name = otherParticipant.value.full_name ?? 'este usuário'
  if (!confirm(`Bloquear ${name}?\n\nEle não poderá mais entrar em contato via nenhum anúncio seu.`)) return

  blockingUser.value = true
  try {
    const ok = await blockUser(otherParticipant.value.id)
    if (ok) {
      // Also soft-delete this conversation from the owner's view
      await deleteConversation(conversationId.value)
      handleBack()
    } else {
      alert('Não foi possível bloquear o usuário. Tente novamente.')
    }
  } finally {
    blockingUser.value = false
  }
}

const conversationId = computed(() => route.params.conversationId as string)
const messages = ref<Message[]>([])
const conversation = ref<Conversation | null>(null)
const messagesContainer = ref<HTMLDivElement>()
const isOtherTyping = ref(false)
const currentPage = ref(1)
const blockingUser = ref(false)

let typingTimeout: ReturnType<typeof setTimeout>

const otherParticipant = computed(() => {
  if (!conversation.value || !authStore.user) return null
  return conversation.value.participant_a === authStore.user.id
    ? (conversation.value as any).participant_b_profile
    : (conversation.value as any).participant_a_profile
})

/** True if the current user is the ad owner (participant_b is the ad author in most flows, but we cross-check via announcement author_id) */
const isOwnAd = computed(() => {
  const ann = conversation.value?.announcement
  if (!ann || !authStore.user) return false
  return (ann as any).author_id === authStore.user.id
})

/** True when the linked announcement is paused (status = 'closed') */
const isAdPaused = computed(() => {
  return (conversation.value?.announcement as any)?.status === 'closed'
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
  // Guard: non-owner cannot send when ad is paused
  if (isAdPaused.value && !isOwnAd.value) return

  const msg = await sendMessage(conversationId.value, content)
  if (msg) {
    // If we transition from a pseudo-id (new_...) to a real UUID
    if (conversationId.value !== msg.conversation_id) {
      // Update URL without full reload
      window.history.replaceState({}, '', `/${slug.value}/chat/${msg.conversation_id}`)
      
      // We also update the local conversation object ID to avoid "new_..." logic re-triggering erroneously elsewhere if needed
      if (conversation.value) {
        conversation.value.id = msg.conversation_id
      }
      
      // Important to listen to real ID now
      setupRealtimeSubscription(msg.conversation_id)
    }

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
  if (channel) {
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
}

onMounted(async () => {
  if (conversationId.value.startsWith('new_')) {
    const [, annId, authorId] = conversationId.value.split('_')
    // Build mocked conversation object
    let annData = null;
    if (annId && annId !== 'null') {
      const { data } = await supabase.from('announcements').select('id, title, price, price_negotiable, status, author_id, images:announcement_images(url)').eq('id', annId).single()
      annData = data
    }
    
    const { data: profileData } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', authorId).single()
    
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
  // Helper function to validate UUID
  function isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  }

  // Load conversation details
  if (!isValidUUID(conversationId.value)) {
     console.warn('Invalid UUID for conversation ID:', conversationId.value);
     return;
  }

  const { data } = await supabase
    .from('conversations')
    .select(`
      *,
      announcement:announcements(id, title, price, price_negotiable, status, author_id, images:announcement_images(url)),
      participant_a_profile:profiles!conversations_participant_a_fkey(id, full_name, avatar_url),
      participant_b_profile:profiles!conversations_participant_b_fkey(id, full_name, avatar_url)
    `)
    .eq('id', conversationId.value)
    .single()

  if (data) {
    conversation.value = data as Conversation
    
    // Check if we need to reset soft-delete flag
    const isA = data.participant_a === authStore.user?.id
    const isDeleted = isA ? data.deleted_by_a : data.deleted_by_b
    if (isDeleted) {
       await supabase.from('conversations').update(isA ? { deleted_by_a: false } : { deleted_by_b: false }).eq('id', data.id)
       // Update local ref too
       if (isA) conversation.value.deleted_by_a = false
       else conversation.value.deleted_by_b = false
    }
  }

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
