<template>
  <div class="p-4 pb-20">
    <!-- Header -->
    <div class="mb-4">
      <h1 class="text-xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-sm text-gray-500">Visão geral do condomínio</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-3 mb-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p class="text-xs text-gray-500 mb-1">Denúncias Pendentes</p>
        <p class="text-2xl font-bold text-amber-600">{{ loading ? '—' : stats.pendingReports }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p class="text-xs text-gray-500 mb-1">Total de Moradores</p>
        <p class="text-2xl font-bold text-gray-900">{{ loading ? '—' : stats.totalResidents }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p class="text-xs text-gray-500 mb-1">Anúncios Ativos</p>
        <p class="text-2xl font-bold text-green-600">{{ loading ? '—' : stats.activeAnnouncements }}</p>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <p class="text-xs text-gray-500 mb-1">Usuários Banidos</p>
        <p class="text-2xl font-bold text-red-600">{{ loading ? '—' : stats.bannedUsers }}</p>
      </div>
    </div>

    <!-- Recent Reports -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-900">Últimas Denúncias</h2>
        <RouterLink
          :to="`/${slug}/sindico/reports`"
          class="text-xs text-amber-600 hover:underline"
        >
          Ver todas
        </RouterLink>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-14 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      <div v-else-if="recentReports.length === 0" class="py-6 text-center text-sm text-gray-400">
        Nenhuma denúncia encontrada.
      </div>

      <div v-else class="space-y-2">
        <RouterLink
          v-for="report in recentReports"
          :key="report.id"
          :to="`/${slug}/sindico/reports/${report.id}`"
          class="flex items-start justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ REPORT_REASON_LABELS[report.reason] }}
            </p>
            <p class="text-xs text-gray-500 truncate">
              {{ report.announcement?.title ?? 'Anúncio removido' }}
            </p>
            <p class="text-xs text-gray-400">{{ formatTimeAgo(report.created_at) }}</p>
          </div>
          <span
            class="flex-shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
            :class="statusClass(report.status)"
          >
            {{ statusLabel(report.status) }}
          </span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useCondominiumStore } from '@/stores/condominium'
import { REPORT_REASON_LABELS } from '@/utils/constants'
import { formatTimeAgo } from '@/utils/formatters'
import type { Report, ReportStatus } from '@/types/app.types'

const condominiumStore = useCondominiumStore()
const slug = computed(() => condominiumStore.current?.slug ?? '')
const condominiumId = computed(() => condominiumStore.current?.id)

const loading = ref(true)
const stats = ref({
  pendingReports: 0,
  totalResidents: 0,
  activeAnnouncements: 0,
  bannedUsers: 0,
})
const recentReports = ref<Report[]>([])

function statusClass(status: ReportStatus) {
  return {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-600',
  }[status]
}

function statusLabel(status: ReportStatus) {
  return {
    pending: 'Pendente',
    reviewed: 'Revisado',
    dismissed: 'Ignorado',
  }[status]
}

async function loadDashboard() {
  const id = condominiumId.value
  if (!id) return

  loading.value = true
  try {
    // Fetch stats in parallel
    const [
      pendingReportsRes,
      totalResidentsRes,
      activeAnnouncementsRes,
      bannedUsersRes,
      recentReportsRes,
    ] = await Promise.all([
      // !inner join permite filtrar por coluna da tabela relacionada
      supabase
        .from('reports')
        .select('id, announcement:announcements!inner(condominium_id)', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('announcement.condominium_id', id),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('condominium_id', id)
        .eq('is_banned', false),
      supabase
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('condominium_id', id)
        .eq('status', 'active'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('condominium_id', id)
        .eq('is_banned', true),
      supabase
        .from('reports')
        .select(`
          *,
          announcement:announcements!inner(id, title, condominium_id),
          reporter:profiles!reporter_id(id, full_name)
        `)
        .eq('announcement.condominium_id', id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    stats.value = {
      pendingReports: pendingReportsRes.count ?? 0,
      totalResidents: totalResidentsRes.count ?? 0,
      activeAnnouncements: activeAnnouncementsRes.count ?? 0,
      bannedUsers: bannedUsersRes.count ?? 0,
    }
    recentReports.value = (recentReportsRes.data ?? []) as Report[]
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>
