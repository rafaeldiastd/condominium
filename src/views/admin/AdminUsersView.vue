<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Usuários</h1>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
      <input
        v-model="filters.search"
        type="text"
        placeholder="Buscar por nome ou email..."
        class="flex-1 min-w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        @input="onSearch"
      />
      <select
        v-model="filters.role"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        @change="loadPage(1)"
      >
        <option value="">Todos os papéis</option>
        <option value="resident">Morador</option>
        <option value="syndic">Síndico</option>
        <option value="super_admin">Administrador</option>
      </select>
      <select
        v-model="statusFilter"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        @change="loadPage(1)"
      >
        <option value="">Todos os status</option>
        <option value="active">Ativos</option>
        <option value="banned">Banidos</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <AdminUserTable
        :users="filteredUsers"
        :loading="loading"
        @view="goToDetail"
        @ban="handleBan"
        @unban="handleUnban"
      />

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
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminUserTable from '@/components/admin/AdminUserTable.vue'
import { useAdmin } from '@/composables/useAdmin'
import { TABLE_PAGE_SIZE } from '@/utils/constants'
import type { Profile } from '@/types/app.types'

const router = useRouter()
const { users, loading, total, fetchUsers, banUser, unbanUser } = useAdmin()

const filters = reactive({ search: '', role: '', condominiumId: '' })
const statusFilter = ref('')
const currentPage = ref(1)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / TABLE_PAGE_SIZE)))

const filteredUsers = computed(() => {
  if (!statusFilter.value) return users.value
  const banned = statusFilter.value === 'banned'
  return users.value.filter((u) => u.is_banned === banned)
})

function onSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadPage(1), 400)
}

async function loadPage(page: number) {
  currentPage.value = page
  await fetchUsers({
    page,
    search: filters.search || undefined,
    role: filters.role || undefined,
    condominiumId: filters.condominiumId || undefined,
  })
}

function goToDetail(user: Profile) {
  router.push(`/admin/users/${user.id}`)
}

async function handleBan(user: Profile) {
  await banUser(user.id)
  await loadPage(currentPage.value)
}

async function handleUnban(user: Profile) {
  await unbanUser(user.id)
  await loadPage(currentPage.value)
}

onMounted(() => loadPage(1))
</script>
