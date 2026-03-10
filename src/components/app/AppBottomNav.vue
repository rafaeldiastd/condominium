<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2">
    <RouterLink
      :to="`/${slug}`"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg"
      :class="isActive('feed') ? 'text-blue-600' : 'text-gray-500'"
    >
      <HomeIcon :weight="isActive('feed') ? 'fill' : 'regular'" class="w-6 h-6" />
      <span class="text-xs">Feed</span>
    </RouterLink>

    <RouterLink
      :to="`/${slug}/announcements`"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg"
      :class="isActive('announcements') ? 'text-blue-600' : 'text-gray-500'"
    >
      <SearchIcon :weight="isActive('announcements') ? 'bold' : 'regular'" class="w-6 h-6" />
      <span class="text-xs">Buscar</span>
    </RouterLink>

    <!-- Botão central de publicar -->
    <RouterLink :to="`/${slug}/announcements/new`" class="flex flex-col items-center -mt-4">
      <span class="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
        <PlusIcon weight="bold" class="w-6 h-6 text-white" />
      </span>
    </RouterLink>

    <RouterLink
      :to="`/${slug}/chat`"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg relative"
      :class="isActive('chat') ? 'text-blue-600' : 'text-gray-500'"
    >
      <MessageCircleIcon :weight="isActive('chat') ? 'fill' : 'regular'" class="w-6 h-6" />
      <span class="text-xs">Chat</span>
      <span
        v-if="unreadCount > 0"
        class="absolute top-0 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </RouterLink>

    <RouterLink
      :to="`/${slug}/profile/${profileIdentifier}`"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg"
      :class="isActive('profile') ? 'text-blue-600' : 'text-gray-500'"
    >
      <UserIcon :weight="isActive('profile') ? 'fill' : 'regular'" class="w-6 h-6" />
      <span class="text-xs">Perfil</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCondominiumStore } from '@/stores/condominium'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import {
  PhHouse as HomeIcon,
  PhMagnifyingGlass as SearchIcon,
  PhPlus as PlusIcon,
  PhChatCircle as MessageCircleIcon,
  PhUser as UserIcon,
} from '@phosphor-icons/vue'

const route = useRoute()
const condominiumStore = useCondominiumStore()
const chatStore = useChatStore()
const authStore = useAuthStore()

const slug = computed(() => condominiumStore.current?.slug ?? '')
const { totalUnreadCount: unreadCount } = storeToRefs(chatStore)

const profileIdentifier = computed(() => {
  if (!authStore.profile) return 'me'
  return authStore.profile.username || authStore.profile.id
})

function isActive(section: string): boolean {
  const path = route.name as string
  if (!path) return false
  const map: Record<string, string[]> = {
    feed: ['feed'],
    announcements: ['announcements', 'announcement-detail', 'announcement-new', 'announcement-edit', 'favorites'],
    chat: ['chat-list', 'chat-conversation'],
    profile: ['profile-me', 'profile-public'],
  }
  return (map[section] ?? []).includes(path)
}
</script>
