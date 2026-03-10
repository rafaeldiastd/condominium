<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Condomínios</h1>
      <RouterLink
        to="/admin/condominiums/new"
        class="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Novo Condomínio
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar por nome..."
        class="flex-1 min-w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        @input="onSearch"
      />
      <select
        v-model="statusFilter"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        @change="loadPage(1)"
      >
        <option value="">Todos os status</option>
        <option value="active">Ativos</option>
        <option value="inactive">Inativos</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-sm text-gray-400">Carregando...</div>
      <div v-else-if="!condominiums.length" class="p-8 text-center text-sm text-gray-400">
        Nenhum condomínio encontrado.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="border-collapse w-full text-sm">
          <thead>
            <tr class="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wide">
              <th class="py-3 px-4 text-left">Logo</th>
              <th class="py-3 px-4 text-left">Nome</th>
              <th class="py-3 px-4 text-left">Slug</th>
              <th class="py-3 px-4 text-left">Endereço</th>
              <th class="py-3 px-4 text-left">Status</th>
              <th class="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredCondominiums"
              :key="c.id"
              class="hover:bg-gray-50 transition"
            >
              <td class="py-3 px-4 border-b border-gray-100">
                <div class="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center overflow-hidden">
                  <img v-if="c.logo_url" :src="c.logo_url" class="w-full h-full object-cover" alt="" />
                  <span v-else class="text-sm font-bold text-indigo-600">
                    {{ c.name.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 border-b border-gray-100 font-medium text-gray-900">
                {{ c.name }}
              </td>
              <td class="py-3 px-4 border-b border-gray-100 text-gray-500 font-mono text-xs">
                {{ c.slug }}
              </td>
              <td class="py-3 px-4 border-b border-gray-100 text-gray-500">
                {{ [c.address, c.city, c.state].filter(Boolean).join(', ') || '—' }}
              </td>
              <td class="py-3 px-4 border-b border-gray-100">
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                >
                  {{ c.is_active ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-3 px-4 border-b border-gray-100 text-right">
                <div class="flex items-center justify-end gap-3">
                  <RouterLink
                    :to="`/admin/condominiums/${c.id}`"
                    class="text-xs text-blue-600 hover:underline"
                  >
                    Editar
                  </RouterLink>
                  <button
                    class="text-xs hover:underline"
                    :class="c.is_active ? 'text-red-500' : 'text-green-600'"
                    :disabled="toggling === c.id"
                    @click="handleToggle(c)"
                  >
                    {{ toggling === c.id ? '...' : (c.is_active ? 'Desativar' : 'Ativar') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600"
      >
        <span>Página {{ currentPage }} de {{ totalPages }}</span>
        <div class="flex gap-2">
          <button
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            @click="loadPage(currentPage - 1)"
          >
            Anterior
          </button>
          <button
            :disabled="currentPage === totalPages"
            class="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            @click="loadPage(currentPage + 1)"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdmin } from '@/composables/useAdmin'
import { TABLE_PAGE_SIZE } from '@/utils/constants'
import type { Condominium } from '@/types/app.types'

const { condominiums, loading, total, fetchCondominiums, toggleCondominiumActive } = useAdmin()

const search = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const toggling = ref<string | null>(null)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / TABLE_PAGE_SIZE)))

const filteredCondominiums = computed(() => {
  if (!statusFilter.value) return condominiums.value
  const active = statusFilter.value === 'active'
  return condominiums.value.filter((c) => c.is_active === active)
})

function onSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadPage(1), 400)
}

async function loadPage(page: number) {
  currentPage.value = page
  await fetchCondominiums(page, search.value)
}

async function handleToggle(c: Condominium) {
  toggling.value = c.id
  try {
    await toggleCondominiumActive(c.id, !c.is_active)
    await loadPage(currentPage.value)
  } finally {
    toggling.value = null
  }
}

onMounted(() => loadPage(1))
</script>
