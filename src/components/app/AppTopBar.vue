<template>
  <header class="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
    <div class="flex items-center gap-2">
      <img
        v-if="condominium?.logo_url"
        :src="condominium.logo_url"
        class="h-8 w-8 rounded-full object-cover"
        alt="Logo"
      />
      <span class="font-semibold text-gray-900 text-sm truncate max-w-[180px]">
        {{ condominium?.name ?? 'Condomiinus' }}
      </span>
      <span
        v-if="showSyndicBadge"
        class="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full"
      >
        Síndico
      </span>
    </div>
    <div class="flex items-center gap-2">
      <AppNotificationBell />
      <button @click="handleLogout" class="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors" title="Sair">
        <LogOut class="w-5 h-5" />
      </button>
    </div>
  </header>
  <!-- Spacer -->
  <div class="h-14" />
</template>

<script setup lang="ts">
import { useCondominiumStore } from '@/stores/condominium'
import AppNotificationBell from './AppNotificationBell.vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { LogOut } from 'lucide-vue-next'

defineProps<{ showSyndicBadge?: boolean }>()
const condominiumStore = useCondominiumStore()
const { current: condominium } = storeToRefs(condominiumStore)

const authStore = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await authStore.signOut()
  router.push('/login')
}
</script>
