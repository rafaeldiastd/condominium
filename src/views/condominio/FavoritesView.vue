<template>
  <div class="p-4">
    <h2 class="text-xl font-bold text-gray-900 mb-4">Favoritos</h2>

    <div v-if="loading" class="grid grid-cols-2 gap-3">
      <div v-for="i in 4" :key="i" class="animate-pulse">
        <div class="aspect-square bg-gray-200 rounded-2xl"></div>
      </div>
    </div>

    <div v-else-if="favorites.length" class="grid grid-cols-2 gap-3">
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
import AnnouncementCard from '@/components/announcement/AnnouncementCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { PhHeart } from '@phosphor-icons/vue'
import type { Announcement } from '@/types/app.types'

const { fetchFavorites, loadFavoriteIds, loading } = useFavorites()
const favorites = ref<Announcement[]>([])

onMounted(async () => {
  const [favs] = await Promise.all([
    fetchFavorites(),
    loadFavoriteIds(),
  ])
  favorites.value = favs
})
</script>
