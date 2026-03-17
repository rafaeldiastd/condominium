import { ref, watch } from 'vue'
import type { AnnouncementType, FeedFilters } from '@/types/app.types'

export function useFeedFilters() {
  const searchQuery = ref('')
  const typeFilter = ref<AnnouncementType | 'all'>('all')
  const dateFrom = ref('')
  const dateTo = ref('')
  const priceMin = ref<number | null>(null)
  const priceMax = ref<number | null>(null)
  const authorName = ref('')

  const filters = ref<FeedFilters>({
    type: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
    priceMin: undefined,
    priceMax: undefined,
    authorName: ''
  })

  let debounceTimeout: ReturnType<typeof setTimeout>

  function updateFilters() {
    filters.value = {
      type: typeFilter.value,
      search: searchQuery.value,
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
      priceMin: priceMin.value ?? undefined,
      priceMax: priceMax.value ?? undefined,
      authorName: authorName.value || undefined
    }
  }

  // Watchers for instant filters
  watch([typeFilter, dateFrom, dateTo, priceMin, priceMax], () => {
    updateFilters()
  })

  // Debounced watchers for text inputs
  watch([searchQuery, authorName], () => {
    clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(() => {
      updateFilters()
    }, 350)
  })

  function clearAllFilters() {
    searchQuery.value = ''
    typeFilter.value = 'all'
    dateFrom.value = ''
    dateTo.value = ''
    priceMin.value = null
    priceMax.value = null
    authorName.value = ''
    updateFilters()
  }

  return {
    searchQuery,
    typeFilter,
    dateFrom,
    dateTo,
    priceMin,
    priceMax,
    authorName,
    filters,
    clearAllFilters
  }
}
