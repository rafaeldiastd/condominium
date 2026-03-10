<template>
  <div class="p-4 pb-20">
    <!-- Header -->
    <h1 class="text-xl font-bold text-gray-900 mb-4">Denúncias</h1>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.status"
        class="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="
          activeTab === tab.status
            ? 'bg-white text-amber-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="activeTab = tab.status"
      >
        {{ tab.label }}
        <span
          v-if="counts[tab.status] > 0"
          class="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full"
          :class="
            activeTab === tab.status ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
          "
        >
          {{ counts[tab.status] > 99 ? '99+' : counts[tab.status] }}
        </span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-24 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="reports.length === 0"
      icon="🏳️"
      title="Nenhuma denúncia"
      :description="`Não há denúncias ${tabs.find((t) => t.status === activeTab)?.emptyLabel ?? ''}.`"
    />

    <!-- Reports List -->
    <div v-else class="space-y-3">
      <SyndicReportCard v-for="report in reports" :key="report.id" :report="report" />
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="mt-4 text-center">
      <button
        class="px-6 py-2 text-sm font-medium text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-50 transition-colors"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? 'Carregando...' : 'Ver mais' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useCondominiumStore } from '@/stores/condominium'
import { TABLE_PAGE_SIZE } from '@/utils/constants'
import type { Report, ReportStatus } from '@/types/app.types'
import SyndicReportCard from '@/components/syndic/SyndicReportCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const condominiumStore = useCondominiumStore()
const condominiumId = computed(() => condominiumStore.current?.id)

type Tab = { status: ReportStatus; label: string; emptyLabel: string }

const tabs: Tab[] = [
  { status: 'pending', label: 'Pendente', emptyLabel: 'pendentes' },
  { status: 'reviewed', label: 'Revisado', emptyLabel: 'revisadas' },
  { status: 'dismissed', label: 'Descartado', emptyLabel: 'descartadas' },
]

const activeTab = ref<ReportStatus>('pending')
const loading = ref(false)
const loadingMore = ref(false)
const reports = ref<Report[]>([])
const counts = ref<Record<ReportStatus, number>>({ pending: 0, reviewed: 0, dismissed: 0 })
const page = ref(0)
const hasMore = ref(false)

async function fetchCounts() {
  const id = condominiumId.value
  if (!id) return

  const statuses: ReportStatus[] = ['pending', 'reviewed', 'dismissed']
  const results = await Promise.all(
    statuses.map((status) =>
      supabase
        .from('reports')
        .select('id, announcement:announcements!inner(condominium_id)', { count: 'exact', head: true })
        .eq('status', status)
        .eq('announcement.condominium_id', id),
    ),
  )

  statuses.forEach((status, i) => {
    counts.value[status] = results[i]?.count ?? 0
  })
}

async function fetchReports(reset = true) {
  const id = condominiumId.value
  if (!id) return

  if (reset) {
    loading.value = true
    page.value = 0
    reports.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const from = page.value * TABLE_PAGE_SIZE
    const to = from + TABLE_PAGE_SIZE - 1

    const { data } = await supabase
      .from('reports')
      .select(`
        *,
        announcement:announcements!inner(id, title, condominium_id, images:announcement_images(*)),
        reporter:profiles!reporter_id(id, full_name, avatar_url)
      `)
      .eq('status', activeTab.value)
      .eq('announcement.condominium_id', id)
      .order('created_at', { ascending: false })
      .range(from, to)

    const fetched = (data ?? []) as Report[]
    if (reset) {
      reports.value = fetched
    } else {
      reports.value.push(...fetched)
    }
    hasMore.value = fetched.length === TABLE_PAGE_SIZE
    page.value += 1
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  fetchReports(false)
}

watch(activeTab, () => fetchReports(true))

onMounted(async () => {
  await fetchCounts()
  await fetchReports(true)
})
</script>
