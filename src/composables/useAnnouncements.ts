import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useCondominiumStore } from '@/stores/condominium'
import { FEED_PAGE_SIZE } from '@/utils/constants'
import type { Announcement, FeedFilters, AnnouncementItem, AnnouncementLink, AnnouncementWhatsAppContact } from '@/types/app.types'
import type { ItemFormData } from '@/components/announcement/AnnouncementItemsSection.vue'
import type { LinkFormData } from '@/components/announcement/AnnouncementLinksSection.vue'
import type { WhatsAppContactFormData } from '@/components/announcement/AnnouncementWhatsAppSection.vue'

export function useAnnouncements() {
  const condominiumStore = useCondominiumStore()
  const loading = ref(false)
  const hasMore = ref(false)

  async function fetchFeed(filters: FeedFilters = {}, page = 1): Promise<Announcement[]> {
    const condominiumId = condominiumStore.current?.id
    if (!condominiumId) return []

    loading.value = true
    try {
      const activePage = filters.page || page
      const from = (activePage - 1) * FEED_PAGE_SIZE
      const to = from + FEED_PAGE_SIZE - 1

      const authorFilter = filters.authorName?.trim() ? '!inner' : ''
      let query = supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_author_id_fkey${authorFilter}(id, full_name, avatar_url, unit),
          category:categories(*),
          images:announcement_images(*)
        `)
        .eq('condominium_id', condominiumId)
        .eq('status', 'active')
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

      // Advanced filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      const hasMin = filters.priceMin !== undefined && filters.priceMin !== null && filters.priceMin > 0
      const hasMax = filters.priceMax !== undefined && filters.priceMax !== null

      if (hasMin && hasMax) {
        query = query.gte('price', filters.priceMin).lte('price', filters.priceMax)
      } else if (hasMin) {
        query = query.gte('price', filters.priceMin)
      } else if (hasMax) {
        query = query.or(`price.lte.${filters.priceMax},price.is.null`)
      }

      if (filters.authorName && filters.authorName.trim() !== '') {
        query = query.ilike('author.full_name', `%${filters.authorName}%`)
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
        images:announcement_images(*),
        items:announcement_items(*),
        links:announcement_links(*),
        whatsapp_contacts:announcement_whatsapp_contacts(*)
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
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    return (data ?? []) as Announcement[]
  }

  async function fetchMyAnnouncements(authorId: string): Promise<Announcement[]> {
    const { data } = await supabase
      .from('announcements')
      .select(`
        *,
        images:announcement_images(id, url, is_cover)
      `)
      .eq('author_id', authorId)
      // Exclude 'deleted' announcements so the user can see everything else (active, sold, closed, hidden)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })

    return (data ?? []) as Announcement[]
  }

  async function incrementViews(id: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_announcement_views', { p_announcement_id: id })
      if (error) {
        await supabase.rpc('increment_announcement_views', { announcement_id: id })
      }
    } catch {
      // Ignora erro silenciando tudo
    }
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

  async function fetchPaidAds(limit = 3): Promise<Announcement[]> {
    const condominiumId = condominiumStore.current?.id
    if (!condominiumId) return []

    const { data } = await supabase
      .from('announcements')
      .select(`
        *,
        author:profiles!announcements_author_id_fkey(id, full_name, avatar_url, unit),
        category:categories(*),
        images:announcement_images(*)
      `)
      .eq('condominium_id', condominiumId)
      .eq('is_paid', true)
      .eq('paid_status', 'active')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    return (data ?? []) as Announcement[]
  }

  // Helper para limpar campos vazios antes de enviar para o Supabase
  function prepareData(data: any) {
    const cleaned: any = {}
    for (const key in data) {
      const val = data[key]
      // Se for string vazia ou apenas espaços, vira null
      if (val === '' || (typeof val === 'string' && val.trim() === '')) {
        cleaned[key] = null
      } else {
        cleaned[key] = val
      }
    }
    return cleaned
  }

  /** Upload a single item image file and return the public URL */
  async function uploadItemImage(announcementId: string, file: File): Promise<{ url: string; storagePath: string } | null> {
    const { useStorage } = await import('@/composables/useStorage')
    const storage = useStorage()
    const results = await storage.uploadAnnouncementImages(announcementId, [file])
    return results[0] ?? null
  }

  /** Insert items into announcement_items after announcement creation/update */
  async function saveItems(announcementId: string, items: ItemFormData[]): Promise<void> {
    // Delete existing items for this announcement and re-insert
    await supabase.from('announcement_items').delete().eq('announcement_id', announcementId)

    const toInsert: {
      announcement_id: string
      name: string
      price: number | null
      description: string | null
      image_url: string | null
      storage_path: string | null
      sort_order: number
    }[] = []

    let sortOrder = 0
    for (const item of items) {
      if (!item.name?.trim()) continue

      let imageUrl: string | null = item.image_url ?? null
      let storagePath: string | null = null

      if (item.imageFile) {
        const uploaded = await uploadItemImage(announcementId, item.imageFile)
        if (uploaded) {
          imageUrl = uploaded.url
          storagePath = uploaded.storagePath
        }
      }

      toInsert.push({
        announcement_id: announcementId,
        name: item.name.trim(),
        price: (item.price as number | null) ?? null,
        description: item.description?.trim() || null,
        image_url: imageUrl,
        storage_path: storagePath,
        sort_order: sortOrder++,
      })
    }

    if (toInsert.length) {
      await supabase.from('announcement_items').insert(toInsert)
    }
  }


  /** Insert links into announcement_links */
  async function saveLinks(announcementId: string, links: LinkFormData[]): Promise<void> {
    await supabase.from('announcement_links').delete().eq('announcement_id', announcementId)

    const toInsert = links
      .filter(l => l.url?.trim())
      .map((l, i) => ({
        announcement_id: announcementId,
        url: l.url.trim(),
        title: l.title?.trim() || null,
        sort_order: i,
      }))

    if (toInsert.length) {
      await supabase.from('announcement_links').insert(toInsert)
    }
  }

  /** Insert WhatsApp contacts */
  async function saveWhatsAppContacts(announcementId: string, contacts: WhatsAppContactFormData[]): Promise<void> {
    await supabase.from('announcement_whatsapp_contacts').delete().eq('announcement_id', announcementId)

    const toInsert = contacts
      .filter(c => c.number?.trim())
      .map((c, i) => ({
        announcement_id: announcementId,
        number: c.number.trim(),
        description: c.description?.trim() || null,
        sort_order: i,
      }))

    if (toInsert.length) {
      await supabase.from('announcement_whatsapp_contacts').insert(toInsert)
    }
  }

  async function createAnnouncement(
    data: {
      title: string
      description?: string
      type: import('@/types/app.types').AnnouncementType
      price?: number | null
      price_negotiable?: boolean
      is_multi_item?: boolean
      event_date?: string | null
      event_location?: string | null
      contact_type?: 'chat' | 'whatsapp'
      contact_whatsapp?: string | null
      subcategory?: string | null
      commerce_method?: string | null
      maps_link?: string | null
      business_open_time?: string | null
      business_close_time?: string | null
      business_days?: string[] | null
      closed_on_holidays?: boolean
    },
    images: File[],
    items?: ItemFormData[],
    links?: LinkFormData[],
    contacts?: WhatsAppContactFormData[]
  ): Promise<string | null> {
    const { useAuthStore } = await import('@/stores/auth')
    const { useStorage } = await import('@/composables/useStorage')
    const authStore = useAuthStore()
    const storage = useStorage()

    if (!authStore.user || !condominiumStore.current) return null

    const { data: ann, error } = await supabase
      .from('announcements')
      .insert({
        ...prepareData(data),
        condominium_id: condominiumStore.current.id,
        author_id: authStore.user.id,
        status: 'active',
      })
      .select('id')
      .single()

    if (error || !ann) return null

    // Upload cover images
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

    // Save relations
    if (items?.length) await saveItems(ann.id, items)
    if (links?.length) await saveLinks(ann.id, links)
    if (contacts?.length) await saveWhatsAppContacts(ann.id, contacts)

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
      subcategory: string | null
      commerce_method: string | null
      maps_link: string | null
      business_open_time: string | null
      business_close_time: string | null
      business_days: string[] | null
      closed_on_holidays: boolean
      is_multi_item: boolean
    }>,
    newImages?: File[],
    deletedImageIds?: string[],
    items?: ItemFormData[],
    links?: LinkFormData[],
    contacts?: WhatsAppContactFormData[]
  ): Promise<void> {
    const { useStorage } = await import('@/composables/useStorage')
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    const storage = useStorage()

    const payload = prepareData(data)
    const { error } = await supabase
      .from('announcements')
      .update(payload)
      .eq('id', id)

    if (error) {
      console.error('Erro detalhado no Supabase update payload:', payload)
      throw error
    }

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

    // Save relations (full replace)
    if (items !== undefined) await saveItems(id, items)
    if (links !== undefined) await saveLinks(id, links)
    if (contacts !== undefined) await saveWhatsAppContacts(id, contacts)
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

  async function updateAnnouncementStatus(id: string, status: import('@/types/app.types').AnnouncementStatus): Promise<void> {
    const { error } = await supabase.from('announcements').update({ status }).eq('id', id)
    if (error) throw error
  }

  /**
   * Encerrar anúncio: save metrics snapshot → delete images → delete all conversations → delete announcement.
   * This is irreversible and designed to be called from a confirmed user action.
   */
  async function closeAnnouncement(id: string): Promise<void> {
    const { useStorage } = await import('@/composables/useStorage')
    const { useAuthStore } = await import('@/stores/auth')
    const storage = useStorage()
    const authStore = useAuthStore()

    // 1. Fetch announcement data for the snapshot
    const { data: ann } = await supabase
      .from('announcements')
      .select('*, images:announcement_images(storage_path)')
      .eq('id', id)
      .single()

    if (!ann) throw new Error('Announcement not found')

    // 2. Count conversations
    const { count: convCount } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('announcement_id', id)

    // 3. Save metrics snapshot before deletion
    await supabase.from('ad_metrics_snapshots').insert({
      announcement_id: id,
      author_id: authStore.user?.id,
      title: ann.title,
      type: ann.type,
      category_id: ann.category_id,
      price: ann.price ?? null,
      views_count: ann.views_count ?? 0,
      conversation_count: convCount ?? 0,
      closed_at: new Date().toISOString(),
      created_at: ann.created_at,
    })

    // 4. Delete images from Storage
    const storagePaths = (ann.images ?? []).map((i: { storage_path: string }) => i.storage_path)
    if (storagePaths.length) {
      await storage.deleteAnnouncementImages(storagePaths)
    }

    // 5. Hard delete image records
    await supabase.from('announcement_images').delete().eq('announcement_id', id)

    // 6. Hard delete relations
    await supabase.from('announcement_items').delete().eq('announcement_id', id)
    await supabase.from('announcement_links').delete().eq('announcement_id', id)
    await supabase.from('announcement_whatsapp_contacts').delete().eq('announcement_id', id)

    // 7. Hard delete all conversations (cascades to messages via DB FK or we delete explicitly)
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .eq('announcement_id', id)

    if (convs?.length) {
      const convIds = convs.map((c: { id: string }) => c.id)
      await supabase.from('messages').delete().in('conversation_id', convIds)
      await supabase.from('conversations').delete().in('id', convIds)
    }

    // 8. Delete the announcement itself
    await supabase.from('announcements').delete().eq('id', id)
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
    fetchMyAnnouncements,
    updateAnnouncementStatus,
    closeAnnouncement,
    fetchPaidAds,
  }
}
