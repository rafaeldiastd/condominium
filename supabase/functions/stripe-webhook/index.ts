import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error("Assinatura do Stripe ausente!")
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()

    // Use the asynchronous version of constructEvent to avoid SubtleCryptoProvider errors in Deno
    const cryptoProvider = Stripe.createSubtleCryptoProvider()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider
    )

    console.log(`Evento recebido: ${event.type}`)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any

      console.log(`Sessão completada: ${session.id}`)

      if (session.payment_status !== 'paid') {
        console.warn(`Pagamento não confirmado para sessão ${session.id}: ${session.payment_status}`)
        return new Response(JSON.stringify({ received: true, status: 'not_paid' }), { status: 200 })
      }

      const metadata = session.metadata
      if (!metadata || !metadata.profile_id || !metadata.amount) {
        console.error("Metadados ausentes ou incompletos na sessão do Stripe!", metadata)
        throw new Error("Metadados inválidos")
      }

      const { profile_id, amount } = metadata
      const creditAmount = parseInt(amount)

      if (isNaN(creditAmount)) {
        console.error(`Quantidade de créditos inválida: ${amount}`)
        throw new Error("Quantidade de créditos inválida")
      }

      console.log(`Processando pagamento: ${creditAmount} créditos para o perfil ${profile_id}`)

      // 1. Update or Create advertiser_credits
      const { data: credits, error: fetchError } = await supabaseAdmin
        .from('advertiser_credits')
        .select('balance')
        .eq('profile_id', profile_id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`Erro ao buscar créditos para ${profile_id}:`, fetchError)
        throw fetchError
      }

      if (credits) {
        console.log(`Atualizando saldo existente de ${credits.balance} para ${Number(credits.balance) + creditAmount}`)
        const { error: updateError } = await supabaseAdmin
          .from('advertiser_credits')
          .update({
            balance: Number(credits.balance) + creditAmount,
            updated_at: new Date().toISOString()
          })
          .eq('profile_id', profile_id)

        if (updateError) {
          console.error("Erro ao atualizar advertiser_credits:", updateError)
          throw updateError
        }
      } else {
        console.log(`Criando novo registro de créditos para ${profile_id} com saldo ${creditAmount}`)
        const { error: insertError } = await supabaseAdmin
          .from('advertiser_credits')
          .insert({
            profile_id: profile_id,
            balance: creditAmount
          })

        if (insertError) {
          console.error("Erro ao inserir em advertiser_credits:", insertError)
          throw insertError
        }
      }

      // 2. Add transaction record
      console.log(`Registrando transação de compra para ${profile_id}`)
      const { error: transError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
          profile_id: profile_id,
          amount: creditAmount,
          type: 'purchase',
          description: `Compra via Stripe: ${creditAmount} créditos`
        })

      if (transError) {
        console.error("Erro ao registrar transação:", transError)
        throw transError
      }

      console.log(`Créditos creditados com sucesso para ${profile_id}!`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`)
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }
})
