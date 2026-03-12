<template>
  <div>
    <div v-if="loading" class="divide-y divide-gray-50">
      <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-3 animate-pulse">
        <div class="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
        <div class="flex-1 space-y-1.5">
          <div class="h-3.5 bg-gray-200 rounded w-2/3"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <div v-else-if="conversations.length" class="divide-y divide-gray-50">
      <RouterLink
        v-for="conv in conversations"
        :key="conv.id"
        :to="`/${slug}/chat/${conv.id}`"
        class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition group"
      >
        <!-- Avatar -->
        <div class="relative flex-shrink-0">
          <div class="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
            <img v-if="conv.other_participant?.avatar_url" :src="conv.other_participant.avatar_url + '?width=96'" class="w-full h-full object-cover" alt="" />
            <span v-else class="text-blue-700 font-bold">{{ conv.other_participant?.full_name?.charAt(0) ?? '?' }}</span>
          </div>
          <span v-if="(conv.unread_count ?? 0) > 0" class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {{ (conv.unread_count ?? 0) > 9 ? '9+' : conv.unread_count }}
          </span>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="font-medium text-gray-900 text-sm truncate">{{ conv.other_participant?.full_name ?? 'Usuário' }}</p>
            <div class="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span
                v-if="conv.announcement?.status === 'closed'"
                class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-semibold uppercase tracking-wider"
              >
                Pausado
              </span>
              <span class="text-xs text-gray-400">{{ timeAgo(conv.last_message_at) }}</span>
            </div>
          </div>
          <p class="text-xs text-gray-500 truncate">
            <span v-if="conv.last_message">
              <span v-if="conv.last_message.sender_id === currentUserId" class="text-gray-400">Você: </span>
              {{ conv.last_message.content }}
            </span>
            <span v-else class="text-gray-400 italic">Sobre: {{ conv.announcement?.title }}</span>
          </p>
        </div>

        <!-- Delete Action -->
        <button
          @click.prevent="handleDelete(conv.id)"
          class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
          title="Excluir conversa"
        >
          <PhTrash class="w-5 h-5" />
        </button>
      </RouterLink>
    </div>

    <div v-else class="text-center py-12 px-4">
      <p class="text-4xl justify-center flex mb-3 text-gray-300"><PhChatCircle class="w-12 h-12" /></p>
      <p class="text-gray-500 text-sm">Nenhuma conversa ainda.</p>
      <p class="text-gray-400 text-xs mt-1">Inicie uma conversa a partir de um anúncio.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCondominiumStore } from '@/stores/condominium'
import { useAuthStore } from '@/stores/auth'
import { formatTimeAgo } from '@/utils/formatters'
import { PhTrash, PhChatCircle } from '@phosphor-icons/vue'
import { useConfirm } from '@/composables/useConfirm'
import type { Conversation } from '@/types/app.types'

defineProps<{ conversations: Conversation[]; loading?: boolean }>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
}>()

const condominiumStore = useCondominiumStore()
const authStore = useAuthStore()
const { confirm } = useConfirm()
const slug = computed(() => condominiumStore.current?.slug ?? '')
const currentUserId = computed(() => authStore.user?.id)

function timeAgo(dateStr: string): string {
  return formatTimeAgo(dateStr)
}

async function handleDelete(id: string) {
  const ok = await confirm({
    title: 'Apagar conversa?',
    description: 'A conversa será removida da sua lista. O outro participante ainda poderá vê-la.',
    confirmLabel: 'Apagar',
    variant: 'danger',
  })
  if (ok) emit('delete', id)
}
</script>
