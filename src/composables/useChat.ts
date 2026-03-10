import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useCondominiumStore } from '@/stores/condominium'
import { MESSAGES_PAGE_SIZE } from '@/utils/constants'
import type { Conversation, Message, Profile } from '@/types/app.types'

export function useChat() {
  const authStore = useAuthStore()
  const chatStore = useChatStore()
  const condominiumStore = useCondominiumStore()
  const router = useRouter()
  const loadingMessages = ref(false)
  const loadingConversations = ref(false)
  const hasMoreMessages = ref(true)

  async function fetchConversations(): Promise<void> {
    if (!authStore.user) return
    loadingConversations.value = true

    try {
      const userId = authStore.user.id

      // Query 1: conversations with profiles and announcement
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          announcement:announcements(id, title, images:announcement_images(id, url, is_cover)),
          participant_a_profile:profiles!conversations_participant_a_fkey(id, full_name, avatar_url),
          participant_b_profile:profiles!conversations_participant_b_fkey(id, full_name, avatar_url)
        `)
        .or(`and(participant_a.eq.${userId},deleted_by_a.eq.false),and(participant_b.eq.${userId},deleted_by_b.eq.false)`)
        .order('last_message_at', { ascending: false })

      if (!data || data.length === 0) {
        chatStore.conversations = []
        return
      }

      const convIds = data.map(c => c.id)

      // Query 2: latest messages for all conversations at once (ordered DESC, group in JS)
      const { data: allMsgs } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at, sender_id, is_read')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
        .limit(convIds.length * 10)

      // Map: latest message per conversation_id
      const lastMsgByConv: Record<string, typeof allMsgs extends (infer T)[] | null ? T : never> = {}
      for (const msg of allMsgs ?? []) {
        if (!lastMsgByConv[msg.conversation_id]) {
          lastMsgByConv[msg.conversation_id] = msg
        }
      }

      // Query 3: all unread messages for current user across all conversations
      const { data: unreadMsgs } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('is_read', false)
        .neq('sender_id', userId)

      // Count unread per conversation_id
      const unreadByConv: Record<string, number> = {}
      for (const msg of unreadMsgs ?? []) {
        unreadByConv[msg.conversation_id] = (unreadByConv[msg.conversation_id] ?? 0) + 1
      }

      // Assemble enriched conversations
      const enriched = data.map((conv) => {
        const otherProfile = conv.participant_a === userId
          ? conv.participant_b_profile
          : conv.participant_a_profile

        return {
          ...conv,
          other_participant: otherProfile as Profile,
          last_message: lastMsgByConv[conv.id] ?? undefined,
          unread_count: unreadByConv[conv.id] ?? 0,
        } as Conversation
      })

      chatStore.conversations = enriched
    } finally {
      loadingConversations.value = false
    }
  }

  async function fetchMessages(conversationId: string, page = 1): Promise<Message[]> {
    loadingMessages.value = true
    try {
      const from = (page - 1) * MESSAGES_PAGE_SIZE
      const to = from + MESSAGES_PAGE_SIZE - 1

      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (!data) return []

      hasMoreMessages.value = data.length === MESSAGES_PAGE_SIZE

      // Return in chronological order
      return data.reverse() as Message[]
    } finally {
      loadingMessages.value = false
    }
  }

  async function sendMessage(conversationId: string, content: string): Promise<Message | null> {
    if (!authStore.user || !content.trim()) return null

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: authStore.user.id,
        content: content.trim(),
      })
      .select(`*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)`)
      .single()

    if (error) return null
    return data as Message
  }

  async function markAsRead(conversationId: string): Promise<void> {
    if (!authStore.user) return
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', authStore.user.id)
      .eq('is_read', false)
  }

  async function deleteConversation(conversationId: string): Promise<boolean> {
    if (!authStore.user) return false

    // Precisamos achar de que lado o usuario está (participant_a ou participant_b)
    const conv = chatStore.conversations.find(c => c.id === conversationId)
    if (!conv) return false

    const isA = conv.participant_a === authStore.user.id
    const payload = isA ? { deleted_by_a: true } : { deleted_by_b: true }

    const { error } = await supabase
      .from('conversations')
      .update(payload)
      .eq('id', conversationId)

    if (error) return false

    // Removes from local store
    chatStore.conversations = chatStore.conversations.filter(c => c.id !== conversationId)
    return true
  }

  async function startConversation(announcementId: string, authorId: string): Promise<string | null> {
    if (!authStore.user) return null

    // Prevent self-conversation
    if (authStore.user.id === authorId) return null

    const slug = condominiumStore.current?.slug
    if (!slug) return null

    // Check for existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('announcement_id', announcementId)
      .or(
        `and(participant_a.eq.${authStore.user.id},participant_b.eq.${authorId}),` +
        `and(participant_a.eq.${authorId},participant_b.eq.${authStore.user.id})`
      )
      .single()

    if (existing) {
      await router.push(`/${slug}/chat/${existing.id}`)
      return existing.id
    }

    // Não cria a conversa vazia no banco ainda.
    // Redireciona para a view de conversa passando os IDs necessários na URL para criação posterior.
    const newChatPseudoId = `new_${announcementId}_${authorId}`
    await router.push(`/${slug}/chat/${newChatPseudoId}`)
    return newChatPseudoId
  }

  function subscribeToConversation(conversationId: string, onNewMessage: (msg: Message) => void) {
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Enrich with sender profile
          const { data: msg } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()
          if (msg) onNewMessage(msg as Message)
        }
      )
      .subscribe()

    chatStore.addChannel(channel)
    return channel
  }


  function typingBroadcast(conversationId: string, isTyping: boolean) {
    supabase
      .channel(`conv:${conversationId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: authStore.user?.id, isTyping },
      })
      .then()
  }

  return {
    loadingMessages,
    loadingConversations,
    hasMoreMessages,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    startConversation,
    subscribeToConversation,
    typingBroadcast,
    deleteConversation,
  }
}
