<template>
  <div
    class="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all active:scale-[0.98] cursor-pointer"
    @click="goToDetail"
  >
    <!-- Image -->
    <div class="aspect-square bg-gray-100 relative">
      <img
        v-if="coverImage"
        :src="coverImage + '?width=400&quality=80'"
        :alt="announcement.title"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
        <component :is="typeIcon[announcement.type] ?? PhPackage" class="w-12 h-12" />
      </div>

      <!-- Type badge -->
      <div class="absolute top-2 left-2">
        <AnnouncementBadge :type="announcement.type" />
      </div>

      <!-- Sold badge -->
      <div v-if="announcement.status === 'sold'" class="absolute inset-0 bg-black/40 flex items-center justify-center">
        <span class="bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full">Vendido</span>
      </div>

      <!-- Favorite button -->
      <button
        class="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition"
        @click.stop="handleFavoriteToggle"
      >
        <PhHeart :weight="isFav ? 'fill' : 'regular'" :class="isFav ? 'text-red-500' : 'text-gray-400'" class="w-5 h-5" />
      </button>
    </div>

    <!-- Content -->
    <div class="p-3">
      <p class="text-sm font-medium text-gray-900 truncate">{{ announcement.title }}</p>
      <p class="text-sm text-blue-600 font-semibold mt-0.5">
        {{ priceText }}
      </p>

      <!-- Author + time -->
      <div class="flex items-center gap-1.5 mt-2">
        <div class="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          <img v-if="announcement.author?.avatar_url" :src="announcement.author.avatar_url + '?width=40'" class="w-full h-full object-cover" alt="" />
          <span v-else class="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
            {{ announcement.author?.full_name?.charAt(0) ?? '?' }}
          </span>
        </div>
        <span class="text-xs text-gray-400 truncate">{{ announcement.author?.full_name }}</span>
        <span class="text-xs text-gray-300 ml-auto flex-shrink-0">{{ timeAgo }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFavorites } from '@/composables/useFavorites'
import { formatPrice, formatTimeAgo } from '@/utils/formatters'
import AnnouncementBadge from './AnnouncementBadge.vue'
import type { Announcement } from '@/types/app.types'

import {
  PhHeart,
  PhPackage,
  PhTag,
  PhWrench,
  PhGift,
  PhHandsPraying,
  PhMegaphone,
  PhCalendarBlank
} from '@phosphor-icons/vue'
import type { Component } from 'vue'

const props = defineProps<{ announcement: Announcement }>()

const router = useRouter()
const route = useRoute()
const { isFavorited, toggleFavorite } = useFavorites()

const isFav = computed(() => isFavorited(props.announcement.id))

const coverImage = computed(() => {
  const images = props.announcement.images
  if (!images?.length) return null
  return images.find(img => img.is_cover)?.url ?? images[0]?.url ?? null
})

const priceText = computed(() =>
  formatPrice(props.announcement.price ?? undefined, props.announcement.price_negotiable)
)

const timeAgo = computed(() => formatTimeAgo(props.announcement.created_at))

const typeIcon: Record<string, Component> = {
  sale: PhTag,
  service: PhWrench,
  donation: PhGift,
  donation_request: PhHandsPraying,
  campaign: PhMegaphone,
  event: PhCalendarBlank,
}

function goToDetail() {
  const slug = route.params.condominio as string
  router.push(`/${slug}/announcements/${props.announcement.id}`)
}

async function handleFavoriteToggle() {
  await toggleFavorite(props.announcement.id)
}
</script>
