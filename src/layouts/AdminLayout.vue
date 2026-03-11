<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar desktop -->
    <aside class="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200">
      <div class="flex items-center h-16 px-6 border-b border-gray-200">
        <span class="text-xl font-bold text-gray-900">Condomiinus</span>
        <span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Admin</span>
      </div>
      <nav class="flex-1 px-4 py-4 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="(item.to === '/admin' ? $route.path === '/admin' : $route.path.startsWith(item.to))
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="p-4 border-t border-gray-200 mt-auto space-y-2">
        <RouterLink
          v-if="authStore.userCondominiumSlug"
          :to="`/${authStore.userCondominiumSlug}`"
          class="flex w-full items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          App do Morador
        </RouterLink>
        <button @click="handleLogout" class="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
          Sair
        </button>
      </div>
    </aside>

    <!-- Content area -->
    <div class="flex flex-col flex-1 min-w-0">
      <!-- Mobile header -->
      <header class="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:hidden">
        <span class="text-lg font-bold">Condomiinus Admin</span>
        <button @click="drawerOpen = true" class="p-2 rounded-lg hover:bg-gray-100">
          <span class="sr-only">Abrir menu</span>
          ☰
        </button>
      </header>
      <main class="flex-1 overflow-auto p-4 lg:p-6">
        <RouterView />
      </main>
    </div>

    <!-- Mobile drawer -->
    <div v-if="drawerOpen" class="fixed inset-0 z-50 lg:hidden">
      <div class="absolute inset-0 bg-black/40" @click="drawerOpen = false" />
      <aside class="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col">
        <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <span class="text-xl font-bold">Admin</span>
          <button @click="drawerOpen = false" class="p-2">✕</button>
        </div>
        <nav class="flex-1 px-4 py-4 space-y-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="item.to"
            @click="drawerOpen = false"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="(item.to === '/admin' ? $route.path === '/admin' : $route.path.startsWith(item.to))
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50'"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
        <div class="p-4 border-t border-gray-200 mt-auto space-y-2">
          <RouterLink
            v-if="authStore.userCondominiumSlug"
            :to="`/${authStore.userCondominiumSlug}`"
            @click="drawerOpen = false"
            class="flex w-full items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            App do Morador
          </RouterLink>
          <button @click="handleLogout" class="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            Sair
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const drawerOpen = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { name: 'dashboard', label: 'Dashboard', to: '/admin' },
  { name: 'condominiums', label: 'Condomínios', to: '/admin/condominiums' },
  { name: 'syndics', label: 'Síndicos', to: '/admin/syndics' },
  { name: 'campaigns', label: 'Campanhas', to: '/admin/campaigns' },
  { name: 'users', label: 'Usuários', to: '/admin/users' },
]

async function handleLogout() {
  await authStore.signOut()
  router.push('/login')
}
</script>
