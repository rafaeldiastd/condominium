<template>
  <header class="topbar">
    <div class="topbar-left">
      <div class="topbar-logo">
        <img
          v-if="condominium?.logo_url"
          :src="condominium.logo_url"
          class="logo-img"
          alt="Logo"
        />
        <div v-else class="logo-placeholder">
          {{ (condominium?.name ?? 'C').charAt(0).toUpperCase() }}
        </div>
      </div>
      <span class="topbar-name">
        {{ condominium?.name ?? 'Condomiinus' }}
      </span>
      <span v-if="showSyndicBadge" class="syndic-badge">Síndico</span>
    </div>

    <div class="topbar-actions">
      <!-- Admin Panel Switch -->
      <RouterLink
        v-if="authStore.isAdmin"
        to="/admin"
        class="topbar-btn topbar-btn--primary"
        title="Painel Admin"
      >
        <LayoutDashboard class="btn-icon" />
        <span class="btn-label">Painel</span>
      </RouterLink>

      <!-- Syndic App/Panel Switch -->
      <template v-else-if="authStore.isSyndic && authStore.userCondominiumSlug">
        <RouterLink
          v-if="route.path.includes('/sindico')"
          :to="`/${authStore.userCondominiumSlug}`"
          class="topbar-btn topbar-btn--green"
          title="App do Morador"
        >
          <Home class="btn-icon" />
          <span class="btn-label">App</span>
        </RouterLink>
        <RouterLink
          v-else
          :to="`/${authStore.userCondominiumSlug}/sindico`"
          class="topbar-btn topbar-btn--amber"
          title="Painel do Síndico"
        >
          <LayoutDashboard class="btn-icon" />
          <span class="btn-label">Painel</span>
        </RouterLink>
      </template>

      <!-- Meus Anúncios -->
      <RouterLink
        v-if="authStore.user && authStore.userCondominiumSlug"
        :to="`/${authStore.userCondominiumSlug}/my-ads`"
        class="topbar-icon-btn"
        title="Meus Anúncios"
      >
        <Storefront class="icon" />
      </RouterLink>

      <AppNotificationBell />

      <button @click="handleLogout" class="topbar-icon-btn topbar-icon-btn--logout" title="Sair">
        <LogOut class="icon" />
      </button>
    </div>
  </header>
  <!-- Spacer -->
  <div class="topbar-spacer" />
</template>

<script setup lang="ts">
import { useCondominiumStore } from '@/stores/condominium'
import AppNotificationBell from './AppNotificationBell.vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { PhSignOut as LogOut, PhSquaresFour as LayoutDashboard, PhHouse as Home, PhStorefront as Storefront } from '@phosphor-icons/vue'

defineProps<{ showSyndicBadge?: boolean }>()
const condominiumStore = useCondominiumStore()
const { current: condominium } = storeToRefs(condominiumStore)

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

async function handleLogout() {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  height: 56px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-xs);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
}

.topbar-spacer {
  height: 56px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.topbar-logo {
  flex-shrink: 0;
}

.logo-img {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.logo-placeholder {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary), #0ea5e9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(59,130,246,0.25);
}

.topbar-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  letter-spacing: -0.02em;
}

.syndic-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  background: #fef3c7;
  color: #b45309;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.topbar-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  transition: background var(--transition);
}

.topbar-btn--primary {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}
.topbar-btn--primary:hover { background: #dbeafe; }

.topbar-btn--green {
  background: #dcfce7;
  color: #16a34a;
}
.topbar-btn--green:hover { background: #bbf7d0; }

.topbar-btn--amber {
  background: #fef3c7;
  color: #b45309;
}
.topbar-btn--amber:hover { background: #fde68a; }

.btn-icon { width: 15px; height: 15px; }
.btn-label { display: none; }

@media (min-width: 480px) {
  .btn-label { display: inline; }
}

.topbar-icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  border: none;
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
  text-decoration: none;
}

.topbar-icon-btn:hover {
  background: #f1f5f9;
  color: var(--color-text-primary);
}

.topbar-icon-btn--logout:hover {
  background: #fee2e2;
  color: var(--color-danger);
}

.icon { width: 20px; height: 20px; }
</style>
