import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCondominiumStore } from '@/stores/condominium'

// Layouts
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import SyndicLayout from '@/layouts/SyndicLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Auth routes
    {
      path: '/login',
      component: AuthLayout,
      children: [
        { path: '', name: 'login', component: () => import('@/views/LoginView.vue') },
        { path: '/confirm', name: 'confirm', component: () => import('@/views/ConfirmView.vue') },
        { path: '/banned', name: 'banned', component: () => import('@/views/BannedView.vue') },
      ],
    },

    // Home redirect
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },

    // Resident Panel
    {
      path: '/:condominio',
      component: DefaultLayout,
      meta: { requiresAuth: true, requiresCondominium: true },
      children: [
        { path: '', name: 'feed', component: () => import('@/views/condominio/FeedView.vue') },
        { path: 'announcements', name: 'announcements', component: () => import('@/views/condominio/AnnouncementsView.vue') },
        { path: 'announcements/new', name: 'announcement-new', component: () => import('@/views/condominio/AnnouncementNewView.vue') },
        { path: 'announcements/:id', name: 'announcement-detail', component: () => import('@/views/condominio/AnnouncementDetailView.vue') },
        { path: 'announcements/:id/edit', name: 'announcement-edit', component: () => import('@/views/condominio/AnnouncementEditView.vue') },
        { path: 'favorites', name: 'favorites', component: () => import('@/views/condominio/FavoritesView.vue') },
        { path: 'profile/me', name: 'profile-me', component: () => import('@/views/condominio/ProfileMeView.vue') },
        { path: 'profile/:userId', name: 'profile-public', component: () => import('@/views/condominio/ProfilePublicView.vue') },
        { path: 'my-ads', name: 'my-ads', component: () => import('@/views/condominio/MyAdsView.vue') },
        { path: 'chat', name: 'chat-list', component: () => import('@/views/condominio/ChatListView.vue') },
        { path: 'chat/:conversationId', name: 'chat-conversation', component: () => import('@/views/condominio/ChatConversationView.vue') },
      ],
    },

    // Syndic Panel
    {
      path: '/:condominio/sindico',
      component: SyndicLayout,
      meta: { requiresAuth: true, requiresCondominium: true, requiresSyndic: true },
      children: [
        { path: '', name: 'syndic-dashboard', component: () => import('@/views/condominio/sindico/SyndicDashboardView.vue') },
        { path: 'reports', name: 'syndic-reports', component: () => import('@/views/condominio/sindico/SyndicReportsView.vue') },
        { path: 'reports/:reportId', name: 'syndic-report-detail', component: () => import('@/views/condominio/sindico/SyndicReportDetailView.vue') },
        { path: 'residents', name: 'syndic-residents', component: () => import('@/views/condominio/sindico/SyndicResidentsView.vue') },
        { path: 'residents/new', name: 'syndic-resident-new', component: () => import('@/views/condominio/sindico/SyndicResidentNewView.vue') },
        { path: 'residents/:userId', name: 'syndic-resident-edit', component: () => import('@/views/condominio/sindico/SyndicResidentEditView.vue') },
        { path: 'announcements', name: 'syndic-announcements', component: () => import('@/views/condominio/sindico/SyndicAnnouncementsView.vue') },
      ],
    },

    // Admin Panel
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboardView.vue') },
        { path: 'condominiums', name: 'admin-condominiums', component: () => import('@/views/admin/AdminCondominiumsView.vue') },
        { path: 'condominiums/new', name: 'admin-condominium-new', component: () => import('@/views/admin/AdminCondominiumFormView.vue') },
        { path: 'condominiums/:id', name: 'admin-condominium-edit', component: () => import('@/views/admin/AdminCondominiumFormView.vue') },
        { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsersView.vue') },
        { path: 'users/:id', name: 'admin-user-detail', component: () => import('@/views/admin/AdminUserDetailView.vue') },
        { path: 'syndics', name: 'admin-syndics', component: () => import('@/views/admin/AdminSyndicsView.vue') },
        { path: 'syndics/new', name: 'admin-syndic-new', component: () => import('@/views/admin/AdminSyndicFormView.vue') },
        { path: 'syndics/:id', name: 'admin-syndic-edit', component: () => import('@/views/admin/AdminSyndicFormView.vue') },
        { path: 'campaigns', name: 'admin-campaigns', component: () => import('@/views/admin/AdminCampaignsView.vue') },
        { path: 'campaigns/new', name: 'admin-campaign-new', component: () => import('@/views/admin/AdminCampaignFormView.vue') },
        { path: 'campaigns/:id', name: 'admin-campaign-edit', component: () => import('@/views/admin/AdminCampaignFormView.vue') },
      ],
    },

    // 404
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/HomeView.vue') },
  ],
})

// Navigation Guards
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const condominiumStore = useCondominiumStore()

  // Initialize auth if not done
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  // Require auth
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Check banned
  if (authStore.isBanned && to.name !== 'banned' && to.name !== 'login') {
    return { name: 'banned' }
  }

  // Require condominium
  if (to.meta.requiresCondominium && to.params.condominio) {
    const slug = to.params.condominio as string
    if (!condominiumStore.current || condominiumStore.current.slug !== slug) {
      const found = await condominiumStore.resolveSlug(slug)
      if (!found) return { name: 'not-found' }
    }
    // Verify user belongs to this condominium (non-admin)
    if (authStore.profile && authStore.profile.role !== 'super_admin') {
      if (authStore.profile.condominium_id !== condominiumStore.current?.id) {
        const userCondo = authStore.userCondominiumSlug
        if (userCondo) return { path: `/${userCondo}` }
        return { name: 'login' }
      }
    }
  }

  // Require syndic
  if (
    to.meta.requiresSyndic &&
    authStore.profile?.role !== 'syndic' &&
    authStore.profile?.role !== 'super_admin'
  ) {
    return { name: 'feed', params: { condominio: to.params.condominio } }
  }

  // Require admin
  if (to.meta.requiresAdmin && authStore.profile?.role !== 'super_admin') {
    return { name: 'login' }
  }
})

export default router
