<template>
  <div>
    <AnnouncementFilters
      v-model:model-search="searchQuery"
      v-model:model-type="typeFilter"
    />

    <div class="px-4 pt-4">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Todos os anúncios</h2>

      <div v-if="loading && announcements.length === 0" class="grid grid-cols-2 gap-3">
        <div v-for="i in 6" :key="i" class="animate-pulse aspect-square bg-gray-200 rounded-2xl"></div>
      </div>

      <div v-else-if="announcements.length" class="grid grid-cols-2 gap-3">
        <AnnouncementCard v-for="ann in announcements" :key="ann.id" :announcement="ann" />
      </div>

      <EmptyState v-else-if="!loading" :icon="PhEnvelopeOpen" title="Nenhum anúncio" description="Nenhum resultado encontrado." />

      <div v-if="announcements.length && hasMore" class="py-4 flex justify-center">
        <button @click="loadMore" :disabled="loading" class="px-6 py-2 border border-gray-300 rounded-xl text-sm disabled:opacity-50">
          {{ loading ? 'Carregando...' : 'Carregar mais' }}
        </button>
      </div>
      <div class="h-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAnnouncements } from '@/composables/useAnnouncements'
import { useFavorites } from '@/composables/useFavorites'
import AnnouncementCard from '@/components/announcement/AnnouncementCard.vue'
import AnnouncementFilters from '@/components/announcement/AnnouncementFilters.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { PhEnvelopeOpen } from '@phosphor-icons/vue'
import type { Announcement, AnnouncementType } from '@/types/app.types'

const { fetchFeed, loading, hasMore } = useAnnouncements()
const { loadFavoriteIds } = useFavorites()

const announcements = ref<Announcement[]>([])
const currentPage = ref(1)
const searchQuery = ref('')
const typeFilter = ref<AnnouncementType | 'all'>('all')

let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(resetAndLoad, 350)
})
watch(typeFilter, resetAndLoad)

function resetAndLoad() {
  currentPage.value = 1
  announcements.value = []
  load()
}

async function load() {
  const results = await fetchFeed({ type: typeFilter.value, search: searchQuery.value || undefined, page: currentPage.value })
  if (currentPage.value === 1) announcements.value = results
  else announcements.value.push(...results)
}

async function loadMore() {
  currentPage.value++
  await load()
}

onMounted(async () => {
  await Promise.all([load(), loadFavoriteIds()])
})
</script>
