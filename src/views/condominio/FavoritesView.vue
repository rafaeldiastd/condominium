<template>
  <div class="p-4">
    <h2 class="text-xl font-bold text-gray-900 mb-4">Favoritos</h2>

    <div v-if="loading" 
      class="grid gap-4"
      :class="viewMode === 'feed' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'"
    >
      <div v-for="i in 4" :key="i" class="animate-pulse bg-white rounded-2xl p-3 border border-gray-100">
        <div class="aspect-square bg-gray-100 rounded-xl mb-3"></div>
        <div class="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <div v-else-if="favorites.length" 
      class="grid gap-4"
      :class="viewMode === 'feed' ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'"
    >
      <AnnouncementCard
        v-for="ann in favorites"
        :key="ann.id"
        :announcement="ann"
      />
    </div>

    <EmptyState
      v-else
      :icon="PhHeart"
      title="Nenhum favorito ainda"
      description="Toque no coração de qualquer anúncio para salvar aqui."
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFavorites } from '@/composables/useFavorites'
import { useViewMode } from '@/composables/useViewMode'
import AnnouncementCard from '@/components/announcement/AnnouncementCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { PhHeart } from '@phosphor-icons/vue'
import type { Announcement } from '@/types/app.types'

const { fetchFavorites, loadFavoriteIds, loading } = useFavorites()
const { viewMode } = useViewMode()
const favorites = ref<Announcement[]>([])

onMounted(async () => {
  const [favs] = await Promise.all([
    fetchFavorites(),
    loadFavoriteIds(),
  ])
  favorites.value = favs
})
</script>
