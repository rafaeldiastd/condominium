import { useCondominiumStore } from '@/stores/condominium'
import { storeToRefs } from 'pinia'

export function useCondominium() {
  const store = useCondominiumStore()
  const { current, loading } = storeToRefs(store)

  return {
    condominium: current,
    loading,
    resolveSlug: store.resolveSlug,
  }
}
