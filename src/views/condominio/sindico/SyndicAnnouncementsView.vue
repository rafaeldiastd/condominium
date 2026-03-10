<template>
  <div class="p-4 pb-20">
    <!-- Header -->
    <h1 class="text-xl font-bold text-gray-900 mb-4">Anúncios do Condomínio</h1>

    <!-- Filters Row -->
    <div class="flex flex-col gap-2 mb-4">
      <!-- Search -->
      <input
        v-model="search"
        type="search"
        placeholder="Buscar por título..."
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        @input="onSearch"
      />

      <div class="flex gap-2">
        <!-- Status Filter -->
        <select
          v-model="filterStatus"
          class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          @change="fetchAnnouncements(true)"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="hidden">Oculto</option>
          <option value="deleted">Deletado</option>
          <option value="sold">Vendido</option>
          <option value="closed">Encerrado</option>
        </select>

        <!-- Type Filter -->
        <select
          v-model="filterType"
          class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          @change="fetchAnnouncements(true)"
        >
          <option value="all">Todos os tipos</option>
          <option v-for="(label, type) in ANNOUNCEMENT_TYPE_LABELS" :key="type" :value="type">
            {{ label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-20 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="announcements.length === 0"
      icon="📋"
      title="Nenhum anúncio"
      description="Não há anúncios com os filtros selecionados."
    />

    <!-- List -->
    <div v-else class="space-y-2">
      <div
        v-for="announcement in announcements"
        :key="announcement.id"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-start gap-3"
      >
        <!-- Thumbnail -->
        <div class="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
          <img
            v-if="getCoverImage(announcement)"
            :src="getCoverImage(announcement)!"
            class="w-full h-full object-cover"
            alt=""
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-xl">
            📋
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ announcement.title }}</p>
              <p v-if="announcement.author" class="text-xs text-gray-500 truncate">
                {{ announcement.author.full_name }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <AnnouncementBadge :type="announcement.type" />
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :class="announcementStatusClass(announcement.status)"
            >
              {{ announcementStatusLabel(announcement.status) }}
            </span>
          </div>

          <div class="flex items-center justify-between mt-2">
            <p class="text-xs text-gray-400">{{ formatDate(announcement.created_at) }}</p>
            <SyndicAnnouncementActions
              :announcement="announcement"
              @hide="doHide"
              @activate="doActivate"
              @delete="(a) => { pendingDelete = a; showDeleteDialog = true }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="mt-4 text-center">
      <button
        class="px-6 py-2 text-sm font-medium text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-50 transition-colors"
        :disabled="loadingMore"
        @click="fetchAnnouncements(false)"
      >
        {{ loadingMore ? 'Carregando...' : 'Ver mais' }}
      </button>
    </div>

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      v-if="showDeleteDialog"
      title="Excluir Anúncio"
      message="Tem certeza que deseja excluir este anúncio?"
      confirm-text="Excluir"
      :danger="true"
      :loading="actionLoading"
      @confirm="doDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useCondominiumStore } from '@/stores/condominium'
import { TABLE_PAGE_SIZE, ANNOUNCEMENT_TYPE_LABELS } from '@/utils/constants'
import { formatDate } from '@/utils/formatters'
import type { Announcement, AnnouncementStatus, AnnouncementType } from '@/types/app.types'
import AnnouncementBadge from '@/components/announcement/AnnouncementBadge.vue'
import SyndicAnnouncementActions from '@/components/syndic/SyndicAnnouncementActions.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const condominiumStore = useCondominiumStore()
const condominiumId = computed(() => condominiumStore.current?.id)

const loading = ref(false)
const loadingMore = ref(false)
const actionLoading = ref(false)
const announcements = ref<Announcement[]>([])
const search = ref('')
const filterStatus = ref<AnnouncementStatus | 'all'>('all')
const filterType = ref<AnnouncementType | 'all'>('all')
const page = ref(0)
const hasMore = ref(false)
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
const showDeleteDialog = ref(false)
const pendingDelete = ref<Announcement | null>(null)

function getCoverImage(announcement: Announcement): string | null {
  const images = announcement.images
  if (!images || images.length === 0) return null
  return images.find((img) => img.is_cover)?.url ?? images[0]?.url ?? null
}

function announcementStatusClass(status: AnnouncementStatus) {
  return ({
    active: 'bg-green-100 text-green-700',
    sold: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-600',
    hidden: 'bg-yellow-100 text-yellow-700',
    deleted: 'bg-red-100 text-red-700',
  })[status] ?? 'bg-gray-100 text-gray-600'
}

function announcementStatusLabel(status: AnnouncementStatus) {
  return ({
    active: 'Ativo',
    sold: 'Vendido',
    closed: 'Encerrado',
    hidden: 'Oculto',
    deleted: 'Deletado',
  })[status] ?? status
}

async function fetchAnnouncements(reset = true) {
  const id = condominiumId.value
  if (!id) return

  if (reset) {
    loading.value = true
    page.value = 0
    announcements.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const from = page.value * TABLE_PAGE_SIZE
    const to = from + TABLE_PAGE_SIZE - 1

    let query = supabase
      .from('announcements')
      .select('*, author:profiles!author_id(id, full_name), images:announcement_images(*)')
      .eq('condominium_id', id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filterStatus.value !== 'all') {
      query = query.eq('status', filterStatus.value)
    }

    if (filterType.value !== 'all') {
      query = query.eq('type', filterType.value)
    }

    if (search.value.trim()) {
      query = query.ilike('title', `%${search.value}%`)
    }

    const { data } = await query
    const fetched = (data ?? []) as Announcement[]
    if (reset) {
      announcements.value = fetched
    } else {
      announcements.value.push(...fetched)
    }
    hasMore.value = fetched.length === TABLE_PAGE_SIZE
    page.value += 1
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function onSearch() {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => fetchAnnouncements(true), 400)
}

async function doHide(announcement: Announcement) {
  await supabase.from('announcements').update({ status: 'hidden' }).eq('id', announcement.id)
  const idx = announcements.value.findIndex((a) => a.id === announcement.id)
  if (idx !== -1 && announcements.value[idx]) announcements.value[idx]!.status = 'hidden'
}

async function doActivate(announcement: Announcement) {
  await supabase.from('announcements').update({ status: 'active' }).eq('id', announcement.id)
  const idx = announcements.value.findIndex((a) => a.id === announcement.id)
  if (idx !== -1 && announcements.value[idx]) announcements.value[idx]!.status = 'active'
}

async function doDelete() {
  if (!pendingDelete.value) return
  actionLoading.value = true
  try {
    await supabase
      .from('announcements')
      .update({ status: 'deleted' })
      .eq('id', pendingDelete.value.id)
    const idx = announcements.value.findIndex((a) => a.id === pendingDelete.value!.id)
    if (idx !== -1 && announcements.value[idx]) announcements.value[idx]!.status = 'deleted'
    showDeleteDialog.value = false
    pendingDelete.value = null
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => fetchAnnouncements(true))
</script>
