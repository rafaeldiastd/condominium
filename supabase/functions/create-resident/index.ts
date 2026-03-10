import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateResidentPayload {
  email: string
  full_name: string
  unit?: string
  phone?: string
  condominium_id: string
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // Initialize Supabase with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the caller is a syndic of this condominium
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller } } = await supabaseClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    const payload: CreateResidentPayload = await req.json()

    // Verify caller is syndic of the target condominium
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, condominium_id')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || (
      callerProfile.role !== 'super_admin' &&
      !(callerProfile.role === 'syndic' && callerProfile.condominium_id === payload.condominium_id)
    )) {
      return new Response(JSON.stringify({ error: 'Sem permissão para criar moradores neste condomínio' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create the user in Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      email_confirm: false,
      user_metadata: {
        full_name: payload.full_name,
        role: 'resident',
        condominium_id: payload.condominium_id,
      },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Update profile with additional data
    if (payload.unit || payload.phone) {
      await supabaseAdmin
        .from('profiles')
        .update({ unit: payload.unit, phone: payload.phone })
        .eq('id', newUser.user.id)
    }

    // Send invite email
    await supabaseAdmin.auth.admin.inviteUserByEmail(payload.email, {
      data: {
        full_name: payload.full_name,
        role: 'resident',
        condominium_id: payload.condominium_id,
      },
    })

    return new Response(
      JSON.stringify({ user_id: newUser.user.id, message: 'Morador criado com sucesso. Email de convite enviado.' }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
