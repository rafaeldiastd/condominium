import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useCondominiumStore } from '@/stores/condominium'
import { FEED_PAGE_SIZE } from '@/utils/constants'
import type { Announcement, FeedFilters } from '@/types/app.types'

export function useAnnouncements() {
  const condominiumStore = useCondominiumStore()
  const loading = ref(false)
  const hasMore = ref(true)

  async function fetchFeed(filters: FeedFilters = {}, page = 1): Promise<Announcement[]> {
    const condominiumId = condominiumStore.current?.id
    if (!condominiumId) return []

    loading.value = true
    try {
      const from = (page - 1) * FEED_PAGE_SIZE
      const to = from + FEED_PAGE_SIZE - 1

      let query = supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_author_id_fkey(id, full_name, avatar_url, unit),
          category:categories(*),
          images:announcement_images(*)
        `)
        .eq('condominium_id', condominiumId)
        .in('status', ['active', 'sold'])
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error

      hasMore.value = (data?.length ?? 0) === FEED_PAGE_SIZE
      return (data ?? []) as Announcement[]
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        author:profiles!announcements_author_id_fkey(id, full_name, avatar_url, unit, phone),
        category:categories(*),
        images:announcement_images(*)
      `)
      .eq('id', id)
      .single()

    if (error) return null
    return data as Announcement
  }

  async function fetchByAuthor(authorId: string): Promise<Announcement[]> {
    const { data } = await supabase
      .from('announcements')
      .select(`
        *,
        images:announcement_images(id, url, is_cover)
      `)
      .eq('author_id', authorId)
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false })

    return (data ?? []) as Announcement[]
  }

  async function incrementViews(id: string): Promise<void> {
    // Fire-and-forget — não aguardamos retorno
    supabase.rpc('increment_announcement_views', { announcement_id: id }).then()
  }

  async function fetchActiveCampaigns(): Promise<import('@/types/app.types').Campaign[]> {
    const condominiumId = condominiumStore.current?.id
    if (!condominiumId) return []

    const { data } = await supabase
      .from('campaigns')
      .select('*, condominiums:campaign_condominiums!inner(condominium_id)')
      .eq('is_active', true)
      .lte('starts_at', new Date().toISOString())
      .gte('ends_at', new Date().toISOString())
      .eq('condominiums.condominium_id', condominiumId)

    return (data ?? []) as import('@/types/app.types').Campaign[]
  }

  async function createAnnouncement(
    data: {
      title: string
      description?: string
      type: import('@/types/app.types').AnnouncementType
      category_id: string
      price?: number | null
      price_negotiable?: boolean
      event_date?: string | null
      event_location?: string | null
      contact_type?: 'chat' | 'whatsapp'
      contact_whatsapp?: string | null
    },
    images: File[]
  ): Promise<string | null> {
    const { useAuthStore } = await import('@/stores/auth')
    const { useStorage } = await import('@/composables/useStorage')
    const authStore = useAuthStore()
    const storage = useStorage()

    if (!authStore.user || !condominiumStore.current) return null

    const { data: ann, error } = await supabase
      .from('announcements')
      .insert({
        ...data,
        condominium_id: condominiumStore.current.id,
        author_id: authStore.user.id,
        status: 'active',
      })
      .select('id')
      .single()

    if (error || !ann) return null

    if (images.length) {
      const uploaded = await storage.uploadAnnouncementImages(ann.id, images)
      if (uploaded.length) {
        await supabase.from('announcement_images').insert(
          uploaded.map((img, i) => ({
            announcement_id: ann.id,
            storage_path: img.storagePath,
            url: img.url,
            sort_order: i,
            is_cover: i === 0,
          }))
        )
      }
    }

    return ann.id
  }

  async function updateAnnouncement(
    id: string,
    data: Partial<{
      title: string
      description: string
      type: import('@/types/app.types').AnnouncementType
      category_id: string
      price: number | null
      price_negotiable: boolean
      event_date: string | null
      event_location: string | null
      status: import('@/types/app.types').AnnouncementStatus
      contact_type: 'chat' | 'whatsapp'
      contact_whatsapp: string | null
    }>,
    newImages?: File[],
    deletedImageIds?: string[]
  ): Promise<void> {
    const { useStorage } = await import('@/composables/useStorage')
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    const storage = useStorage()

    await supabase.from('announcements').update(data).eq('id', id)

    if (deletedImageIds?.length) {
      const { data: imgs } = await supabase
        .from('announcement_images')
        .select('storage_path')
        .in('id', deletedImageIds)

      if (imgs?.length) {
        await storage.deleteAnnouncementImages(imgs.map(i => i.storage_path))
      }

      await supabase.from('announcement_images').delete().in('id', deletedImageIds)
    }

    if (newImages?.length && authStore.user) {
      const uploaded = await storage.uploadAnnouncementImages(id, newImages)
      if (uploaded.length) {
        const { count } = await supabase
          .from('announcement_images')
          .select('id', { count: 'exact', head: true })
          .eq('announcement_id', id)

        await supabase.from('announcement_images').insert(
          uploaded.map((img, i) => ({
            announcement_id: id,
            storage_path: img.storagePath,
            url: img.url,
            sort_order: (count ?? 0) + i,
            is_cover: (count ?? 0) === 0 && i === 0,
          }))
        )
      }
    }
  }

  async function deleteAnnouncement(id: string): Promise<void> {
    const { useStorage } = await import('@/composables/useStorage')
    const storage = useStorage()

    const { data: imgs } = await supabase
      .from('announcement_images')
      .select('storage_path')
      .eq('announcement_id', id)

    await supabase.from('announcements').update({ status: 'deleted' }).eq('id', id)

    if (imgs?.length) {
      await storage.deleteAnnouncementImages(imgs.map(i => i.storage_path))
    }
  }

  async function markAsSold(id: string): Promise<void> {
    await supabase.from('announcements').update({ status: 'sold' }).eq('id', id)
  }

  return {
    loading,
    hasMore,
    fetchFeed,
    fetchById,
    fetchByAuthor,
    incrementViews,
    fetchActiveCampaigns,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    markAsSold,
  }
}
