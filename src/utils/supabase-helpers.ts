import type { PostgrestError } from '@supabase/supabase-js'

export class SupabaseError extends Error {
  code: string | undefined
  details: string | undefined

  constructor(message: string, code?: string, details?: string) {
    super(message)
    this.name = 'SupabaseError'
    this.code = code
    this.details = details
  }
}

export function handleSupabaseError(error: PostgrestError | null): never {
  if (error) {
    const messages: Record<string, string> = {
      '23505': 'Este registro já existe.',
      '23503': 'Registro relacionado não encontrado.',
      '42501': 'Você não tem permissão para realizar esta ação.',
      PGRST116: 'Registro não encontrado.',
    }
    const message = messages[error.code] ?? error.message ?? 'Ocorreu um erro inesperado.'
    throw new SupabaseError(message, error.code, error.details ?? undefined)
  }
  throw new SupabaseError('Ocorreu um erro inesperado.')
}

export function getStoragePublicUrl(
  baseUrl: string,
  bucket: string,
  path: string,
  transform?: { width?: number; height?: number; quality?: number },
): string {
  let url = `${baseUrl}/storage/v1/object/public/${bucket}/${path}`
  if (transform) {
    const params = new URLSearchParams()
    if (transform.width) params.set('width', String(transform.width))
    if (transform.height) params.set('height', String(transform.height))
    if (transform.quality) params.set('quality', String(transform.quality))
    const query = params.toString()
    if (query) url += `?${query}`
  }
  return url
}

export function paginate(page: number, pageSize: number) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to }
}
