<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Síndicos</h1>
      <RouterLink
        to="/admin/syndics/new"
        class="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Novo Síndico
      </RouterLink>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-sm text-gray-400">Carregando...</div>
      <div v-else-if="!syndics.length" class="p-8 text-center text-sm text-gray-400">
        Nenhum síndico cadastrado.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="border-collapse w-full text-sm">
          <thead>
            <tr class="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wide">
              <th class="py-3 px-4 text-left">Síndico</th>
              <th class="py-3 px-4 text-left">Condomínio</th>
              <th class="py-3 px-4 text-left">Criado em</th>
              <th class="py-3 px-4 text-left">Status</th>
              <th class="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in syndics"
              :key="s.id"
              class="hover:bg-gray-50 transition"
            >
              <td class="py-3 px-4 border-b border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img v-if="s.avatar_url" :src="s.avatar_url" class="w-full h-full object-cover" alt="" />
                    <span v-else class="text-xs font-bold text-blue-600">
                      {{ s.full_name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <span class="font-medium text-gray-900">{{ s.full_name }}</span>
                </div>
              </td>
              <td class="py-3 px-4 border-b border-gray-100 text-gray-500">
                {{ s.condominium?.name ?? '—' }}
              </td>
              <td class="py-3 px-4 border-b border-gray-100 text-gray-500">
                {{ formatDate(s.created_at) }}
              </td>
              <td class="py-3 px-4 border-b border-gray-100">
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="s.is_banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
                >
                  {{ s.is_banned ? 'Banido' : 'Ativo' }}
                </span>
              </td>
              <td class="py-3 px-4 border-b border-gray-100 text-right">
                <RouterLink
                  :to="`/admin/users/${s.id}`"
                  class="text-xs text-blue-600 hover:underline"
                >
                  Ver Detalhes
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAdmin } from '@/composables/useAdmin'
import { formatDate } from '@/utils/formatters'

const { syndics, loading, fetchSyndics } = useAdmin()

onMounted(fetchSyndics)
</script>
