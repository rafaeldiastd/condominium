import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateSyndicPayload {
  email: string
  full_name: string
  condominium_id: string
  phone?: string
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autorizado' }, 401)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller } } = await supabaseClient.auth.getUser()
    if (!caller) return json({ error: 'Não autorizado' }, 401)

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'super_admin') {
      return json({ error: 'Apenas administradores podem criar síndicos' }, 403)
    }

    const payload: CreateSyndicPayload = await req.json()

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      payload.email,
      {
        data: {
          full_name: payload.full_name,
          role: 'syndic',
          condominium_id: payload.condominium_id,
        },
      }
    )

    if (createError) return json({ error: createError.message }, 400)

    if (payload.phone) {
      await supabaseAdmin
        .from('profiles')
        .update({ phone: payload.phone })
        .eq('id', newUser.user.id)
    }

    return json({ user_id: newUser.user.id, message: 'Síndico criado. Email de convite enviado.' })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Erro interno' }, 500)
  }
})
