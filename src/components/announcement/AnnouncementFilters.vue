<template>
  <div class="bg-white border-b border-gray-100 sticky top-14 z-30">
    <!-- Search -->
    <div class="px-4 py-2 flex items-center gap-3">
      <div class="relative flex-1">
        <PhMagnifyingGlass class="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <input
          :value="modelSearch"
          @input="$emit('update:modelSearch', ($event.target as HTMLInputElement).value)"
          type="search"
          placeholder="Buscar anúncios..."
          class="w-full pl-8 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
        />
      </div>

      <!-- View Mode Toggle -->
      <div class="flex items-center bg-gray-100 p-1 rounded-xl">
        <button
          @click="setViewMode('feed')"
          class="p-1.5 rounded-lg transition-all"
          :class="viewMode === 'feed' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'"
          title="Ver como Feed"
        >
          <PhRows class="w-5 h-5" weight="bold" />
        </button>
        <button
          @click="setViewMode('grid')"
          class="p-1.5 rounded-lg transition-all"
          :class="viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'"
          title="Ver como Grade"
        >
          <PhSquaresFour class="w-5 h-5" weight="bold" />
        </button>
      </div>
    </div>

    <!-- Type filter pills -->
    <div class="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
      <button
        v-for="filter in filters"
        :key="filter.value"
        @click="$emit('update:modelType', filter.value)"
        class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        :class="modelType === filter.value
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      >
        {{ filter.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhMagnifyingGlass, PhRows, PhSquaresFour } from '@phosphor-icons/vue'
import { useViewMode } from '@/composables/useViewMode'
import type { AnnouncementType } from '@/types/app.types'

const { viewMode, setViewMode } = useViewMode()

defineProps<{
  modelSearch: string
  modelType: AnnouncementType | 'all'
}>()

defineEmits<{
  'update:modelSearch': [value: string]
  'update:modelType': [value: AnnouncementType | 'all']
}>()

const filters = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'sale' as const, label: 'Produto' },
  { value: 'service' as const, label: 'Serviço' },
  { value: 'donation' as const, label: 'Doação' },
  { value: 'donation_request' as const, label: 'Pedido' },
  { value: 'event' as const, label: 'Eventos' },
]
</script>
