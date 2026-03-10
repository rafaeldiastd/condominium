<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/admin/users" class="text-gray-400 hover:text-gray-600 text-sm">
        ← Usuários
      </RouterLink>
      <span class="text-gray-300">/</span>
      <h1 class="text-xl font-bold text-gray-900">Detalhe do Usuário</h1>
    </div>

    <div v-if="loading" class="bg-white rounded-xl shadow-sm p-8 text-center text-sm text-gray-400">
      Carregando...
    </div>

    <div v-else-if="!profile" class="bg-white rounded-xl shadow-sm p-8 text-center text-sm text-gray-400">
      Usuário não encontrado.
    </div>

    <div v-else class="space-y-4">
      <!-- Perfil card -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img v-if="profile.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" alt="" />
            <span v-else class="text-2xl font-bold text-gray-500">
              {{ profile.full_name.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center flex-wrap gap-2">
              <h2 class="text-lg font-bold text-gray-900">{{ profile.full_name }}</h2>
              <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {{ ROLE_LABELS[profile.role] }}
              </span>
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="profile.is_banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
              >
                {{ profile.is_banned ? 'Banido' : 'Ativo' }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1">ID: {{ profile.id }}</p>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-xs text-gray-400 uppercase font-medium">Condomínio</p>
            <p class="mt-0.5 text-gray-900">{{ profile.condominium?.name ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase font-medium">Unidade</p>
            <p class="mt-0.5 text-gray-900">{{ profile.unit ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase font-medium">Telefone</p>
            <p class="mt-0.5 text-gray-900">{{ profile.phone ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase font-medium">Membro desde</p>
            <p class="mt-0.5 text-gray-900">{{ formatDate(profile.created_at) }}</p>
          </div>
          <div v-if="profile.is_banned && profile.banned_at">
            <p class="text-xs text-gray-400 uppercase font-medium">Banido em</p>
            <p class="mt-0.5 text-red-600">{{ formatDate(profile.banned_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Ações -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 class="text-sm font-semibold text-gray-800 mb-4">Ações</h3>
        <div class="flex flex-wrap gap-3">
          <button
            v-if="!profile.is_banned"
            class="text-sm px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
            :disabled="actionLoading"
            @click="handleBan"
          >
            {{ actionLoading ? 'Aguarde...' : 'Banir Usuário' }}
          </button>
          <button
            v-else
            class="text-sm px-4 py-2 rounded-lg border border-green-300 text-green-600 hover:bg-green-50 transition"
            :disabled="actionLoading"
            @click="handleUnban"
          >
            {{ actionLoading ? 'Aguarde...' : 'Remover Ban' }}
          </button>
          <button
            class="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            @click="handleResetPassword"
          >
            Resetar Senha
          </button>
        </div>
        <p v-if="actionMsg" class="mt-3 text-sm" :class="actionMsgError ? 'text-red-600' : 'text-green-600'">
          {{ actionMsg }}
        </p>
      </div>

      <!-- Anúncios do usuário -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-800">
            Anúncios
            <span class="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {{ announcements.length }}
            </span>
          </h3>
        </div>
        <div v-if="loadingAnnouncements" class="p-4 text-center text-sm text-gray-400">
          Carregando...
        </div>
        <ul v-else class="divide-y divide-gray-50">
          <li
            v-for="ann in announcements"
            :key="ann.id"
            class="flex items-center justify-between px-4 py-3 text-sm"
          >
            <div class="min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ ann.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(ann.created_at) }}</p>
            </div>
            <span
              class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
              :class="ann.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ ann.status }}
            </span>
          </li>
          <li v-if="!announcements.length" class="px-4 py-6 text-center text-sm text-gray-400">
            Nenhum anúncio publicado.
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAdmin } from '@/composables/useAdmin'
import { supabase } from '@/lib/supabase'
import { ROLE_LABELS } from '@/utils/constants'
import { formatDate } from '@/utils/formatters'
import type { Profile, Announcement } from '@/types/app.types'

const route = useRoute()
const { fetchUserById, banUser, unbanUser } = useAdmin()

const loading = ref(true)
const loadingAnnouncements = ref(false)
const actionLoading = ref(false)
const actionMsg = ref('')
const actionMsgError = ref(false)
const profile = ref<Profile | null>(null)
const announcements = ref<Announcement[]>([])

async function loadProfile() {
  loading.value = true
  try {
    profile.value = await fetchUserById(route.params.id as string)
    await loadAnnouncements()
  } finally {
    loading.value = false
  }
}

async function loadAnnouncements() {
  if (!profile.value) return
  loadingAnnouncements.value = true
  try {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, status, created_at')
      .eq('author_id', profile.value.id)
      .order('created_at', { ascending: false })
      .limit(20)
    announcements.value = (data ?? []) as Announcement[]
  } finally {
    loadingAnnouncements.value = false
  }
}

async function handleBan() {
  actionLoading.value = true
  actionMsg.value = ''
  try {
    await banUser(profile.value!.id)
    await loadProfile()
    actionMsg.value = 'Usuário banido com sucesso.'
    actionMsgError.value = false
  } catch {
    actionMsg.value = 'Erro ao banir usuário.'
    actionMsgError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function handleUnban() {
  actionLoading.value = true
  actionMsg.value = ''
  try {
    await unbanUser(profile.value!.id)
    await loadProfile()
    actionMsg.value = 'Ban removido com sucesso.'
    actionMsgError.value = false
  } catch {
    actionMsg.value = 'Erro ao remover ban.'
    actionMsgError.value = true
  } finally {
    actionLoading.value = false
  }
}

async function handleResetPassword() {
  actionMsg.value = 'Função de reset de senha disponível via painel Supabase.'
  actionMsgError.value = false
}

onMounted(loadProfile)
</script>
