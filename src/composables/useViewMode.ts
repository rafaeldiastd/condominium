import { ref, watch } from 'vue'

export type ViewMode = 'feed' | 'grid'

const VIEW_MODE_KEY = 'condomiinus_view_mode'

// Global state to sync across components
const viewMode = ref<ViewMode>((localStorage.getItem(VIEW_MODE_KEY) as ViewMode) || 'grid')

watch(viewMode, (newMode) => {
  localStorage.setItem(VIEW_MODE_KEY, newMode)
})

export function useViewMode() {
  function toggleViewMode() {
    viewMode.value = viewMode.value === 'feed' ? 'grid' : 'feed'
  }

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }

  return {
    viewMode,
    toggleViewMode,
    setViewMode
  }
}
