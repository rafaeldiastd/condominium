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

export const NATIONAL_HOLIDAYS = [
  '01-01', // Ano Novo
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência do Brasil
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '12-25', // Natal
]

export function isHoliday(date: Date = new Date()): boolean {
  return NATIONAL_HOLIDAYS.includes(date.toISOString().slice(5, 10))
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
 * Returns true if the business is currently open today.
 */
export function isBusinessOpen(
  scheduleOrOpen?: BusinessSchedule | string | null,
  closeTime?: string | null,
  businessDays?: string[] | null,
  closedOnHolidays?: boolean | null,
): boolean {
  const ts = getTodaySchedule(scheduleOrOpen, closeTime, businessDays, closedOnHolidays)
  if (!ts || !ts.open) return false
  if (!ts.start || !ts.end) return true // No time limits meaning open
  
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  
  const [sh, sm] = ts.start.split(':').map(Number)
  const [eh, em] = ts.end.split(':').map(Number)
  const startMin = (sh ?? 8) * 60 + (sm ?? 0)
  const endMin = (eh ?? 18) * 60 + (em ?? 0)

  if (endMin > startMin) return currentMinutes >= startMin && currentMinutes < endMin
  return currentMinutes >= startMin || currentMinutes < endMin
}

/**
 * Returns the schedule configuration specifically for today (considering holidays and current weekday).
 */
export function getTodaySchedule(
  scheduleOrOpen?: BusinessSchedule | string | null,
  closeTime?: string | null,
  businessDays?: string[] | null,
  closedOnHolidays?: boolean | null,
): { open: boolean, start: string, end: string, label: string } | null {
  const now = new Date()
  const todayIsHoliday = isHoliday(now)
  
  // ── New per-day schedule ──────────────────────────────────────────────────
  if (scheduleOrOpen && typeof scheduleOrOpen === 'object') {
    const schedule = scheduleOrOpen as BusinessSchedule
    
    if (todayIsHoliday && schedule.holidays) {
      if (!schedule.holidays.open) return { open: false, start: '', end: '', label: 'Feriado' }
      return { open: true, start: schedule.holidays.start, end: schedule.holidays.end, label: 'Feriado' }
    }
    
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const idx = now.getDay() as 0|1|2|3|4|5|6
    const dayKey = dayKeys[idx]
    const day = schedule[dayKey]
    if (!day) return null
    return { open: day.open, start: day.start, end: day.end, label: labels[idx] ?? '' }
  }

  // ── Legacy flat fields ────────────────────────────────────────────────────
  const openTime = typeof scheduleOrOpen === 'string' ? scheduleOrOpen : null
  if (!openTime || !closeTime) return null

  if (todayIsHoliday && closedOnHolidays) {
    return { open: false, start: openTime, end: closeTime, label: 'Feriado' }
  }

  const todayKey = DAY_INDEX_MAP[now.getDay()]
  if (!todayKey) return null
  
  const labelsMap: Record<string, string> = {
    sun: 'Dom', mon: 'Seg', tue: 'Ter', wed: 'Qua', thu: 'Qui', fri: 'Sex', sat: 'Sáb'
  }
  
  if (businessDays && businessDays.length > 0) {
    if (!businessDays.includes(todayKey)) {
      return { open: false, start: openTime, end: closeTime, label: labelsMap[todayKey] ?? '' }
    }
  }

  return { open: true, start: openTime, end: closeTime, label: labelsMap[todayKey] ?? '' }
}
