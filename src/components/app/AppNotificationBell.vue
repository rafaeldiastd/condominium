<template>
  <div class="relative" ref="bellRef">
    <button
      @click="toggleDropdown"
      class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
      <span v-if="unreadCount > 0" class="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 top-full mt-1 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span class="font-semibold text-gray-900 text-sm">Notificações</span>
        <button v-if="unreadCount > 0" @click="markAllRead" class="text-xs text-blue-600 hover:underline">
          Marcar todas como lidas
        </button>
      </div>

      <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          class="px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
          :class="{ 'bg-blue-50': !notif.is_read }"
          @click="handleNotifClick(notif)"
        >
          <p class="text-sm font-medium text-gray-900">{{ notif.title }}</p>
          <p v-if="notif.body" class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ notif.body }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ formatTimeAgo(notif.created_at) }}</p>
        </div>

        <div v-if="!notifications.length" class="px-4 py-8 text-center">
          <p class="text-sm text-gray-500">Nenhuma notificação</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications'
import { formatTimeAgo } from '@/utils/formatters'
import type { Notification } from '@/types/app.types'

const notificationsStore = useNotificationsStore()
const { notifications, unreadCount } = storeToRefs(notificationsStore)

const dropdownOpen = ref(false)
const bellRef = ref<HTMLDivElement>()

onMounted(() => {
  notificationsStore.fetchNotifications()
  notificationsStore.subscribeToNotifications()
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  notificationsStore.unsubscribeFromNotifications()
  document.removeEventListener('click', handleOutsideClick)
})

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function handleOutsideClick(e: MouseEvent) {
  if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false
  }
}

async function markAllRead() {
  await notificationsStore.markAllRead()
}

function handleNotifClick(notif: Notification) {
  notificationsStore.markOneRead(notif.id)
  dropdownOpen.value = false
}
</script>
