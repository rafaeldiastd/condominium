import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Announcement } from '@/types/app.types'

export function useFavorites() {
  const authStore = useAuthStore()
  const favoriteIds = ref<Set<string>>(new Set())
  const loading = ref(false)

  async function loadFavoriteIds(): Promise<void> {
    if (!authStore.user) return
    const { data } = await supabase
      .from('favorites')
      .select('announcement_id')
      .eq('user_id', authStore.user.id)
    favoriteIds.value = new Set(data?.map(f => f.announcement_id) ?? [])
  }

  async function fetchFavorites(): Promise<Announcement[]> {
    if (!authStore.user) return []
    loading.value = true
    try {
      const { data } = await supabase
        .from('favorites')
        .select(`
          announcement_id,
          announcement:announcements(
            *,
            author:profiles!announcements_author_id_fkey(id, full_name, avatar_url),
            images:announcement_images(id, url, is_cover)
          )
        `)
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })

      return (data?.map(f => f.announcement).filter(Boolean) ?? []) as unknown as Announcement[]
    } finally {
      loading.value = false
    }
  }

  async function toggleFavorite(announcementId: string): Promise<void> {
    if (!authStore.user) return

    const isFav = favoriteIds.value.has(announcementId)

    // Optimistic update
    if (isFav) {
      favoriteIds.value.delete(announcementId)
    } else {
      favoriteIds.value.add(announcementId)
    }

    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', authStore.user.id)
        .eq('announcement_id', announcementId)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: authStore.user.id, announcement_id: announcementId })
    }
  }

  function isFavorited(announcementId: string): boolean {
    return favoriteIds.value.has(announcementId)
  }

  return {
    favoriteIds,
    loading,
    loadFavoriteIds,
    fetchFavorites,
    toggleFavorite,
    isFavorited,
  }
}
