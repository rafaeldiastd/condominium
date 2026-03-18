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
        <div class="relative flex flex-col gap-3 group">
          <div class="relative aspect-[21/9] md:h-64 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
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

          </div>
          
          <!-- Content Below (Premium look) -->
          <div class="px-1 py-1">
            <div class="flex justify-between items-start gap-3">
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1 truncate">{{ ann.title }}</h3>
                <p class="text-[11px] font-medium text-gray-500 mt-1 uppercase tracking-wider">{{ ann.category?.name || 'Destaque' }} • {{ ann.author?.full_name }}</p>
              </div>
              <div class="flex-shrink-0 text-right">
                <p class="text-sm font-black text-blue-600">
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
import { useAdTracking } from '@/composables/useAdTracking'
import type { Announcement } from '@/types/app.types'

const props = defineProps<{
  announcements: Announcement[]
}>()

const router = useRouter()
const route = useRoute()
const { trackInteraction } = useAdTracking()
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
  const newIndex = Math.round(scrollPosition / itemWidth)
  
  if (newIndex !== activeIndex.value && props.announcements[newIndex]) {
    trackInteraction(props.announcements[newIndex].id, 'carousel_view')
  }
  
  activeIndex.value = newIndex
}

function goToDetail(id: string) {
  trackInteraction(id, 'click')
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
  // Initial view
  if (props.announcements[0]) {
    trackInteraction(props.announcements[0].id, 'carousel_view')
  }
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
