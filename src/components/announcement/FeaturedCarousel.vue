<template>
  <div class="relative w-full overflow-hidden px-4 py-4 select-none">
    <div
      ref="carouselRef"
      class="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
      @scroll="handleScroll"
    >
      <div
        v-for="ann in announcements"
        :key="ann.id"
        class="min-w-[85%] md:min-w-[400px] snap-center cursor-pointer"
        @click="goToDetail(ann.id)"
      >
        <div class="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-lg border border-white/10 group">
          <!-- Background Image -->
          <img
            v-if="getCoverImage(ann)"
            :src="getCoverImage(ann) + '?width=800&quality=85'"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt=""
          />
          <div v-else class="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white/20">
            <PhMegaphone :size="48" weight="fill" />
          </div>

          <!-- Overlay Gradient -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <!-- Badge: "Destaque" or Featured -->
          <div class="absolute top-3 left-3 px-2 py-0.5 bg-yellow-400 text-black text-[10px] font-bold rounded-lg shadow-sm uppercase tracking-wider">
            Destaque
          </div>

          <!-- Content Overlay (Glassmorphism) -->
          <div class="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
            <div class="flex justify-between items-end gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium opacity-80 mb-0.5 truncate">{{ ann.author?.full_name }}</p>
                <h3 class="text-sm font-bold leading-tight truncate">{{ ann.title }}</h3>
              </div>
              <div class="flex-shrink-0 text-right">
                <p class="text-xs font-bold bg-blue-600 px-2 py-1 rounded-lg">
                  {{ formatPrice(ann.price ?? undefined, ann.price_negotiable) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination Dots -->
    <div v-if="announcements.length > 1" class="flex justify-center gap-1.5 mt-3">
      <div
        v-for="(_, index) in announcements"
        :key="index"
        class="w-1.5 h-1.5 rounded-full transition-all duration-300"
        :class="activeIndex === index ? 'bg-blue-600 w-4' : 'bg-gray-300'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { PhMegaphone } from '@phosphor-icons/vue'
import { formatPrice } from '@/utils/formatters'
import type { Announcement } from '@/types/app.types'

const props = defineProps<{
  announcements: Announcement[]
}>()

const router = useRouter()
const route = useRoute()
const carouselRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
let autoPlayInterval: ReturnType<typeof setInterval>

function getCoverImage(ann: Announcement) {
  if (!ann.images?.length) return null
  return ann.images.find(img => img.is_cover)?.url ?? ann.images[0]?.url ?? null
}

function handleScroll(e: Event) {
  const el = e.target as HTMLElement
  const scrollPosition = el.scrollLeft
  const itemWidth = el.offsetWidth * 0.85 // Approximate min-w-[85%]
  activeIndex.value = Math.round(scrollPosition / itemWidth)
}

function goToDetail(id: string) {
  const slug = route.params.condominio as string
  router.push(`/${slug}/announcements/${id}`)
}

function startAutoPlay() {
  if (props.announcements.length <= 1) return
  autoPlayInterval = setInterval(() => {
    if (!carouselRef.value) return
    const nextIndex = (activeIndex.value + 1) % props.announcements.length
    const itemWidth = carouselRef.value.scrollWidth / props.announcements.length
    carouselRef.value.scrollTo({
      left: nextIndex * itemWidth,
      behavior: 'smooth'
    })
  }, 5000)
}

function stopAutoPlay() {
  clearInterval(autoPlayInterval)
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
