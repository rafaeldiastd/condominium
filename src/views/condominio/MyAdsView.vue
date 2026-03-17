<template>
  <div class="p-4 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">Meus Anúncios</h2>

      <div class="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          @click="viewMode = 'grid'"
          class="p-1.5 rounded-md transition-colors"
          :class="viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'"
          title="Visualização em Grade"
        >
          <PhSquaresFour class="w-5 h-5" />
        </button>
        <button
          @click="viewMode = 'list'"
          class="p-1.5 rounded-md transition-colors"
          :class="viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'"
          title="Visualização em Lista"
        >
          <PhList class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="animate-pulse bg-white rounded-2xl p-3 border border-gray-100">
        <div class="aspect-square bg-gray-100 rounded-xl mb-3"></div>
        <div class="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="!announcements.length"
      :icon="PhPackage"
      title="Nenhum anúncio"
      description="Você ainda não possui nenhum anúncio ativo ou inativo."
    />

    <!-- Content -->
    <div v-else>
      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="ann in announcements" :key="ann.id" class="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
          <RouterLink :to="`/${condominiumSlug}/announcements/${ann.id}`" class="block aspect-square relative group">
            <img
              v-if="ann.images?.[0]"
              :src="ann.images[0].url + '?width=400&quality=80'"
              class="w-full h-full object-cover"
              :alt="ann.title"
            />
            <div v-else class="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
              <PhPackage class="w-12 h-12" />
            </div>
            <!-- Status Badge -->
            <div
              class="absolute top-2 left-2 px-2 py-1 rounded text-white text-xs font-medium backdrop-blur-sm"
              :class="statusBadgeClass(ann.status)"
            >
              {{ formatStatus(ann.status) }}
            </div>
          </RouterLink>

          <div class="p-3 flex-1 flex flex-col">
            <h3 class="font-medium text-gray-900 line-clamp-2 text-sm mb-1" :title="ann.title">{{ ann.title }}</h3>
            <div class="mt-auto">
              <span class="inline-flex items-center justify-center px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow-sm">
                {{ ann.price != null ? formatCurrency(ann.price) : 'Gratuito' }}
              </span>
            </div>
            
            <div class="mt-4 grid grid-cols-2 gap-2">
              <RouterLink
                v-if="ann.status !== 'sold'"
                :to="`/${condominiumSlug}/announcements/${ann.id}/edit`"
                class="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition"
              >
                <PhPencilSimple class="w-3.5 h-3.5" /> Editar
              </RouterLink>

              <!-- Pausar: only when active -->
              <button
                v-if="ann.status === 'active'"
                @click="changeStatus(ann.id, 'closed')"
                class="flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium transition"
              >
                <PhPause class="w-3.5 h-3.5" /> Pausar
              </button>

              <!-- Encerrar definitivamente -->
              <button
                v-if="ann.status === 'active' || ann.status === 'closed'"
                @click="handleClose(ann.id)"
                :disabled="closingId === ann.id"
                class="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium transition disabled:opacity-60"
                :class="ann.status === 'active' ? '' : 'col-span-2'"
              >
                <PhSpinner v-if="closingId === ann.id" class="w-3.5 h-3.5 animate-spin" />
                <PhCheckCircle v-else class="w-3.5 h-3.5" />
                {{ closingId === ann.id ? 'Encerrando...' : 'Encerrar' }}
              </button>

              <!-- Reativar: only when paused (closed), NOT when sold (encerrado) -->
              <button
                v-if="ann.status === 'closed'"
                @click="changeStatus(ann.id, 'active')"
                class="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition"
              >
                <PhPlay class="w-3.5 h-3.5" /> Reativar
              </button>

              <!-- Sold: encerrado label -->
              <div
                v-if="ann.status === 'sold'"
                class="col-span-2 text-center text-xs text-gray-400 py-1"
              >
                Anúncio encerrado
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="space-y-3">
        <div v-for="ann in announcements" :key="ann.id" class="bg-white rounded-xl border border-gray-100 p-3 flex gap-4 items-center hover:shadow-sm transition">
          <RouterLink :to="`/${condominiumSlug}/announcements/${ann.id}`" class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
            <img
              v-if="ann.images?.[0]"
              :src="ann.images[0].url + '?width=100&quality=60'"
              class="w-full h-full object-cover"
              :alt="ann.title"
            />
            <div v-else class="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
              <PhPackage class="w-8 h-8" />
            </div>
          </RouterLink>

          <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                  :class="statusBadgeClass(ann.status)"
                >
                  {{ formatStatus(ann.status) }}
                </span>
                <span class="text-xs text-gray-400">{{ formatDate(ann.created_at) }}</span>
              </div>
              <h3 class="font-medium text-gray-900 truncate text-sm">
                <RouterLink :to="`/${condominiumSlug}/announcements/${ann.id}`" class="hover:underline">{{ ann.title }}</RouterLink>
              </h3>
              <div class="mt-1">
                <span class="inline-flex items-center justify-center px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow-sm">
                  {{ ann.price != null ? formatCurrency(ann.price) : 'Gratuito' }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <!-- Edit -->
              <RouterLink
                v-if="ann.status !== 'sold'"
                :to="`/${condominiumSlug}/announcements/${ann.id}/edit`"
                class="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg transition"
                title="Editar"
              >
                <PhPencilSimple class="w-4 h-4" />
              </RouterLink>

              <!-- Pausar -->
              <button
                v-if="ann.status === 'active'"
                @click="changeStatus(ann.id, 'closed')"
                class="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition"
                title="Pausar anúncio"
              >
                <PhPause class="w-4 h-4" />
              </button>

              <!-- Encerrar -->
              <button
                v-if="ann.status === 'active' || ann.status === 'closed'"
                @click="handleClose(ann.id)"
                :disabled="closingId === ann.id"
                class="p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition sm:px-3 sm:py-2 sm:w-auto disabled:opacity-60"
                title="Encerrar anúncio"
              >
                <PhSpinner v-if="closingId === ann.id" class="w-4 h-4 sm:hidden animate-spin" />
                <PhCheckCircle v-else class="w-4 h-4 sm:hidden" />
                <span class="hidden sm:inline text-xs font-medium">{{ closingId === ann.id ? 'Encerrando...' : 'Encerrar' }}</span>
              </button>

              <!-- Reativar: only when paused -->
              <button
                v-if="ann.status === 'closed'"
                @click="changeStatus(ann.id, 'active')"
                class="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition sm:px-3 sm:py-2 sm:w-auto"
                title="Reativar anúncio"
              >
                <PhPlay class="w-4 h-4 sm:hidden" />
                <span class="hidden sm:inline text-xs font-medium">Reativar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCondominiumStore } from '@/stores/condominium'
import { useAnnouncements } from '@/composables/useAnnouncements'
import { formatCurrency } from '@/utils/formatters'
import { useLocalStorage } from '@vueuse/core'
import EmptyState from '@/components/common/EmptyState.vue'
import {
  PhSquaresFour,
  PhList,
  PhPackage,
  PhPencilSimple,
  PhCheckCircle,
  PhPause,
  PhPlay,
  PhSpinner,
} from '@phosphor-icons/vue'
import type { Announcement, AnnouncementStatus } from '@/types/app.types'

const authStore = useAuthStore()
const condominiumStore = useCondominiumStore()
const { fetchMyAnnouncements, updateAnnouncementStatus, closeAnnouncement } = useAnnouncements()

const condominiumSlug = computed(() => condominiumStore.current?.slug ?? '')
const announcements = ref<Announcement[]>([])
const loading = ref(true)
const closingId = ref<string | null>(null)

// Persist the view mode preference in local storage
const viewMode = useLocalStorage<'grid' | 'list'>('condomiinus_myads_viewmode', 'grid')

async function loadAnnouncements() {
  if (!authStore.user) return
  loading.value = true
  try {
    announcements.value = await fetchMyAnnouncements(authStore.user.id)
  } finally {
    loading.value = false
  }
}

async function changeStatus(id: string, s: AnnouncementStatus) {
  try {
    // Optimistic UI Update
    const ann = announcements.value.find(a => a.id === id)
    if (ann) ann.status = s

    await updateAnnouncementStatus(id, s)
  } catch (err) {
    console.error('Failed to update status', err)
    // Revert optimistic update on failure by reloading
    await loadAnnouncements()
  }
}

/**
 * Handles the irreversible "Encerrar" action with a 2-step confirmation.
 * Saves metrics snapshot, deletes images, deletes all chats, and removes the announcement.
 */
async function handleClose(id: string) {
  const ann = announcements.value.find(a => a.id === id)
  const title = ann?.title ?? 'este anúncio'

  const firstConfirm = confirm(
    `Tem certeza que deseja encerrar "${title}"?\n\nIsso irá:\n• Excluir todas as imagens\n• Apagar todas as conversas\n• Remover o anúncio permanentemente\n\nEsta ação não pode ser desfeita.`
  )
  if (!firstConfirm) return

  const secondConfirm = confirm(`Confirme: deseja ENCERRAR definitivamente "${title}"?`)
  if (!secondConfirm) return

  closingId.value = id
  try {
    await closeAnnouncement(id)
    // Remove from local list immediately
    announcements.value = announcements.value.filter(a => a.id !== id)
  } catch (err) {
    console.error('Failed to close announcement', err)
    alert('Não foi possível encerrar o anúncio. Tente novamente.')
  } finally {
    closingId.value = null
  }
}

function formatStatus(status: string) {
  switch (status) {
    case 'active': return 'Ativo'
    case 'sold': return 'Encerrado'
    case 'closed': return 'Pausado'
    case 'hidden': return 'Oculto'
    default: return status
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-500/90'
    case 'sold': return 'bg-gray-500/80 text-white'
    case 'closed': return 'bg-amber-500/90'
    default: return 'bg-black/60'
  }
}

// Simple date formatter for the list view
function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr))
}

onMounted(() => {
  loadAnnouncements()
})
</script>
