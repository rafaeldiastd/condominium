<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2">
    <RouterLink
      :to="`/${slug}/sindico`"
      class="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg"
      :class="isActive('') ? 'text-amber-600' : 'text-gray-500'"
    >
      <LayoutDashboardIcon :weight="isActive('') ? 'fill' : 'regular'" class="w-6 h-6" />
      <span class="text-xs">Dashboard</span>
    </RouterLink>

    <RouterLink
      :to="`/${slug}/sindico/reports`"
      class="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg relative"
      :class="isActive('reports') ? 'text-amber-600' : 'text-gray-500'"
    >
      <FlagIcon :weight="isActive('reports') ? 'fill' : 'regular'" class="w-6 h-6" />
      <span class="text-xs">Denúncias</span>
      <span
        v-if="pendingReports > 0"
        class="absolute top-0 right-2 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center"
      >
        {{ pendingReports > 9 ? '9+' : pendingReports }}
      </span>
    </RouterLink>

    <RouterLink
      :to="`/${slug}/sindico/residents`"
      class="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg"
      :class="isActive('residents') ? 'text-amber-600' : 'text-gray-500'"
    >
      <UsersIcon :weight="isActive('residents') ? 'fill' : 'regular'" class="w-6 h-6" />
      <span class="text-xs">Moradores</span>
    </RouterLink>

    <RouterLink
      :to="`/${slug}/sindico/announcements`"
      class="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg"
      :class="isActive('announcements') ? 'text-amber-600' : 'text-gray-500'"
    >
      <ListIcon :weight="isActive('announcements') ? 'bold' : 'regular'" class="w-6 h-6" />
      <span class="text-xs">Anúncios</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCondominiumStore } from '@/stores/condominium'
import {
  PhSquaresFour as LayoutDashboardIcon,
  PhFlag as FlagIcon,
  PhUsers as UsersIcon,
  PhList as ListIcon,
} from '@phosphor-icons/vue'

const route = useRoute()
const condominiumStore = useCondominiumStore()
const slug = computed(() => condominiumStore.current?.slug ?? '')
const pendingReports = ref(0) // será populado pelo store futuramente

function isActive(section: string): boolean {
  if (!section) {
    return route.path === `/${slug.value}/sindico`
  }
  return (route.path as string).includes(`/sindico/${section}`)
}
</script>
