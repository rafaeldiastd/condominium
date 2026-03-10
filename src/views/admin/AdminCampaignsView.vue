<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Campanhas</h1>
      <RouterLink
        to="/admin/campaigns/new"
        class="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Nova Campanha
      </RouterLink>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-sm text-gray-400">Carregando...</div>
      <div v-else-if="!campaigns.length" class="p-8 text-center text-sm text-gray-400">
        Nenhuma campanha cadastrada.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="border-collapse w-full text-sm">
          <thead>
            <tr class="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wide">
              <th class="py-3 px-4 text-left">Imagem</th>
              <th class="py-3 px-4 text-left">Título</th>
              <th class="py-3 px-4 text-left">Período</th>
              <th class="py-3 px-4 text-left">Status</th>
              <th class="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in campaigns"
              :key="c.id"
              class="hover:bg-gray-50 transition"
            >
              <td class="py-3 px-4 border-b border-gray-100">
                <div class="w-16 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  <img
                    v-if="c.image_url"
                    :src="c.image_url"
                    class="w-full h-full object-cover"
                    alt=""
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    sem img
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 border-b border-gray-100">
                <p class="font-medium text-gray-900">{{ c.title }}</p>
                <p v-if="c.target_url" class="text-xs text-gray-400 truncate max-w-xs">
                  {{ c.target_url }}
                </p>
              </td>
              <td class="py-3 px-4 border-b border-gray-100 text-gray-500 text-xs">
                <p>{{ formatDate(c.starts_at) }}</p>
                <p>até {{ formatDate(c.ends_at) }}</p>
              </td>
              <td class="py-3 px-4 border-b border-gray-100">
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="campaignStatusClass(c)"
                >
                  {{ campaignStatusLabel(c) }}
                </span>
              </td>
              <td class="py-3 px-4 border-b border-gray-100 text-right">
                <div class="flex items-center justify-end gap-3">
                  <RouterLink
                    :to="`/admin/campaigns/${c.id}`"
                    class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition"
                  >
                    <PhPencilSimple class="w-3.5 h-3.5" /> Editar
                  </RouterLink>
                  <button
                    class="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition disabled:opacity-50"
                    :disabled="deleting === c.id"
                    @click="askDelete(c.id)"
                  >
                    <PhTrash v-if="deleting !== c.id" class="w-3.5 h-3.5" />
                    <span>{{ deleting === c.id ? '...' : 'Excluir' }}</span>
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

    <!-- Confirm delete dialog -->
    <ConfirmDialog
      v-if="confirmDeleteId"
      title="Excluir Campanha"
      message="Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita."
      confirm-text="Excluir"
      :danger="true"
      :loading="deleting === confirmDeleteId"
      @confirm="doDelete"
      @cancel="confirmDeleteId = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdmin } from '@/composables/useAdmin'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { TABLE_PAGE_SIZE } from '@/utils/constants'
import { formatDate } from '@/utils/formatters'
import type { Campaign } from '@/types/app.types'
import { PhPencilSimple, PhTrash } from '@phosphor-icons/vue'

const { campaigns, loading, total, fetchCampaigns, deleteCampaign } = useAdmin()

const currentPage = ref(1)
const deleting = ref<string | null>(null)
const confirmDeleteId = ref<string | null>(null)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / TABLE_PAGE_SIZE)))

function campaignStatusLabel(c: Campaign): string {
  const now = new Date()
  const start = new Date(c.starts_at)
  const end = new Date(c.ends_at)
  if (now < start) return 'Futura'
  if (now > end) return 'Expirada'
  return 'Ativa'
}

function campaignStatusClass(c: Campaign): string {
  const label = campaignStatusLabel(c)
  if (label === 'Ativa') return 'bg-green-100 text-green-700'
  if (label === 'Futura') return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-600'
}

async function loadPage(page: number) {
  currentPage.value = page
  await fetchCampaigns(page)
}

function askDelete(id: string) {
  confirmDeleteId.value = id
}

async function doDelete() {
  if (!confirmDeleteId.value) return
  deleting.value = confirmDeleteId.value
  try {
    await deleteCampaign(confirmDeleteId.value)
    confirmDeleteId.value = null
    await loadPage(currentPage.value)
  } finally {
    deleting.value = null
  }
}

onMounted(() => loadPage(1))
</script>
