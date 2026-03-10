<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
    <p class="text-gray-500 mt-1 text-sm">Bem-vindo ao painel administrativo do Condomiinus.</p>

    <!-- Stats cards -->
    <div class="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in statsCards"
        :key="stat.label"
        class="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      >
        <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">{{ stat.label }}</p>
        <p class="text-3xl font-bold text-gray-900 mt-2">
          {{ loading ? '—' : stat.value }}
        </p>
        <p class="text-xs mt-1" :class="stat.colorClass">{{ stat.sub }}</p>
      </div>
    </div>

    <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Últimos condomínios -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-800">Últimos Condomínios</h2>
          <RouterLink to="/admin/condominiums" class="text-xs text-blue-600 hover:underline">
            Ver todos
          </RouterLink>
        </div>
        <div v-if="loading" class="p-4 text-center text-sm text-gray-400">Carregando...</div>
        <ul v-else class="divide-y divide-gray-50">
          <li
            v-for="c in recentCondominiums"
            :key="c.id"
            class="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span class="text-xs font-bold text-indigo-600">
                  {{ c.name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ c.name }}</p>
                <p class="text-xs text-gray-400 truncate">{{ c.slug }}</p>
              </div>
            </div>
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2"
              :class="c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
            >
              {{ c.is_active ? 'Ativo' : 'Inativo' }}
            </span>
          </li>
          <li v-if="!recentCondominiums.length" class="px-4 py-6 text-center text-sm text-gray-400">
            Nenhum condomínio cadastrado.
          </li>
        </ul>
      </div>

      <!-- Últimos usuários -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-800">Últimos Usuários</h2>
          <RouterLink to="/admin/users" class="text-xs text-blue-600 hover:underline">
            Ver todos
          </RouterLink>
        </div>
        <div v-if="loading" class="p-4 text-center text-sm text-gray-400">Carregando...</div>
        <ul v-else class="divide-y divide-gray-50">
          <li
            v-for="u in recentUsers"
            :key="u.id"
            class="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img v-if="u.avatar_url" :src="u.avatar_url" class="w-full h-full object-cover" alt="" />
                <span v-else class="text-xs font-bold text-gray-500">
                  {{ u.full_name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ u.full_name }}</p>
                <p class="text-xs text-gray-400 truncate">{{ u.condominium?.name ?? 'Sem condomínio' }}</p>
              </div>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0 ml-2">
              {{ ROLE_LABELS[u.role] }}
            </span>
          </li>
          <li v-if="!recentUsers.length" class="px-4 py-6 text-center text-sm text-gray-400">
            Nenhum usuário registrado.
          </li>
        </ul>
      </div>
    </div>

    <!-- Atividade recente -->
    <div class="mt-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="px-4 py-3 border-b border-gray-100">
        <h2 class="text-sm font-semibold text-gray-800">Atividade Recente</h2>
      </div>
      <ul class="divide-y divide-gray-50">
        <li
          v-for="item in recentActivity"
          :key="item.id"
          class="flex items-start gap-3 px-4 py-3"
        >
          <div
            class="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
            :class="item.colorClass"
          >
            {{ item.icon }}
          </div>
          <div>
            <p class="text-sm text-gray-800">{{ item.text }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ item.time }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdmin } from '@/composables/useAdmin'
import { ROLE_LABELS } from '@/utils/constants'

const { loading, globalStats, fetchGlobalStats, fetchCondominiums, fetchUsers, condominiums, users } = useAdmin()

const recentCondominiums = computed(() => condominiums.value.slice(0, 5))
const recentUsers = computed(() => users.value.slice(0, 5))

const statsCards = computed(() => [
  {
    label: 'Total Condomínios',
    value: globalStats.value.totalCondominiums,
    sub: 'cadastrados',
    colorClass: 'text-indigo-500',
  },
  {
    label: 'Total Usuários',
    value: globalStats.value.totalUsers,
    sub: 'registrados',
    colorClass: 'text-blue-500',
  },
  {
    label: 'Denúncias Pendentes',
    value: globalStats.value.pendingReports,
    sub: 'aguardando revisão',
    colorClass: globalStats.value.pendingReports > 0 ? 'text-red-500' : 'text-gray-400',
  },
  {
    label: 'Anúncios Ativos',
    value: globalStats.value.activeAnnouncements,
    sub: 'no momento',
    colorClass: 'text-green-500',
  },
])

const recentActivity = ref([
  { id: 1, icon: '🏢', text: 'Painel administrativo inicializado', time: 'Agora', colorClass: 'bg-indigo-100 text-indigo-600' },
  { id: 2, icon: '✓', text: 'Sistema de autenticação ativo', time: 'Sistema', colorClass: 'bg-green-100 text-green-600' },
  { id: 3, icon: '📋', text: 'Banco de dados conectado', time: 'Sistema', colorClass: 'bg-blue-100 text-blue-600' },
])

onMounted(async () => {
  await Promise.all([
    fetchGlobalStats(),
    fetchCondominiums(1),
    fetchUsers({ page: 1 }),
  ])
})
</script>
