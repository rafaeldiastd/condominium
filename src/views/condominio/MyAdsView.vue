<template>
  <div class="p-4 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">Meus Anúncios</h2>

      <!-- View toggle -->
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
            <p class="text-sm font-semibold text-blue-600 mt-auto">{{ ann.price != null ? formatCurrency(ann.price) : 'Gratuito' }}</p>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <RouterLink
                v-if="ann.status !== 'sold'"
                :to="`/${condominiumSlug}/announcements/${ann.id}/edit`"
              >
                <AppButton variant="secondary" size="sm" full>
                  <PhPencilSimple class="w-3.5 h-3.5" /> Editar
                </AppButton>
              </RouterLink>

              <!-- Pausar -->
              <AppButton
                v-if="ann.status === 'active'"
                variant="warning"
                size="sm"
                @click="changeStatus(ann.id, 'closed')"
              >
                <PhPause class="w-3.5 h-3.5" /> Pausar
              </AppButton>

              <!-- Encerrar -->
              <AppButton
                v-if="ann.status === 'active' || ann.status === 'closed'"
                variant="danger"
                size="sm"
                :loading="closingId === ann.id"
                :class="ann.status === 'active' ? '' : 'col-span-2'"
                @click="handleClose(ann.id)"
              >
                <PhCheckCircle v-if="closingId !== ann.id" class="w-3.5 h-3.5" />
                {{ closingId === ann.id ? 'Encerrando...' : 'Encerrar' }}
              </AppButton>

              <!-- Reativar -->
              <AppButton
                v-if="ann.status === 'closed'"
                variant="primary"
                size="sm"
                @click="changeStatus(ann.id, 'active')"
              >
                <PhPlay class="w-3.5 h-3.5" /> Reativar
              </AppButton>

              <!-- Encerrado -->
              <div v-if="ann.status === 'sold'" class="col-span-2 text-center text-xs text-gray-400 py-1">
                Anúncio encerrado
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="space-y-3">
        <div v-for="ann in announcements" :key="ann.id" class="bg-white rounded-xl border border-gray-100 p-3 flex gap-4 items-center hover:shadow-sm transition">
          <RouterLink :to="`/${condominiumSlug}/announcements/${ann.id}`" class="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative">
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
                <AppBadge :variant="statusBadgeVariant(ann.status)" size="sm">{{ formatStatus(ann.status) }}</AppBadge>
                <span class="text-xs text-gray-400">{{ formatDate(ann.created_at) }}</span>
              </div>
              <h3 class="font-medium text-gray-900 truncate text-sm">
                <RouterLink :to="`/${condominiumSlug}/announcements/${ann.id}`" class="hover:underline">{{ ann.title }}</RouterLink>
              </h3>
              <p class="text-sm font-semibold text-blue-600 mt-0.5">{{ ann.price != null ? formatCurrency(ann.price) : 'Gratuito' }}</p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <RouterLink v-if="ann.status !== 'sold'" :to="`/${condominiumSlug}/announcements/${ann.id}/edit`">
                <AppButton variant="secondary" size="sm" title="Editar">
                  <PhPencilSimple class="w-4 h-4" />
                </AppButton>
              </RouterLink>

              <AppButton
                v-if="ann.status === 'active'"
                variant="warning"
                size="sm"
                title="Pausar anúncio"
                @click="changeStatus(ann.id, 'closed')"
              >
                <PhPause class="w-4 h-4" />
              </AppButton>

              <AppButton
                v-if="ann.status === 'active' || ann.status === 'closed'"
                variant="danger"
                size="sm"
                :loading="closingId === ann.id"
                title="Encerrar anúncio"
                @click="handleClose(ann.id)"
              >
                <PhCheckCircle v-if="closingId !== ann.id" class="w-4 h-4 sm:hidden" />
                <span class="hidden sm:inline text-xs font-medium">{{ closingId === ann.id ? 'Encerrando...' : 'Encerrar' }}</span>
              </AppButton>

              <AppButton
                v-if="ann.status === 'closed'"
                variant="primary"
                size="sm"
                title="Reativar anúncio"
                @click="changeStatus(ann.id, 'active')"
              >
                <PhPlay class="w-4 h-4 sm:hidden" />
                <span class="hidden sm:inline text-xs font-medium">Reativar</span>
              </AppButton>
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
import { AppButton, AppBadge } from '@/components/ui'
import { useConfirm } from '@/composables/useConfirm'
import {
  PhSquaresFour, PhList, PhPackage,
  PhPencilSimple, PhCheckCircle, PhPause, PhPlay,
} from '@phosphor-icons/vue'
import type { Announcement, AnnouncementStatus } from '@/types/app.types'

const authStore = useAuthStore()
const condominiumStore = useCondominiumStore()
const { fetchMyAnnouncements, updateAnnouncementStatus, closeAnnouncement } = useAnnouncements()

const condominiumSlug = computed(() => condominiumStore.current?.slug ?? '')
const announcements = ref<Announcement[]>([])
const loading = ref(true)
const closingId = ref<string | null>(null)
const viewMode = useLocalStorage<'grid' | 'list'>('condomiinus_myads_viewmode', 'grid')
const { confirm } = useConfirm()

async function loadAnnouncements() {
  if (!authStore.user) return
  loading.value = true
  try { announcements.value = await fetchMyAnnouncements(authStore.user.id) }
  finally { loading.value = false }
}

async function changeStatus(id: string, s: AnnouncementStatus) {
  try {
    const ann = announcements.value.find(a => a.id === id)
    if (ann) ann.status = s
    await updateAnnouncementStatus(id, s)
  } catch {
    await loadAnnouncements()
  }
}

async function handleClose(id: string) {
  const ann = announcements.value.find(a => a.id === id)
  const title = ann?.title ?? 'este anúncio'
  const ok = await confirm({
    title: `Encerrar "${title}"?`,
    description: 'Isso irá excluir todas as imagens, apagar as conversas e remover o anúncio permanentemente. Esta ação não pode ser desfeita.',
    confirmLabel: 'Encerrar definitivamente',
    variant: 'danger',
  })
  if (!ok) return
  closingId.value = id
  try {
    await closeAnnouncement(id)
    announcements.value = announcements.value.filter(a => a.id !== id)
  } catch { /* silent */ }
  finally { closingId.value = null }
}

function formatStatus(status: string) {
  return { active: 'Ativo', sold: 'Encerrado', closed: 'Pausado', hidden: 'Oculto' }[status] ?? status
}

function statusBadgeClass(status: string): string {
  return { active: 'bg-emerald-500/90', sold: 'bg-gray-500/80 text-white', closed: 'bg-amber-500/90' }[status] ?? 'bg-black/60'
}

function statusBadgeVariant(status: string): 'green' | 'gray' | 'amber' {
  return { active: 'green', sold: 'gray', closed: 'amber' }[status] as 'green' | 'gray' | 'amber' ?? 'gray'
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr))
}

onMounted(() => { loadAnnouncements() })
</script>
