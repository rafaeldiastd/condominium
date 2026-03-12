<template>
  <div class="admin-shell">
    <!-- Sidebar desktop -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">C</div>
        <div class="sidebar-brand">
          <span class="sidebar-title">Condomiinus</span>
          <span class="sidebar-badge">Admin</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="nav-link"
          :class="(item.to === '/admin' ? $route.path === '/admin' : $route.path.startsWith(item.to))
            ? 'nav-link--active'
            : ''"
        >
          <component :is="item.icon" class="nav-link-icon" weight="duotone" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <RouterLink
          v-if="authStore.userCondominiumSlug"
          :to="`/${authStore.userCondominiumSlug}`"
          class="footer-btn footer-btn--app"
        >
          <PhHouse class="footer-icon" />
          App do Morador
        </RouterLink>
        <button @click="handleLogout" class="footer-btn footer-btn--logout">
          <PhSignOut class="footer-icon" />
          Sair
        </button>
      </div>
    </aside>

    <!-- Content area -->
    <div class="admin-content">
      <!-- Mobile header -->
      <header class="mobile-header">
        <div class="mobile-brand">
          <div class="sidebar-logo sidebar-logo--sm">C</div>
          <span class="mobile-title">Admin</span>
        </div>
        <button @click="drawerOpen = true" class="hamburger" aria-label="Abrir menu">
          <PhList class="h-icon" />
        </button>
      </header>

      <main class="admin-main">
        <RouterView />
      </main>
    </div>

    <!-- Mobile drawer overlay -->
    <div v-if="drawerOpen" class="drawer-overlay" @click="drawerOpen = false">
      <aside class="drawer" @click.stop>
        <div class="sidebar-header">
          <div class="sidebar-logo">C</div>
          <div class="sidebar-brand">
            <span class="sidebar-title">Condomiinus</span>
            <span class="sidebar-badge">Admin</span>
          </div>
          <button @click="drawerOpen = false" class="drawer-close">
            <PhX />
          </button>
        </div>

        <nav class="sidebar-nav">
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="item.to"
            @click="drawerOpen = false"
            class="nav-link"
            :class="(item.to === '/admin' ? $route.path === '/admin' : $route.path.startsWith(item.to))
              ? 'nav-link--active'
              : ''"
          >
            <component :is="item.icon" class="nav-link-icon" weight="duotone" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="sidebar-footer">
          <RouterLink
            v-if="authStore.userCondominiumSlug"
            :to="`/${authStore.userCondominiumSlug}`"
            @click="drawerOpen = false"
            class="footer-btn footer-btn--app"
          >
            <PhHouse class="footer-icon" />
            App do Morador
          </RouterLink>
          <button @click="handleLogout" class="footer-btn footer-btn--logout">
            <PhSignOut class="footer-icon" />
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
import {
  PhSquaresFour,
  PhBuildings,
  PhUserGear,
  PhMegaphone,
  PhUsers,
  PhHouse,
  PhSignOut,
  PhList,
  PhX,
} from '@phosphor-icons/vue'

const drawerOpen = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { name: 'dashboard',    label: 'Dashboard',    to: '/admin',                 icon: PhSquaresFour },
  { name: 'condominiums', label: 'Condomínios',  to: '/admin/condominiums',    icon: PhBuildings   },
  { name: 'syndics',      label: 'Síndicos',     to: '/admin/syndics',         icon: PhUserGear    },
  { name: 'campaigns',    label: 'Campanhas',    to: '/admin/campaigns',       icon: PhMegaphone   },
  { name: 'users',        label: 'Usuários',     to: '/admin/users',           icon: PhUsers       },
]

async function handleLogout() {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
/* Shell */
.admin-shell {
  display: flex;
  height: 100vh;
  background: var(--color-bg);
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  display: none;
  flex-direction: column;
  width: 240px;
  flex-shrink: 0;
  background: #0f172a;
  height: 100vh;
}

@media (min-width: 1024px) {
  .sidebar { display: flex; }
}

/* Header da sidebar */
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255,255,255,.07);
}

.sidebar-logo {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary), #0ea5e9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(59,130,246,.4);
}

.sidebar-logo--sm {
  width: 28px;
  height: 28px;
  font-size: 0.8125rem;
}

.sidebar-brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sidebar-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.02em;
  line-height: 1;
}

.sidebar-badge {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(59,130,246,.25);
  color: #93c5fd;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  width: fit-content;
}

/* Nav links */
.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: #94a3b8;
  text-decoration: none;
  transition: background var(--transition), color var(--transition);
}

.nav-link:hover {
  background: rgba(255,255,255,.06);
  color: #e2e8f0;
}

.nav-link--active {
  background: rgba(59,130,246,.2);
  color: #93c5fd;
  font-weight: 600;
}

.nav-link-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Footer */
.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid rgba(255,255,255,.07);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  width: 100%;
  text-decoration: none;
  transition: background var(--transition);
  font-family: inherit;
}

.footer-btn--app {
  color: #6ee7b7;
  background: transparent;
}
.footer-btn--app:hover { background: rgba(110,231,183,.1); }

.footer-btn--logout {
  color: #fca5a5;
  background: transparent;
}
.footer-btn--logout:hover { background: rgba(252,165,165,.1); }

.footer-icon { width: 16px; height: 16px; }

/* Content area */
.admin-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

/* Mobile header */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-xs);
}

@media (min-width: 1024px) {
  .mobile-header { display: none; }
}

.mobile-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.hamburger {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background var(--transition);
}
.hamburger:hover { background: #f1f5f9; }
.h-icon { width: 22px; height: 22px; }

/* Main */
.admin-main {
  flex: 1;
  overflow: auto;
  padding: 1.25rem 1rem;
}

@media (min-width: 1024px) {
  .admin-main { padding: 1.5rem; }
}

/* Drawer / Mobile nav */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15,23,42,.5);
  backdrop-filter: blur(2px);
  display: flex;
}

.drawer {
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 100%;
  background: #0f172a;
  animation: slideIn 220ms cubic-bezier(.34,1.56,.64,1);
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}

.drawer-close {
  margin-left: auto;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(255,255,255,.08);
  border-radius: var(--radius-sm);
  color: #94a3b8;
  cursor: pointer;
}
</style>
