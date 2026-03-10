<template>
  <div>
    <!-- Main image -->
    <div class="relative bg-gray-100 aspect-square">
      <img
        v-if="images[activeIndex]"
        :src="(images[activeIndex]!.url) + '?width=800&quality=85'"
        class="w-full h-full object-cover"
        :alt="`Imagem ${activeIndex + 1}`"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-6xl">📦</div>

      <!-- Nav arrows -->
      <button
        v-if="images.length > 1 && activeIndex > 0"
        @click="activeIndex--"
        class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center"
      >&#8249;</button>
      <button
        v-if="images.length > 1 && activeIndex < images.length - 1"
        @click="activeIndex++"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center"
      >&#8250;</button>

      <!-- Dots -->
      <div v-if="images.length > 1" class="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        <button
          v-for="(_, i) in images"
          :key="i"
          @click="activeIndex = i"
          class="w-1.5 h-1.5 rounded-full transition-colors"
          :class="i === activeIndex ? 'bg-white' : 'bg-white/50'"
        />
      </div>
    </div>

    <!-- Thumbnails -->
    <div v-if="images.length > 1" class="flex gap-2 px-4 pt-2 overflow-x-auto">
      <button
        v-for="(img, i) in images"
        :key="img.id"
        @click="activeIndex = i"
        class="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition"
        :class="i === activeIndex ? 'border-blue-600' : 'border-transparent'"
      >
        <img :src="img.url + '?width=100'" class="w-full h-full object-cover" :alt="`Thumbnail ${i+1}`" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AnnouncementImage } from '@/types/app.types'

defineProps<{ images: AnnouncementImage[] }>()
const activeIndex = ref(0)
</script>
