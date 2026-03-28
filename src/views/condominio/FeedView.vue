<template>
  <div>
    <div class="sticky top-14 z-30 bg-white shadow-sm border-b border-gray-100">
      <AnnouncementFilters
        v-model:model-search="searchQuery"
        v-model:model-type="typeFilter"
        v-model:model-date-from="dateFrom"
        v-model:model-date-to="dateTo"
        v-model:model-price-min="priceMin"
        v-model:model-price-max="priceMax"
        v-model:model-author-name="authorName"
      />
    </div>

    <!-- Featured Carousel (Paid Ads) -->
    <div v-if="featuredAnnouncements.length" class="mt-2">
      <FeaturedCarousel :announcements="featuredAnnouncements" />
    </div>

    <!-- Campaign banner -->
    <div v-if="activeCampaigns.length" class="px-4 pt-4">
      <a
        v-for="campaign in activeCampaigns"
        :key="campaign.id"
        :href="campaign.target_url || '#'"
        target="_blank"
        rel="noopener"
        class="block mb-2"
      >
        <div class="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 min-h-[80px] flex items-center">
          <img v-if="campaign.image_url" :src="campaign.image_url" class="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
          <div class="relative z-10">
            <p class="text-xs font-medium opacity-80 mb-0.5">Campanha</p>
            <p class="font-bold">{{ campaign.title }}</p>
            <p v-if="campaign.description" class="text-xs opacity-80 mt-0.5 line-clamp-1">{{ campaign.description }}</p>
          </div>
        </div>
      </a>
    </div>

    <!-- Feed grid -->
    <div class="px-4 pt-4">
      <!-- Loading skeletons -->
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

      <!-- Announcements grid -->
      <div v-else-if="announcements.length" 
        class="grid gap-4"
        :class="viewMode === 'feed' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'"
      >
        <AnnouncementCard
          v-for="ann in announcements"
          :key="ann.id"
          :announcement="ann"
        />
      </div>

      <!-- Empty state -->
      <EmptyState
        v-else-if="!loading"
        :icon="PhEnvelopeOpen"
        title="Nenhum anúncio encontrado"
        :description="searchQuery ? 'Tente outros termos de busca.' : 'Seja o primeiro a publicar um anúncio!'"
      >
        <RouterLink
          :to="`/${slug}/announcements/new`"
          class="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
        >
          Publicar anúncio
        </RouterLink>
      </EmptyState>

      <!-- Infinite scroll sentinel: always in DOM so IntersectionObserver can attach -->
      <div ref="loadMoreSentinel" class="py-8 flex justify-center">
        <div v-if="announcements.length && hasMore" class="flex flex-col items-center gap-2">
          <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-gray-400 font-medium tracking-wide uppercase">Carregando mais</p>
        </div>
      </div>

      <div class="h-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAnnouncements } from '@/composables/useAnnouncements'
import { useViewMode } from '@/composables/useViewMode'
import { useFavorites } from '@/composables/useFavorites'
import { useFollows } from '@/composables/useFollows'
import { useFeedFilters } from '@/composables/useFeedFilters'
import { useCondominiumStore } from '@/stores/condominium'
import AnnouncementCard from '@/components/announcement/AnnouncementCard.vue'
import AnnouncementFilters from '@/components/announcement/AnnouncementFilters.vue'
import FeaturedCarousel from '@/components/announcement/FeaturedCarousel.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { PhEnvelopeOpen } from '@phosphor-icons/vue'
import type { Announcement, AnnouncementType, Campaign } from '@/types/app.types'
import { isBusinessOpen } from '@/config/announcementTemplates'

const route = useRoute()
const condominiumStore = useCondominiumStore()
const { fetchFeed, fetchActiveCampaigns, fetchPaidAds, loading, hasMore } = useAnnouncements()
const { viewMode } = useViewMode()
const { loadFavoriteIds, favoriteIds } = useFavorites()
const { loadFollowingIds, followingIds } = useFollows()

const slug = computed(() => condominiumStore.current?.slug ?? (route.params.condominio as string))
const announcements = ref<Announcement[]>([])
const featuredAnnouncements = ref<Announcement[]>([])
const activeCampaigns = ref<Campaign[]>([])
const currentPage = ref(1)
// Author IDs de quem o usuário tem favoritos (carregado apenas na page 1)
const priorityAuthorIds = ref<Set<string>>(new Set())

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

watch(filters, () => {
  resetAndLoad()
})

const loadMoreSentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function resetAndLoad() {
  currentPage.value = 1
  announcements.value = []
  loadAnnouncements()
}

// Reordena a página 1 colocando posts de seguidos/favoritos primeiro e fechados por último
function applyPrioritySort(results: Announcement[]): Announcement[] {
  if (priorityAuthorIds.value.size === 0) {
    // Still need to push closed to the end even without priority authors
    const open: Announcement[] = []
    const closed: Announcement[] = []
    for (const ann of results) {
      const isClosed = !isBusinessOpen(
        ann.business_schedule ?? ann.business_open_time,
        ann.business_close_time,
        ann.business_days,
        ann.closed_on_holidays,
      )
      if (isClosed) closed.push(ann)
      else open.push(ann)
    }
    return [...open, ...closed]
  }

  const featured: Announcement[] = results.filter(a => a.is_featured)
  const priority: Announcement[] = []
  const rest: Announcement[] = []

  for (const ann of results) {
    if (ann.is_featured) continue
    if (priorityAuthorIds.value.has(ann.author_id)) {
      priority.push(ann)
    } else {
      rest.push(ann)
    }
  }

  // Split rest into open vs closed-now
  const restOpen: Announcement[] = []
  const restClosed: Announcement[] = []
  for (const ann of [...priority, ...rest]) {
    const isClosed = !isBusinessOpen(
      ann.business_schedule ?? ann.business_open_time,
      ann.business_close_time,
      ann.business_days,
      ann.closed_on_holidays,
    )
    if (isClosed) restClosed.push(ann)
    else restOpen.push(ann)
  }

  // featured + open (priority + normal) + closed
  return [...featured, ...restOpen, ...restClosed]
}

async function loadAnnouncements() {
  const results = await fetchFeed({
    ...filters.value,
    page: currentPage.value,
  })

  const sorted = currentPage.value === 1 ? applyPrioritySort(results) : results

  if (currentPage.value === 1) {
    announcements.value = sorted
  } else {
    announcements.value.push(...sorted)
  }
}

async function loadMore() {
  if (loading.value || !hasMore.value) return
  currentPage.value++
  await loadAnnouncements()
}

async function loadFeatured() {
  // Busca anúncios pagos reais para o condomínio atual
  const results = await fetchPaidAds(5)
  featuredAnnouncements.value = results
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
  // Carrega follows e favoritos em paralelo para montar o conjunto de autores prioritários
  const [, , , favData, followData] = await Promise.all([
    loadAnnouncements(),
    loadFeatured(),
    fetchActiveCampaigns().then(c => { activeCampaigns.value = c }),
    loadFavoriteIds(),
    loadFollowingIds(),
  ])

  // Monta set de autores prioritários: seguidos + autores de anúncios favoritados
  // favoriteIds já contém os announcement IDs; seguidos estão em followingIds
  // Os IDs de autores dos favoritos precisam ser obtidos dos anúncios já carregados
  const favAuthors = announcements.value
    .filter(a => favoriteIds.value.has(a.id))
    .map(a => a.author_id)

  priorityAuthorIds.value = new Set([...followingIds.value, ...favAuthors])

  // Re-aplica a ordenação com os dados de prioridade já carregados
  if (currentPage.value === 1 && priorityAuthorIds.value.size > 0) {
    announcements.value = applyPrioritySort(announcements.value)
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>
