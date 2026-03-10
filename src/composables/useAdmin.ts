import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Condominium, Profile, Campaign } from '@/types/app.types'
import { TABLE_PAGE_SIZE } from '@/utils/constants'
import { paginate } from '@/utils/supabase-helpers'

export interface GlobalStats {
  totalCondominiums: number
  totalUsers: number
  pendingReports: number
  activeAnnouncements: number
}

export interface UserFilters {
  condominiumId?: string
  role?: string
  search?: string
  page?: number
}

export function useAdmin() {
  const condominiums = ref<Condominium[]>([])
  const users = ref<Profile[]>([])
  const campaigns = ref<Campaign[]>([])
  const syndics = ref<Profile[]>([])
  const loading = ref(false)
  const total = ref(0)
  const globalStats = ref<GlobalStats>({
    totalCondominiums: 0,
    totalUsers: 0,
    pendingReports: 0,
    activeAnnouncements: 0,
  })

  // ─── Condomínios ───────────────────────────────────────────────────────────

  async function fetchCondominiums(page = 1, search = '') {
    loading.value = true
    try {
      const { from, to } = paginate(page, TABLE_PAGE_SIZE)
      let query = supabase
        .from('condominiums')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, count } = await query
      condominiums.value = (data ?? []) as Condominium[]
      total.value = count ?? 0
    } finally {
      loading.value = false
    }
  }

  async function fetchCondominiumById(id: string): Promise<Condominium | null> {
    const { data } = await supabase
      .from('condominiums')
      .select('*')
      .eq('id', id)
      .single()
    return data as Condominium | null
  }

  async function createCondominium(data: Record<string, unknown>): Promise<Condominium> {
    const { data: result, error } = await supabase
      .from('condominiums')
      .insert({ ...data, is_active: true })
      .select()
      .single()
    if (error) throw error
    return result as Condominium
  }

  async function updateCondominium(id: string, data: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('condominiums')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  async function toggleCondominiumActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('condominiums')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  // ─── Usuários ──────────────────────────────────────────────────────────────

  async function fetchUsers(filters: UserFilters = {}): Promise<void> {
    loading.value = true
    try {
      const page = filters.page ?? 1
      const { from, to } = paginate(page, TABLE_PAGE_SIZE)

      let query = supabase
        .from('profiles')
        .select('*, condominium:condominiums(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filters.condominiumId) {
        query = query.eq('condominium_id', filters.condominiumId)
      }
      if (filters.role) {
        query = query.eq('role', filters.role)
      }
      if (filters.search) {
        query = query.ilike('full_name', `%${filters.search}%`)
      }

      const { data, count } = await query
      users.value = (data ?? []) as Profile[]
      total.value = count ?? 0
    } finally {
      loading.value = false
    }
  }

  async function fetchUserById(id: string): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*, condominium:condominiums(*)')
      .eq('id', id)
      .single()
    return data as Profile | null
  }

  async function banUser(id: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        ...(reason ? { ban_reason: reason } : {}),
      })
      .eq('id', id)
    if (error) throw error
  }

  async function unbanUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: false, banned_at: null })
      .eq('id', id)
    if (error) throw error
  }

  // ─── Síndicos ──────────────────────────────────────────────────────────────

  async function fetchSyndics(): Promise<void> {
    loading.value = true
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*, condominium:condominiums(*)')
        .eq('role', 'syndic')
        .order('created_at', { ascending: false })
      syndics.value = (data ?? []) as Profile[]
    } finally {
      loading.value = false
    }
  }

  async function createSyndic(data: {
    full_name: string
    email: string
    password?: string
    condominium_id: string
    send_invite?: boolean
  }): Promise<void> {
    const { error } = await supabase.functions.invoke('create-syndic', {
      body: data,
    })
    if (error) throw error
  }

  async function updateSyndic(id: string, data: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  // ─── Campanhas ─────────────────────────────────────────────────────────────

  async function fetchCampaigns(page = 1): Promise<void> {
    loading.value = true
    try {
      const { from, to } = paginate(page, TABLE_PAGE_SIZE)
      const { data, count } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
      campaigns.value = (data ?? []) as Campaign[]
      total.value = count ?? 0
    } finally {
      loading.value = false
    }
  }

  async function fetchCampaignById(id: string): Promise<Campaign | null> {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()
    return data as Campaign | null
  }

  async function createCampaign(
    data: Record<string, unknown>,
    condominiumIds: string[],
  ): Promise<void> {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert(data)
      .select()
      .single()
    if (error) throw error

    if (condominiumIds.length > 0) {
      const relations = condominiumIds.map((cid) => ({
        campaign_id: (campaign as Campaign).id,
        condominium_id: cid,
      }))
      const { error: relError } = await supabase
        .from('campaign_condominiums')
        .insert(relations)
      if (relError) throw relError
    }
  }

  async function updateCampaign(
    id: string,
    data: Record<string, unknown>,
    condominiumIds: string[],
  ): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error

    // Replace condominium relations
    await supabase.from('campaign_condominiums').delete().eq('campaign_id', id)
    if (condominiumIds.length > 0) {
      const relations = condominiumIds.map((cid) => ({
        campaign_id: id,
        condominium_id: cid,
      }))
      const { error: relError } = await supabase
        .from('campaign_condominiums')
        .insert(relations)
      if (relError) throw relError
    }
  }

  async function deleteCampaign(id: string): Promise<void> {
    await supabase.from('campaign_condominiums').delete().eq('campaign_id', id)
    const { error } = await supabase.from('campaigns').delete().eq('id', id)
    if (error) throw error
  }

  // ─── Stats globais ─────────────────────────────────────────────────────────

  async function fetchGlobalStats(): Promise<GlobalStats> {
    const [condCount, userCount, reportCount, annCount] = await Promise.all([
      supabase.from('condominiums').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    const stats: GlobalStats = {
      totalCondominiums: condCount.count ?? 0,
      totalUsers: userCount.count ?? 0,
      pendingReports: reportCount.count ?? 0,
      activeAnnouncements: annCount.count ?? 0,
    }
    globalStats.value = stats
    return stats
  }

  return {
    condominiums,
    users,
    campaigns,
    syndics,
    loading,
    total,
    globalStats,
    // Condominiums
    fetchCondominiums,
    fetchCondominiumById,
    createCondominium,
    updateCondominium,
    toggleCondominiumActive,
    // Users
    fetchUsers,
    fetchUserById,
    banUser,
    unbanUser,
    // Syndics
    fetchSyndics,
    createSyndic,
    updateSyndic,
    // Campaigns
    fetchCampaigns,
    fetchCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    // Stats
    fetchGlobalStats,
  }
}
