<template>
  <div class="p-4 pb-20">
    <!-- Back -->
    <button
      class="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-gray-700"
      @click="router.back()"
    >
      ← Voltar
    </button>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div class="h-32 bg-gray-100 rounded-xl animate-pulse" />
      <div class="h-48 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <!-- Not Found -->
    <EmptyState
      v-else-if="!report"
      :icon="PhMagnifyingGlass"
      title="Denúncia não encontrada"
      description="A denúncia não existe ou foi removida."
    />

    <template v-else>
      <!-- Report Info -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div class="flex items-start justify-between gap-2 mb-3">
          <h1 class="text-base font-bold text-gray-900">
            {{ REPORT_REASON_LABELS[report.reason] }}
          </h1>
          <span
            class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            :class="statusClass"
          >
            {{ statusLabel }}
          </span>
        </div>

        <p v-if="report.description" class="text-sm text-gray-600 mb-3">
          {{ report.description }}
        </p>

        <div class="text-xs text-gray-400 space-y-1">
          <p v-if="report.reporter">
            Denunciante: <span class="text-gray-600 font-medium">{{ report.reporter.full_name }}</span>
          </p>
          <p>Data: {{ formatDateTime(report.created_at) }}</p>
        </div>
      </div>

      <!-- Announcement Info -->
      <div v-if="report.announcement" class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Anúncio Denunciado</h2>

        <!-- Thumbnail -->
        <div v-if="coverImage" class="w-full h-40 rounded-lg overflow-hidden mb-3 bg-gray-100">
          <img :src="coverImage" class="w-full h-full object-cover" alt="" />
        </div>

        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <AnnouncementBadge :type="report.announcement.type" />
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :class="announcementStatusClass"
            >
              {{ announcementStatusLabel }}
            </span>
          </div>

          <p class="text-sm font-semibold text-gray-900">{{ report.announcement.title }}</p>
          <p v-if="report.announcement.description" class="text-sm text-gray-600 line-clamp-3">
            {{ report.announcement.description }}
          </p>

          <div class="text-xs text-gray-400">
            <p v-if="report.announcement.author">
              Autor: <span class="text-gray-600">{{ report.announcement.author.full_name }}</span>
            </p>
            <p>Publicado: {{ formatDate(report.announcement.created_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-2">
        <h2 class="text-sm font-semibold text-gray-700">Ações</h2>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-if="report.announcement && report.announcement.status !== 'hidden'"
            class="py-3 px-4 rounded-xl text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
            :disabled="actionLoading"
            @click="hideAnnouncement"
          >
            <PhEyeSlash class="w-5 h-5" /> Ocultar Anúncio
          </button>

          <button
            v-if="report.announcement && report.announcement.status !== 'deleted'"
            class="py-3 px-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            :disabled="actionLoading"
            @click="showDeleteDialog = true"
          >
            <PhTrash class="w-5 h-5" /> Excluir Anúncio
          </button>

          <button
            v-if="report.reporter && !report.reporter.is_banned"
            class="py-3 px-4 rounded-xl text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors col-span-full sm:col-span-1 flex items-center justify-center gap-2"
            :disabled="actionLoading"
            @click="showBanDialog = true"
          >
            <PhProhibit class="w-5 h-5" /> Banir Usuário
          </button>

          <button
            v-if="report.status !== 'dismissed'"
            class="py-3 px-4 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors col-span-full sm:col-span-1 flex items-center justify-center gap-2"
            :disabled="actionLoading"
            @click="dismissReport"
          >
            <PhCheckCircle class="w-5 h-5" /> Descartar Denúncia
          </button>
        </div>
      </div>
    </template>

    <!-- Delete Announcement Dialog -->
    <ConfirmDialog
      v-if="showDeleteDialog"
      title="Excluir Anúncio"
      message="Tem certeza que deseja excluir este anúncio? Esta ação marcará o anúncio como deletado."
      confirm-text="Excluir"
      :danger="true"
      :loading="actionLoading"
      @confirm="deleteAnnouncement"
      @cancel="showDeleteDialog = false"
    />

    <!-- Ban User Dialog -->
    <div
      v-if="showBanDialog"
      class="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
        <h3 class="text-lg font-bold text-gray-900">Banir Usuário</h3>
        <p class="text-sm text-gray-500">
          Informe o motivo do banimento de
          <strong>{{ report?.reporter?.full_name }}</strong>.
        </p>
        <textarea
          v-model="banReason"
          placeholder="Motivo do banimento..."
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
          rows="3"
        />
        <div class="flex gap-3">
          <button
            class="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            @click="showBanDialog = false"
          >
            Cancelar
          </button>
          <button
            class="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
            :disabled="actionLoading"
            @click="banUser"
          >
            {{ actionLoading ? 'Aguarde...' : 'Banir' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import type { Report, AnnouncementStatus } from '@/types/app.types'
import { REPORT_REASON_LABELS } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/formatters'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AnnouncementBadge from '@/components/announcement/AnnouncementBadge.vue'
import { PhEyeSlash, PhTrash, PhProhibit, PhCheckCircle, PhMagnifyingGlass } from '@phosphor-icons/vue'

const route = useRoute()
const router = useRouter()
const reportId = computed(() => route.params.reportId as string)

const loading = ref(true)
const actionLoading = ref(false)
const report = ref<Report | null>(null)
const showDeleteDialog = ref(false)
const showBanDialog = ref(false)
const banReason = ref('')

const coverImage = computed(() => {
  const images = report.value?.announcement?.images
  if (!images || images.length === 0) return null
  return images.find((img) => img.is_cover)?.url ?? images[0]?.url ?? null
})

const statusClass = computed(() => {
  if (!report.value) return ''
  return ({
    pending: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-600',
  })[report.value.status]
})

const statusLabel = computed(() => {
  if (!report.value) return ''
  return ({
    pending: 'Pendente',
    reviewed: 'Revisado',
    dismissed: 'Ignorado',
  })[report.value.status]
})

const announcementStatusClass = computed(() => {
  const status = report.value?.announcement?.status as AnnouncementStatus | undefined
  if (!status) return ''
  return ({
    active: 'bg-green-100 text-green-700',
    sold: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-600',
    hidden: 'bg-yellow-100 text-yellow-700',
    deleted: 'bg-red-100 text-red-700',
  })[status] ?? 'bg-gray-100 text-gray-600'
})

const announcementStatusLabel = computed(() => {
  const status = report.value?.announcement?.status as AnnouncementStatus | undefined
  if (!status) return ''
  return ({
    active: 'Ativo',
    sold: 'Vendido',
    closed: 'Encerrado',
    hidden: 'Oculto',
    deleted: 'Deletado',
  })[status] ?? status
})

async function loadReport() {
  loading.value = true
  try {
    const { data } = await supabase
      .from('reports')
      .select(`
        *,
        announcement:announcements(*, author:profiles!author_id(id, full_name), images:announcement_images(*)),
        reporter:profiles!reporter_id(id, full_name, avatar_url, is_banned)
      `)
      .eq('id', reportId.value)
      .single()
    report.value = data as Report | null
  } finally {
    loading.value = false
  }
}

async function markReportReviewed() {
  await supabase
    .from('reports')
    .update({ status: 'reviewed' })
    .eq('id', reportId.value)
  if (report.value) report.value.status = 'reviewed'
}

async function hideAnnouncement() {
  if (!report.value?.announcement) return
  actionLoading.value = true
  try {
    await supabase
      .from('announcements')
      .update({ status: 'hidden' })
      .eq('id', report.value.announcement.id)
    if (report.value.announcement) report.value.announcement.status = 'hidden'
    await markReportReviewed()
  } finally {
    actionLoading.value = false
  }
}

async function deleteAnnouncement() {
  if (!report.value?.announcement) return
  actionLoading.value = true
  try {
    await supabase
      .from('announcements')
      .update({ status: 'deleted' })
      .eq('id', report.value.announcement.id)
    if (report.value.announcement) report.value.announcement.status = 'deleted'
    await markReportReviewed()
    showDeleteDialog.value = false
  } finally {
    actionLoading.value = false
  }
}

async function banUser() {
  if (!report.value?.reporter) return
  actionLoading.value = true
  try {
    await supabase
      .from('profiles')
      .update({ is_banned: true, banned_at: new Date().toISOString() })
      .eq('id', report.value.reporter.id)
    if (report.value.reporter) report.value.reporter.is_banned = true
    await markReportReviewed()
    showBanDialog.value = false
    banReason.value = ''
  } finally {
    actionLoading.value = false
  }
}

async function dismissReport() {
  if (!report.value) return
  actionLoading.value = true
  try {
    await supabase
      .from('reports')
      .update({ status: 'dismissed' })
      .eq('id', reportId.value)
    report.value.status = 'dismissed'
  } finally {
    actionLoading.value = false
  }
}

onMounted(loadReport)
</script>
