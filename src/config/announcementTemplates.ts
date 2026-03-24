import type { AnnouncementType } from '@/types/app.types'

export interface CommerceMethodOption {
  value: string
  label: string
}

export interface AnnouncementTemplate {
  showPriceField: boolean
  showItemsSection: boolean
  showCommerceMethod: boolean
  showBusinessHours: boolean
  showMapsLink: boolean
  subcategories: string[]
  /** Base commerce methods (before multi-item injection) */
  commerceMethods: CommerceMethodOption[]
}

export const SUBCATEGORIES: Record<string, string[]> = {
  sale: [
    'Alimentos',
    'Casa, Decoração e Utensílios',
    'Cosméticos',
    'Eletrônicos',
    'Infantil',
    'Pets',
    'Roupas',
    'Imóveis',
    'Autopeças',
    'Esporte',
    'Games',
    'Informática',
    'Outros',
  ],
  donation: [
    'Alimentos',
    'Casa, Decoração e Utensílios',
    'Cosméticos',
    'Eletrônicos',
    'Infantil',
    'Pets',
    'Roupas',
    'Imóveis',
    'Autopeças',
    'Esporte',
    'Games',
    'Informática',
    'Outros',
  ],
  service: [
    'Aulas',
    'Elétrica',
    'Hidráulica',
    'Jardinagem',
    'Limpeza',
    'Manutenção',
    'Marcenaria',
    'Pintura',
    'Outros',
  ],
}

export const COMMERCE_METHODS: Record<string, CommerceMethodOption[]> = {
  sale: [
    { value: 'price', label: 'Preço fixo' },
    { value: 'negotiable', label: 'A combinar' },
    { value: 'per_unit', label: 'Por unidade' },
    { value: 'per_lot', label: 'Por lote' },
  ],
  service: [
    { value: 'price', label: 'Preço fixo' },
    { value: 'negotiable', label: 'A combinar' },
    { value: 'per_hour', label: 'Por hora' },
    { value: 'per_visit', label: 'Por visita' },
  ],
  donation: [],
  donation_request: [],
  event: [],
  campaign: [],
}

/** Returns com methods for a given type, injecting "Tabelado" when isMultiItem is true */
export function getCommerceMethods(type: AnnouncementType, isMultiItem: boolean): CommerceMethodOption[] {
  const base = (COMMERCE_METHODS[type] ?? []) as CommerceMethodOption[]
  if (!isMultiItem) return base
  // When multi-item is on, offer "Tabelado" as first option (and keep the rest)
  const hasTabelado = base.some(m => m.value === 'tabelado')
  if (hasTabelado) return base
  return [{ value: 'tabelado', label: 'Tabelado (ver na lista)' }, ...base]
}

export const ANNOUNCEMENT_TEMPLATES: Record<AnnouncementType, AnnouncementTemplate> = {
  sale: {
    showPriceField: true,
    showItemsSection: true,
    showCommerceMethod: true,
    showBusinessHours: true,
    showMapsLink: true,
    subcategories: SUBCATEGORIES['sale'] as string[],
    commerceMethods: COMMERCE_METHODS['sale'] as CommerceMethodOption[],
  },
  donation: {
    showPriceField: false,
    showItemsSection: true,
    showCommerceMethod: false,
    showBusinessHours: false,
    showMapsLink: false,
    subcategories: SUBCATEGORIES['donation'] as string[],
    commerceMethods: [],
  },
  donation_request: {
    showPriceField: false,
    showItemsSection: false,
    showCommerceMethod: false,
    showBusinessHours: false,
    showMapsLink: false,
    subcategories: SUBCATEGORIES['donation'] as string[],
    commerceMethods: [],
  },
  service: {
    showPriceField: true,
    showItemsSection: true,
    showCommerceMethod: true,
    showBusinessHours: true,
    showMapsLink: true,
    subcategories: SUBCATEGORIES['service'] as string[],
    commerceMethods: COMMERCE_METHODS['service'] as CommerceMethodOption[],
  },
  event: {
    showPriceField: false,
    showItemsSection: false,
    showCommerceMethod: false,
    showBusinessHours: false,
    showMapsLink: true,
    subcategories: [],
    commerceMethods: [],
  },
  campaign: {
    showPriceField: false,
    showItemsSection: false,
    showCommerceMethod: false,
    showBusinessHours: false,
    showMapsLink: false,
    subcategories: [],
    commerceMethods: [],
  },
}

export const WEEK_DAYS = [
  { key: 'mon', label: 'Seg' },
  { key: 'tue', label: 'Ter' },
  { key: 'wed', label: 'Qua' },
  { key: 'thu', label: 'Qui' },
  { key: 'fri', label: 'Sex' },
  { key: 'sat', label: 'Sáb' },
  { key: 'sun', label: 'Dom' },
] as const

const DAY_INDEX_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

import type { BusinessSchedule, BusinessDaySchedule } from '@/types/app.types'

/** Creates a default per-day schedule (Mon–Fri open 08:00–18:00, Sat/Sun/Feriados closed) */
export function createDefaultSchedule(): BusinessSchedule {
  const open: BusinessDaySchedule = { open: true, start: '08:00', end: '18:00' }
  const closed: BusinessDaySchedule = { open: false, start: '08:00', end: '18:00' }
  return {
    mon: { ...open },
    tue: { ...open },
    wed: { ...open },
    thu: { ...open },
    fri: { ...open },
    sat: { ...closed },
    sun: { ...closed },
    holidays: { ...closed, message: '' },
  }
}

/**
 * Returns true if the business is currently open.
 * Priority: business_schedule (per-day) → legacy flat fields.
 */
export function isBusinessOpen(
  scheduleOrOpen?: BusinessSchedule | string | null,
  closeTime?: string | null,
  businessDays?: string[] | null,
  _closedOnHolidays?: boolean | null,
): boolean {
  const now = new Date()

  // ── New per-day schedule ──────────────────────────────────────────────────
  if (scheduleOrOpen && typeof scheduleOrOpen === 'object') {
    const schedule = scheduleOrOpen as BusinessSchedule
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
    const dayKey = dayKeys[now.getDay() as 0|1|2|3|4|5|6]
    const day = schedule[dayKey]
    if (!day) return true
    if (!day.open) return false

    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const [sh, sm] = day.start.split(':').map(Number)
    const [eh, em] = day.end.split(':').map(Number)
    const startMin = (sh ?? 8) * 60 + (sm ?? 0)
    const endMin = (eh ?? 18) * 60 + (em ?? 0)

    if (endMin > startMin) return currentMinutes >= startMin && currentMinutes < endMin
    return currentMinutes >= startMin || currentMinutes < endMin
  }

  // ── Legacy flat fields ────────────────────────────────────────────────────
  const openTime = typeof scheduleOrOpen === 'string' ? scheduleOrOpen : null

  if (businessDays && businessDays.length > 0) {
    const todayKey = DAY_INDEX_MAP[now.getDay()]
    if (!todayKey || !businessDays.includes(todayKey)) return false
  }

  if (!openTime || !closeTime) return true

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const [oh, om] = openTime.split(':').map(Number)
  const [ch, cm] = closeTime.split(':').map(Number)
  const openMinutes = (oh ?? 8) * 60 + (om ?? 0)
  const closeMinutes = (ch ?? 18) * 60 + (cm ?? 0)

  if (closeMinutes > openMinutes) return currentMinutes >= openMinutes && currentMinutes < closeMinutes
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes
}
