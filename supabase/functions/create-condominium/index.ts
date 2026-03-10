import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateCondominiumPayload {
  name: string
  slug: string
  address?: string
  city?: string
  state?: string
  logo_url?: string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify caller is super_admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Não autorizado' }, 401)
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller } } = await supabaseClient.auth.getUser()
    if (!caller) {
      return json({ error: 'Não autorizado' }, 401)
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'super_admin') {
      return json({ error: 'Apenas administradores podem criar condomínios' }, 403)
    }

    const payload: CreateCondominiumPayload = await req.json()

    // Validate slug
    if (!/^[a-z0-9-]+$/.test(payload.slug)) {
      return json({ error: 'Slug inválido. Use apenas letras minúsculas, números e hífens.' }, 400)
    }

    const { data, error } = await supabaseAdmin
      .from('condominiums')
      .insert({
        name: payload.name,
        slug: payload.slug,
        address: payload.address,
        city: payload.city,
        state: payload.state,
        logo_url: payload.logo_url,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      const message = error.code === '23505'
        ? 'Este slug já está em uso. Escolha outro nome.'
        : error.message
      return json({ error: message }, 400)
    }

    return json({ condominium: data, message: 'Condomínio criado com sucesso.' })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro interno' }, 500)
  }
})
