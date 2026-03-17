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

/**
 * Returns true if the business is currently open.
 * Checks: business_days (today's weekday), time range, and closed_on_holidays logic.
 * If no hours or days are set, returns true (always open).
 */
export function isBusinessOpen(
  openTime?: string | null,
  closeTime?: string | null,
  businessDays?: string[] | null,
  _closedOnHolidays?: boolean | null,
): boolean {
  const now = new Date()

  // Check business days
  if (businessDays && businessDays.length > 0) {
    const todayKey = DAY_INDEX_MAP[now.getDay()]
    if (!todayKey || !businessDays.includes(todayKey)) return false
  }

  // Check time range
  if (!openTime || !closeTime) return true

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const parts = openTime.split(':')
  const parts2 = closeTime.split(':')
  const openH = Number(parts[0] ?? 0)
  const openM = Number(parts[1] ?? 0)
  const closeH = Number(parts2[0] ?? 0)
  const closeM = Number(parts2[1] ?? 0)

  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  if (closeMinutes > openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes
  } else {
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes
  }
}
