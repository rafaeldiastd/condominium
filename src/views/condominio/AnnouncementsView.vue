<template>
  <div>
    <AnnouncementFilters
      v-model:model-search="searchQuery"
      v-model:model-type="typeFilter"
      v-model:model-date-from="dateFrom"
      v-model:model-date-to="dateTo"
      v-model:model-price-min="priceMin"
      v-model:model-price-max="priceMax"
      v-model:model-author-name="authorName"
    />

    <div class="px-4 pt-4">
      <h2 class="text-lg font-bold text-gray-900 mb-4">Todos os anúncios</h2>

      <div v-if="loading && announcements.length === 0" 
        class="grid gap-4"
        :class="viewMode === 'feed' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'"
      >
        <div v-for="i in 8" :key="i" class="animate-pulse bg-white rounded-2xl p-3 border border-gray-100">
          <div class="aspect-square bg-gray-100 rounded-xl mb-3"></div>
          <div class="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>
  
      <div v-else-if="announcements.length" 
        class="grid gap-4"
        :class="viewMode === 'feed' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'"
      >
        <AnnouncementCard v-for="ann in announcements" :key="ann.id" :announcement="ann" />
      </div>

      <EmptyState v-else-if="!loading" :icon="PhEnvelopeOpen" title="Nenhum anúncio" description="Nenhum resultado encontrado." />

      <!-- Infinite scroll sentinel -->
      <div v-if="announcements.length && hasMore" ref="loadMoreSentinel" class="py-12 flex justify-center">
        <div class="flex flex-col items-center gap-2">
          <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-gray-400 font-medium tracking-wide uppercase">Carregando mais</p>
        </div>
      </div>
      <div class="h-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useAnnouncements } from '@/composables/useAnnouncements'
import { useViewMode } from '@/composables/useViewMode'
import { useFavorites } from '@/composables/useFavorites'
import { useFeedFilters } from '@/composables/useFeedFilters'
import AnnouncementCard from '@/components/announcement/AnnouncementCard.vue'
import AnnouncementFilters from '@/components/announcement/AnnouncementFilters.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { PhEnvelopeOpen } from '@phosphor-icons/vue'
import type { Announcement, AnnouncementType } from '@/types/app.types'

const { fetchFeed, loading, hasMore } = useAnnouncements()
const { viewMode } = useViewMode()
const { loadFavoriteIds } = useFavorites()

const announcements = ref<Announcement[]>([])
const currentPage = ref(1)
// Filters
const {
  searchQuery,
  typeFilter,
  dateFrom,
  dateTo,
  priceMin,
  priceMax,
  authorName,
  filters
} = useFeedFilters()

watch(filters, resetAndLoad)

const loadMoreSentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function resetAndLoad() {
  currentPage.value = 1
  announcements.value = []
  load()
}

async function load() {
  const results = await fetchFeed({
    ...filters.value,
    page: currentPage.value
  })
  if (currentPage.value === 1) announcements.value = results
  else announcements.value.push(...results)
}

async function loadMore() {
  if (loading.value || !hasMore.value) return
  currentPage.value++
  await load()
}

function setupIntersectionObserver() {
  if (observer) observer.disconnect()

  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && hasMore.value && !loading.value) {
      loadMore()
    }
  }, {
    rootMargin: '200px'
  })

  if (loadMoreSentinel.value) {
    observer.observe(loadMoreSentinel.value)
  }
}

onMounted(async () => {
  setupIntersectionObserver()
  await Promise.all([load(), loadFavoriteIds()])
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>
