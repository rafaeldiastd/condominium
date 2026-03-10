<template>
  <div class="overflow-x-auto">
    <div v-if="loading" class="p-8 text-center text-sm text-gray-400">Carregando...</div>
    <table v-else class="border-collapse w-full text-sm">
      <thead>
        <tr class="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wide">
          <th class="py-3 px-4 text-left">Usuário</th>
          <th class="py-3 px-4 text-left">Condomínio</th>
          <th class="py-3 px-4 text-left">Papel</th>
          <th class="py-3 px-4 text-left">Status</th>
          <th class="py-3 px-4 text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="user in users"
          :key="user.id"
          class="hover:bg-gray-50 transition cursor-pointer"
          @click="$emit('view', user)"
        >
          <td class="py-3 px-4 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="user.avatar_url" :src="user.avatar_url" class="w-full h-full object-cover" alt="" />
                <span v-else class="text-xs font-bold text-gray-500">
                  {{ user.full_name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="min-w-0">
                <p class="font-medium text-gray-900 truncate">{{ user.full_name }}</p>
                <p v-if="user.unit" class="text-xs text-gray-400">Unidade {{ user.unit }}</p>
              </div>
            </div>
          </td>
          <td class="py-3 px-4 border-b border-gray-100 text-gray-500">
            {{ user.condominium?.name ?? '—' }}
          </td>
          <td class="py-3 px-4 border-b border-gray-100">
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="roleClass(user.role)"
            >
              {{ ROLE_LABELS[user.role] }}
            </span>
          </td>
          <td class="py-3 px-4 border-b border-gray-100">
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :class="user.is_banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
            >
              {{ user.is_banned ? 'Banido' : 'Ativo' }}
            </span>
          </td>
          <td class="py-3 px-4 border-b border-gray-100 text-right" @click.stop>
            <div class="flex items-center justify-end gap-3">
              <RouterLink
                :to="`/admin/users/${user.id}`"
                class="text-xs text-blue-600 hover:underline"
              >
                Ver
              </RouterLink>
              <button
                v-if="!user.is_banned"
                class="text-xs text-red-500 hover:underline"
                @click="$emit('ban', user)"
              >
                Banir
              </button>
              <button
                v-else
                class="text-xs text-green-600 hover:underline"
                @click="$emit('unban', user)"
              >
                Desbanir
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!users.length">
          <td colspan="5" class="py-8 px-4 text-center text-gray-400">Nenhum usuário encontrado.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Profile, UserRole } from '@/types/app.types'
import { ROLE_LABELS } from '@/utils/constants'

defineProps<{ users: Profile[]; loading?: boolean }>()
defineEmits<{
  view: [user: Profile]
  ban: [user: Profile]
  unban: [user: Profile]
}>()

function roleClass(role: UserRole): string {
  if (role === 'super_admin') return 'bg-indigo-100 text-indigo-700'
  if (role === 'syndic') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-600'
}
</script>
