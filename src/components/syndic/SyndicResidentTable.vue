<template>
  <div>
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-14 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <!-- Desktop table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600 text-xs uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Nome</th>
            <th class="px-4 py-3 text-left hidden sm:table-cell">Unidade</th>
            <th class="px-4 py-3 text-left hidden md:table-cell">Telefone</th>
            <th class="px-4 py-3 text-left">Status</th>
            <th class="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="resident in residents" :key="resident.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm"
                >
                  <img
                    v-if="resident.avatar_url"
                    :src="resident.avatar_url"
                    class="w-full h-full object-cover"
                    alt=""
                  />
                  <span v-else>{{ resident.full_name.charAt(0).toUpperCase() }}</span>
                </div>
                <div>
                  <p class="font-medium text-gray-900 leading-tight">{{ resident.full_name }}</p>
                  <p class="text-xs text-gray-400 sm:hidden">{{ resident.unit ?? '—' }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-500 hidden sm:table-cell">
              {{ resident.unit ?? '—' }}
            </td>
            <td class="px-4 py-3 text-gray-500 hidden md:table-cell">
              {{ resident.phone ?? '—' }}
            </td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="resident.is_banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
              >
                {{ resident.is_banned ? 'Banido' : 'Ativo' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1 flex-wrap">
                <button
                  class="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  @click="$emit('edit', resident)"
                >
                  Editar
                </button>
                <button
                  v-if="!resident.is_banned"
                  class="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                  @click="$emit('ban', resident)"
                >
                  Banir
                </button>
                <button
                  v-else
                  class="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                  @click="$emit('unban', resident)"
                >
                  Desbanir
                </button>
                <button
                  class="text-xs px-2 py-1 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                  @click="$emit('reset-password', resident)"
                >
                  Senha
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="residents.length === 0">
            <td colspan="5" class="px-4 py-10 text-center text-sm text-gray-400">
              Nenhum morador encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Profile } from '@/types/app.types'

defineProps<{
  residents: Profile[]
  loading?: boolean
}>()

defineEmits<{
  ban: [resident: Profile]
  unban: [resident: Profile]
  'reset-password': [resident: Profile]
  edit: [resident: Profile]
}>()
</script>
