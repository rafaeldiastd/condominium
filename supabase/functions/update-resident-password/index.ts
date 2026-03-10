import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface UpdatePasswordPayload {
  user_id: string
  new_password: string
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the caller is a syndic
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

    const payload: UpdatePasswordPayload = await req.json()
    if (!payload.user_id || !payload.new_password) {
      return new Response(JSON.stringify({ error: 'Faltam dados: user_id ou new_password' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }
    if (payload.new_password.length < 6) {
      return new Response(JSON.stringify({ error: 'A nova senha deve ter pelo menos 6 caracteres' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Getting caller profile to check capabilities
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, condominium_id')
      .eq('id', caller.id)
      .single()

    if (!callerProfile) {
      return new Response(JSON.stringify({ error: 'Acesso negado: Perfil não encontrado' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Getting target user profile
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('condominium_id, role')
      .eq('id', payload.user_id)
      .single()

    if (!targetProfile) {
      return new Response(JSON.stringify({ error: 'Usuário alvo não encontrado' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      })
    }

    if (
      callerProfile.role !== 'super_admin' &&
      !(callerProfile.role === 'syndic' && callerProfile.condominium_id === targetProfile.condominium_id)
    ) {
      return new Response(JSON.stringify({ error: 'Sem permissão para alterar a senha deste morador' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Prevent syndic from changing other syndics or super_admins passwords, to prevent abuse
    if (callerProfile.role === 'syndic' && targetProfile.role !== 'resident') {
      return new Response(JSON.stringify({ error: 'Síndicos só podem alterar senhas de moradores' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      })
    }

    // Update the password in Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      payload.user_id,
      { password: payload.new_password }
    )

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(
      JSON.stringify({ message: 'Senha atualizada com sucesso.' }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
