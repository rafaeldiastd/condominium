<template>
  <div class="bg-white border-b border-gray-100">
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

      <!-- Filter toggle button -->
      <button
        @click="showAdvancedFilters = !showAdvancedFilters"
        class="p-2 rounded-xl transition-all"
        :class="hasActiveFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        title="Filtros avançados"
      >
        <PhFunnelSimple class="w-5 h-5" :weight="hasActiveFilters ? 'fill' : 'regular'" />
      </button>

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

    <!-- Advanced Filters Panel -->
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-96"
      leave-from-class="opacity-100 max-h-96"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="showAdvancedFilters" class="border-t border-gray-100 px-4 py-3 space-y-3 overflow-hidden">
        <!-- Date Range Filter -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs font-medium text-gray-600 mb-1 block">Data inicial</label>
            <input
              type="date"
              :value="modelDateFrom"
              @input="$emit('update:modelDateFrom', ($event.target as HTMLInputElement).value)"
              class="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 mb-1 block">Data final</label>
            <input
              type="date"
              :value="modelDateTo"
              @input="$emit('update:modelDateTo', ($event.target as HTMLInputElement).value)"
              class="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Price Range Filter -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs font-medium text-gray-600 mb-1 block">Valor mínimo</label>
            <input
              type="number"
              :value="modelPriceMin"
              @input="$emit('update:modelPriceMin', ($event.target as HTMLInputElement).value ? parseFloat(($event.target as HTMLInputElement).value) : null)"
              placeholder="R$ 0"
              min="0"
              step="0.01"
              class="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 mb-1 block">Valor máximo</label>
            <input
              type="number"
              :value="modelPriceMax"
              @input="$emit('update:modelPriceMax', ($event.target as HTMLInputElement).value ? parseFloat(($event.target as HTMLInputElement).value) : null)"
              placeholder="R$ 999999"
              min="0"
              step="0.01"
              class="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Seller/Author Name Filter -->
        <div>
          <label class="text-xs font-medium text-gray-600 mb-1 block">Vendedor</label>
          <div class="relative">
            <PhUser class="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              :value="modelAuthorName"
              @input="$emit('update:modelAuthorName', ($event.target as HTMLInputElement).value)"
              placeholder="Nome do vendedor..."
              class="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Clear Filters Button -->
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <PhX class="w-4 h-4" />
          Limpar filtros
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PhMagnifyingGlass, PhRows, PhSquaresFour, PhFunnelSimple, PhUser, PhX } from '@phosphor-icons/vue'
import { useViewMode } from '@/composables/useViewMode'
import type { AnnouncementType } from '@/types/app.types'

const { viewMode, setViewMode } = useViewMode()

const props = defineProps<{
  modelSearch: string
  modelType: AnnouncementType | 'all'
  modelDateFrom?: string
  modelDateTo?: string
  modelPriceMin?: number | null
  modelPriceMax?: number | null
  modelAuthorName?: string
}>()

const emit = defineEmits<{
  'update:modelSearch': [value: string]
  'update:modelType': [value: AnnouncementType | 'all']
  'update:modelDateFrom': [value: string]
  'update:modelDateTo': [value: string]
  'update:modelPriceMin': [value: number | null]
  'update:modelPriceMax': [value: number | null]
  'update:modelAuthorName': [value: string]
}>()

const showAdvancedFilters = ref(false)

const hasActiveFilters = computed(() => {
  return !!(
    props.modelDateFrom ||
    props.modelDateTo ||
    props.modelPriceMin !== null && props.modelPriceMin !== undefined ||
    props.modelPriceMax !== null && props.modelPriceMax !== undefined ||
    props.modelAuthorName
  )
})

const clearFilters = () => {
  emit('update:modelDateFrom', '')
  emit('update:modelDateTo', '')
  emit('update:modelPriceMin', null)
  emit('update:modelPriceMax', null)
  emit('update:modelAuthorName', '')
}

const filters = [
  { value: 'all' as const, label: 'Todos' },
  { value: 'sale' as const, label: 'Produto' },
  { value: 'service' as const, label: 'Serviço' },
  { value: 'donation' as const, label: 'Doação' },
  { value: 'donation_request' as const, label: 'Pedido' },
  { value: 'event' as const, label: 'Eventos' },
]
</script>
