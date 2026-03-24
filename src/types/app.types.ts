export type UserRole = 'super_admin' | 'syndic' | 'resident' | 'advertiser'
export type AnnouncementType = 'sale' | 'service' | 'donation' | 'donation_request' | 'campaign' | 'event'
export type AnnouncementStatus = 'active' | 'sold' | 'closed' | 'hidden' | 'deleted'
export type PaidStatus = 'pending' | 'active' | 'paused' | 'expired'
export type ReportReason = 'spam' | 'inappropriate' | 'fraud' | 'duplicate' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

export interface Condominium {
  id: string
  slug: string
  name: string
  address?: string
  city?: string
  state?: string
  logo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  condominium_id?: string
  username?: string
  role: UserRole
  full_name: string
  avatar_url?: string
  unit?: string
  phone?: string
  gender?: string
  birth_date?: string
  city?: string
  state?: string
  public_link?: string
  public_whatsapp?: string
  public_address?: string
  show_followers_count?: boolean
  allow_direct_messages?: boolean
  is_banned: boolean
  banned_at?: string
  created_at: string
  updated_at: string
  condominium?: Condominium
}

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  sort_order: number
}

export interface AnnouncementImage {
  id: string
  announcement_id: string
  storage_path: string
  url: string
  sort_order: number
  is_cover: boolean
  created_at: string
}

export interface AnnouncementItem {
  id: string
  announcement_id: string
  name: string
  price?: number
  description?: string
  image_url?: string
  storage_path?: string
  sort_order: number
  created_at: string
}

export interface AnnouncementLink {
  id: string
  announcement_id: string
  url: string
  title?: string
  sort_order: number
}

export interface AnnouncementWhatsAppContact {
  id: string
  announcement_id: string
  number: string
  description?: string
  sort_order: number
}

export interface BusinessDaySchedule {
  open: boolean
  start: string  // HH:MM
  end: string    // HH:MM
}

export interface BusinessSchedule {
  mon: BusinessDaySchedule
  tue: BusinessDaySchedule
  wed: BusinessDaySchedule
  thu: BusinessDaySchedule
  fri: BusinessDaySchedule
  sat: BusinessDaySchedule
  sun: BusinessDaySchedule
  holidays: BusinessDaySchedule & { message?: string }
}

export interface Announcement {
  id: string
  condominium_id: string
  author_id: string
  category_id: string
  type: AnnouncementType
  title: string
  description?: string
  price?: number
  price_negotiable: boolean
  status: AnnouncementStatus
  is_featured: boolean
  featured_until?: string
  views_count: number
  event_date?: string
  event_location?: string
  contact_type?: 'chat' | 'whatsapp'
  contact_whatsapp?: string
  // New fields
  subcategory?: string
  commerce_method?: string
  maps_link?: string
  business_open_time?: string  // HH:MM format (legacy — single time for all days)
  business_close_time?: string // HH:MM format (legacy — single time for all days)
  business_days?: string[]     // legacy active days list
  closed_on_holidays?: boolean // legacy holiday flag
  business_schedule?: BusinessSchedule // per-day schedule (takes priority)
  is_multi_item?: boolean
  is_paid: boolean
  paid_status?: PaidStatus
  paid_until?: string
  advertiser_id?: string
  created_at: string
  updated_at: string
  // Relations
  author?: Profile
  category?: Category
  images?: AnnouncementImage[]
  items?: AnnouncementItem[]
  links?: AnnouncementLink[]
  whatsapp_contacts?: AnnouncementWhatsAppContact[]
}

export interface Favorite {
  id: string
  user_id: string
  announcement_id: string
  created_at: string
  announcement?: Announcement
}

export interface Report {
  id: string
  announcement_id: string
  reporter_id: string
  reason: ReportReason
  description?: string
  status: ReportStatus
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  announcement?: Announcement
  reporter?: Profile
}

export interface Conversation {
  id: string
  announcement_id: string
  participant_a: string
  participant_b: string
  last_message_at: string
  created_at: string
  announcement?: Announcement
  other_participant?: Profile
  unread_count?: number
  last_message?: Message
  deleted_by_a: boolean
  deleted_by_b: boolean
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface Campaign {
  id: string
  created_by: string
  title: string
  description?: string
  image_url?: string
  target_url?: string
  starts_at: string
  ends_at: string
  is_active: boolean
  created_at: string
  condominiums?: Condominium[]
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body?: string
  data?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface Follow {
  follower_id: string
  followed_id: string
  created_at: string
}

export interface BlockedUser {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
  blocked_profile?: Profile
}

export interface AdMetricsSnapshot {
  id: string
  announcement_id: string
  author_id: string
  title: string
  type: AnnouncementType
  category_id?: string
  price?: number
  views_count: number
  conversation_count: number
  closed_at: string
  created_at: string
}

export interface AdvertiserCredits {
  id: string
  profile_id: string
  balance: number
  updated_at: string
}

export interface CreditPlan {
  id: string
  amount: number
  price: number
  is_popular: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  profile_id: string
  amount: number
  type: 'purchase' | 'usage'
  description?: string
  created_at: string
}

export interface AdInteraction {
  id: string
  announcement_id: string
  user_id?: string
  type: 'view' | 'click' | 'whatsapp_click'
  demographics: {
    gender?: string
    city?: string
    age_range?: string
    state?: string
    [key: string]: unknown
  }
  created_at: string
}

// Feed filter type
export interface FeedFilters {
  type?: AnnouncementType | 'all'
  category_id?: string
  search?: string
  page?: number
  dateFrom?: string
  dateTo?: string
  priceMin?: number
  priceMax?: number
  authorName?: string
}
