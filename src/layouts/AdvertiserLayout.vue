<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCreditsStore } from '@/stores/credits'
import { 
  LayoutDashboard, 
  Megaphone, 
  Wallet, 
  BarChart3, 
  LogOut, 
  User,
  Settings,
  Bell,
  Menu,
  X
} from 'lucide-vue-next'

const authStore = useAuthStore()
const creditsStore = useCreditsStore()
const router = useRouter()
const route = useRoute()
const isSidebarOpen = ref(false)

const navigation = [
  { name: 'Dashboard', href: '/anunciante', icon: LayoutDashboard },
  { name: 'Meus Anúncios', href: '/anunciante/anuncios', icon: Megaphone },
  { name: 'Créditos', href: '/anunciante/creditos', icon: Wallet },
  { name: 'Métricas', href: '/anunciante/metricas', icon: BarChart3 },
]

async function handleLogout() {
  await authStore.signOut()
  router.push('/login')
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

// Fetch credits on load
creditsStore.fetchCredits()
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans">
    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="isSidebarOpen" 
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
      @click="isSidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside 
      class="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex flex-col h-full">
        <!-- Logo Area -->
        <div class="h-16 flex items-center px-6 border-b border-gray-200">
          <RouterLink to="/anunciante" class="flex items-center gap-3">
            <span class="text-xl font-bold text-gray-900 tracking-tight">
              Ads Center
            </span>
            <span class="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Beta</span>
          </RouterLink>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <RouterLink 
            v-for="item in navigation" 
            :key="item.name" 
            :to="item.href"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
            :class="route.path === item.href ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            @click="isSidebarOpen = false"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span class="font-medium">{{ item.name }}</span>
          </RouterLink>
        </nav>

        <!-- User Profile -->
        <div class="p-4 border-t border-gray-200">
          <div class="flex items-center gap-3 mb-4 px-2">
            <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
              <img 
                v-if="authStore.profile?.avatar_url" 
                :src="authStore.profile.avatar_url" 
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                <User class="w-5 h-5" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold truncate text-sm text-gray-900">{{ authStore.profile?.full_name || 'Anunciante' }}</p>
              <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
            </div>
          </div>
          
          <div class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg mb-4">
            <span class="text-xs text-gray-500 font-medium">Saldo</span>
            <span class="font-bold text-blue-600">{{ creditsStore.balance }} CRD</span>
          </div>

          <button 
            @click="handleLogout"
            class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
          >
            <LogOut class="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="lg:ml-64 flex flex-col min-h-screen">
      <!-- Header -->
      <header class="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 sticky top-0 z-30">
        <div class="flex items-center gap-4">
          <button 
            @click="toggleSidebar"
            class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <Menu v-if="!isSidebarOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
          <h1 class="text-lg font-bold text-gray-900">
            {{ navigation.find(n => n.href === route.path)?.name || 'Anunciante' }}
          </h1>
        </div>

        <div class="flex items-center gap-4">
          <button class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 relative">
            <Bell class="w-5 h-5" />
            <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
          <div class="h-8 w-px bg-gray-200 hidden sm:block"></div>
          <button class="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            <Settings class="w-5 h-5" />
          </button>
        </div>
      </header>

      <!-- Content Area -->
      <div class="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>
