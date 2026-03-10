// Este arquivo é gerado automaticamente via: supabase gen types typescript
// Execute após configurar o Supabase: npx supabase gen types typescript --project-id <id> > src/types/database.types.ts

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>

export type Database = {
  public: {
    Tables: {
      condominiums: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      profiles: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      categories: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      announcements: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      announcement_images: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      favorites: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      reports: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      conversations: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      messages: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      campaigns: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      campaign_condominiums: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
      notifications: { Row: AnyRow; Insert: AnyRow; Update: AnyRow }
    }
  }
}
