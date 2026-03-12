<template>
  <nav class="bottom-nav">
    <RouterLink
      :to="`/${slug}`"
      class="nav-item"
      :class="{ 'nav-item--active': isActive('feed') }"
      title="Feed"
    >
      <span class="nav-icon">
        <HomeIcon :weight="isActive('feed') ? 'fill' : 'regular'" />
      </span>
      <span class="nav-label">Feed</span>
      <span v-if="isActive('feed')" class="nav-indicator" />
    </RouterLink>

    <RouterLink
      :to="`/${slug}/announcements`"
      class="nav-item"
      :class="{ 'nav-item--active': isActive('announcements') }"
      title="Buscar"
    >
      <span class="nav-icon">
        <SearchIcon :weight="isActive('announcements') ? 'bold' : 'regular'" />
      </span>
      <span class="nav-label">Buscar</span>
      <span v-if="isActive('announcements')" class="nav-indicator" />
    </RouterLink>

    <!-- Botão central de publicar -->
    <RouterLink :to="`/${slug}/announcements/new`" class="nav-publish" title="Publicar">
      <span class="publish-btn">
        <PlusIcon weight="bold" />
      </span>
    </RouterLink>

    <RouterLink
      :to="`/${slug}/chat`"
      class="nav-item"
      :class="{ 'nav-item--active': isActive('chat') }"
      title="Chat"
    >
      <span class="nav-icon">
        <MessageCircleIcon :weight="isActive('chat') ? 'fill' : 'regular'" />
        <span v-if="unreadCount > 0" class="unread-badge">
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </span>
      <span class="nav-label">Chat</span>
      <span v-if="isActive('chat')" class="nav-indicator" />
    </RouterLink>

    <RouterLink
      :to="`/${slug}/profile/${profileIdentifier}`"
      class="nav-item"
      :class="{ 'nav-item--active': isActive('profile') }"
      title="Perfil"
    >
      <span class="nav-icon">
        <UserIcon :weight="isActive('profile') ? 'fill' : 'regular'" />
      </span>
      <span class="nav-label">Perfil</span>
      <span v-if="isActive('profile')" class="nav-indicator" />
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

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  height: 64px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border-subtle);
  box-shadow: 0 -4px 20px rgba(15,23,42,.06);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 4px;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Item padrão */
.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-text-muted);
  transition: color var(--transition);
  flex: 1;
}

.nav-item:hover {
  color: var(--color-text-secondary);
}

.nav-item--active {
  color: var(--color-primary);
}

.nav-icon {
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.nav-label {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

/* Indicador ativo */
.nav-indicator {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 3px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
}

/* Badge de não lido */
.unread-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  background: var(--color-danger);
  border-radius: var(--radius-full);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 2px solid var(--color-surface);
}

/* Botão central de publicar */
.nav-publish {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-decoration: none;
  margin-bottom: 4px;
}

.publish-btn {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-primary), #0ea5e9);
  box-shadow: var(--shadow-colored);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: transform var(--transition), box-shadow var(--transition);
}

.publish-btn :deep(svg) {
  width: 22px;
  height: 22px;
}

.nav-publish:hover .publish-btn {
  transform: scale(1.08);
  box-shadow: 0 8px 24px rgba(59,130,246,.4);
}

.nav-publish:active .publish-btn {
  transform: scale(0.95);
}
</style>
