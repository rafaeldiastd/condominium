import { z } from 'zod'

export const announcementSchema = z.object({
  title: z.string().min(3, 'Título deve ter ao menos 3 caracteres').max(100, 'Título muito longo'),
  description: z.string().min(10, 'Descrição deve ter ao menos 10 caracteres').optional().or(z.literal('')),
  type: z.enum(['sale', 'service', 'donation', 'donation_request', 'campaign', 'event'], {
    required_error: 'Selecione o tipo do anúncio',
  }),
  category_id: z.string().uuid('Selecione uma categoria'),
  price: z.number().min(0, 'Preço deve ser positivo').optional().nullable(),
  price_negotiable: z.boolean().default(false),
  event_date: z.string().optional().nullable(),
  event_location: z.string().optional().nullable(),
})

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(100),
  unit: z.string().optional(),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

export const magicLinkSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const reportSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'fraud', 'duplicate', 'other'], {
    required_error: 'Selecione um motivo',
  }),
  description: z.string().max(500).optional(),
})

export const residentSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  unit: z.string().optional(),
  phone: z.string().optional(),
})

export const condominiumSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

export const campaignSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
  target_url: z.string().url('URL inválida').optional().or(z.literal('')),
  starts_at: z.string().min(1, 'Data de início obrigatória'),
  ends_at: z.string().min(1, 'Data de término obrigatória'),
  condominium_ids: z.array(z.string().uuid()).min(1, 'Selecione ao menos um condomínio'),
})

export type AnnouncementFormData = z.infer<typeof announcementSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type ReportFormData = z.infer<typeof reportSchema>
export type ResidentFormData = z.infer<typeof residentSchema>
export type CondominiumFormData = z.infer<typeof condominiumSchema>
export type CampaignFormData = z.infer<typeof campaignSchema>
