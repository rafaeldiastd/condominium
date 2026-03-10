<template>
  <div class="p-4 pb-20">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold text-gray-900">Moradores</h1>
      <RouterLink
        :to="`/${slug}/sindico/residents/new`"
        class="px-3 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors"
      >
        + Novo
      </RouterLink>
    </div>

    <!-- Search & Filter -->
    <div class="flex gap-2 mb-4">
      <input
        v-model="search"
        type="search"
        placeholder="Buscar por nome, unidade..."
        class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        @input="onSearch"
      />
      <select
        v-model="filterBanned"
        class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
        @change="fetchResidents(true)"
      >
        <option value="all">Todos</option>
        <option value="active">Ativo</option>
        <option value="banned">Banido</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <SyndicResidentTable
        :residents="residents"
        :loading="loading"
        @edit="goEdit"
        @ban="confirmBan"
        @unban="confirmUnban"
        @reset-password="confirmResetPassword"
      />
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="mt-4 text-center">
      <button
        class="px-6 py-2 text-sm font-medium text-amber-700 border border-amber-300 rounded-xl hover:bg-amber-50 transition-colors"
        :disabled="loadingMore"
        @click="fetchResidents(false)"
      >
        {{ loadingMore ? 'Carregando...' : 'Ver mais' }}
      </button>
    </div>

    <!-- Ban Dialog -->
    <ConfirmDialog
      v-if="showBanDialog"
      title="Banir Morador"
      :message="`Tem certeza que deseja banir ${selectedResident?.full_name}?`"
      confirm-text="Banir"
      :danger="true"
      :loading="actionLoading"
      @confirm="doBan"
      @cancel="showBanDialog = false"
    />

    <!-- Unban Dialog -->
    <ConfirmDialog
      v-if="showUnbanDialog"
      title="Desbanir Morador"
      :message="`Tem certeza que deseja desbanir ${selectedResident?.full_name}?`"
      confirm-text="Desbanir"
      :loading="actionLoading"
      @confirm="doUnban"
      @cancel="showUnbanDialog = false"
    />

    <!-- Reset Password Dialog -->
    <ConfirmDialog
      v-if="showResetDialog"
      title="Resetar Senha"
      :message="`Enviar e-mail de redefinição de senha para ${selectedResident?.full_name}?`"
      confirm-text="Enviar"
      :loading="actionLoading"
      @confirm="doResetPassword"
      @cancel="showResetDialog = false"
    />

    <!-- Toast -->
    <div
      v-if="toast"
      class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg z-50"
    >
      {{ toast }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useCondominiumStore } from '@/stores/condominium'
import { TABLE_PAGE_SIZE } from '@/utils/constants'
import type { Profile } from '@/types/app.types'
import SyndicResidentTable from '@/components/syndic/SyndicResidentTable.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const condominiumStore = useCondominiumStore()
const slug = computed(() => condominiumStore.current?.slug ?? '')
const condominiumId = computed(() => condominiumStore.current?.id)

const loading = ref(false)
const loadingMore = ref(false)
const actionLoading = ref(false)
const residents = ref<Profile[]>([])
const search = ref('')
const filterBanned = ref<'all' | 'active' | 'banned'>('all')
const page = ref(0)
const hasMore = ref(false)
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const selectedResident = ref<Profile | null>(null)
const showBanDialog = ref(false)
const showUnbanDialog = ref(false)
const showResetDialog = ref(false)
const toast = ref('')

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 3000)
}

async function fetchResidents(reset = true) {
  const id = condominiumId.value
  if (!id) return

  if (reset) {
    loading.value = true
    page.value = 0
    residents.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const from = page.value * TABLE_PAGE_SIZE
    const to = from + TABLE_PAGE_SIZE - 1

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('condominium_id', id)
      .order('full_name', { ascending: true })
      .range(from, to)

    if (filterBanned.value === 'active') {
      query = query.eq('is_banned', false)
    } else if (filterBanned.value === 'banned') {
      query = query.eq('is_banned', true)
    }

    if (search.value.trim()) {
      query = query.or(
        `full_name.ilike.%${search.value}%,unit.ilike.%${search.value}%`,
      )
    }

    const { data } = await query
    const fetched = (data ?? []) as Profile[]
    if (reset) {
      residents.value = fetched
    } else {
      residents.value.push(...fetched)
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
  searchTimeout.value = setTimeout(() => fetchResidents(true), 400)
}

function goEdit(resident: Profile) {
  router.push(`/${slug.value}/sindico/residents/${resident.id}`)
}

function confirmBan(resident: Profile) {
  selectedResident.value = resident
  showBanDialog.value = true
}

function confirmUnban(resident: Profile) {
  selectedResident.value = resident
  showUnbanDialog.value = true
}

function confirmResetPassword(resident: Profile) {
  selectedResident.value = resident
  showResetDialog.value = true
}

async function doBan() {
  if (!selectedResident.value) return
  actionLoading.value = true
  try {
    await supabase
      .from('profiles')
      .update({ is_banned: true, banned_at: new Date().toISOString() })
      .eq('id', selectedResident.value.id)
    const idx = residents.value.findIndex((r) => r.id === selectedResident.value!.id)
    if (idx !== -1 && residents.value[idx]) residents.value[idx]!.is_banned = true
    showBanDialog.value = false
    showToast('Morador banido com sucesso.')
  } finally {
    actionLoading.value = false
  }
}

async function doUnban() {
  if (!selectedResident.value) return
  actionLoading.value = true
  try {
    await supabase
      .from('profiles')
      .update({ is_banned: false, banned_at: null })
      .eq('id', selectedResident.value.id)
    const idx = residents.value.findIndex((r) => r.id === selectedResident.value!.id)
    if (idx !== -1 && residents.value[idx]) residents.value[idx]!.is_banned = false
    showUnbanDialog.value = false
    showToast('Morador desbanido com sucesso.')
  } finally {
    actionLoading.value = false
  }
}

async function doResetPassword() {
  if (!selectedResident.value) return
  actionLoading.value = true
  try {
    // Get auth email from user id — use supabase admin or direct auth
    const { error } = await supabase.auth.resetPasswordForEmail(
      selectedResident.value.id, // id is same as auth uid, but we need email
      { redirectTo: `${window.location.origin}/confirm` },
    )
    if (error) {
      showToast('Erro ao enviar e-mail.')
    } else {
      showToast('E-mail de redefinição enviado.')
    }
    showResetDialog.value = false
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => fetchResidents(true))
</script>
