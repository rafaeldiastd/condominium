import type { AnnouncementType, ReportReason, UserRole } from '@/types/app.types'

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  sale: 'Produto',
  service: 'Serviço',
  donation: 'Doação',
  donation_request: 'Pedido',
  campaign: 'Campanha',
  event: 'Evento',
}

export const ANNOUNCEMENT_TYPE_COLORS: Record<AnnouncementType, string> = {
  sale: 'bg-blue-100 text-blue-800',
  service: 'bg-purple-100 text-purple-800',
  donation: 'bg-green-100 text-green-800',
  donation_request: 'bg-orange-100 text-orange-800',
  campaign: 'bg-pink-100 text-pink-800',
  event: 'bg-yellow-100 text-yellow-800',
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam',
  inappropriate: 'Conteúdo inapropriado',
  fraud: 'Fraude ou golpe',
  duplicate: 'Anúncio duplicado',
  other: 'Outro motivo',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Administrador',
  syndic: 'Síndico',
  resident: 'Morador',
  advertiser: 'Anunciante',
}

export const FEED_PAGE_SIZE = 12
export const MESSAGES_PAGE_SIZE = 30
export const TABLE_PAGE_SIZE = 20
