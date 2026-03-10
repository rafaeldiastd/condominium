import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Condominium } from '@/types/app.types'

export const useCondominiumStore = defineStore('condominium', () => {
  const current = ref<Condominium | null>(null)
  const loading = ref(false)

  async function resolveSlug(slug: string): Promise<boolean> {
    loading.value = true
    try {
      const { data } = await supabase
        .from('condominiums')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      if (data) {
        current.value = data as Condominium
        return true
      }
      return false
    } finally {
      loading.value = false
    }
  }

  return { current, loading, resolveSlug }
})
