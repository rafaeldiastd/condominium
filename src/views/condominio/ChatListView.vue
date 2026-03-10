<template>
  <div>
    <div class="sticky top-14 z-20 bg-white border-b border-gray-100 px-4 py-3">
      <h1 class="text-lg font-bold text-gray-900">Mensagens</h1>
    </div>

    <ChatConversationList
      :conversations="chatStore.conversations"
      :loading="loading"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useChat } from '@/composables/useChat'
import { useChatStore } from '@/stores/chat'
import ChatConversationList from '@/components/chat/ChatConversationList.vue'

const chatStore = useChatStore()
const { fetchConversations, deleteConversation } = useChat()
const loading = ref(true)

async function handleDelete(id: string) {
  loading.value = true
  try {
    const success = await deleteConversation(id)
    if (!success) {
      alert('Não foi possível excluir a conversa. Tente novamente.')
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (chatStore.conversations.length === 0) {
    loading.value = true
  }
  try {
    await fetchConversations()
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  chatStore.unsubscribeAll()
})
</script>
