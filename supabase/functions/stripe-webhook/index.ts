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
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )

    console.log(`Evento recebido: ${event.type}`)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const { profile_id, amount } = session.metadata

      const creditAmount = parseInt(amount)
      console.log(`Processando pagamento: ${creditAmount} créditos para ${profile_id}`)

      // 1. Update or Create advertiser_credits
      const { data: credits, error: fetchError } = await supabaseAdmin
        .from('advertiser_credits')
        .select('balance')
        .eq('profile_id', profile_id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      if (credits) {
        const { error: updateError } = await supabaseAdmin
          .from('advertiser_credits')
          .update({ 
            balance: Number(credits.balance) + creditAmount,
            updated_at: new Date().toISOString()
          })
          .eq('profile_id', profile_id)
        
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabaseAdmin
          .from('advertiser_credits')
          .insert({
            profile_id: profile_id,
            balance: creditAmount
          })
        
        if (insertError) throw insertError
      }

      // 2. Add transaction record
      const { error: transError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
          profile_id: profile_id,
          amount: creditAmount,
          type: 'purchase',
          description: `Compra via Stripe: ${creditAmount} créditos`
        })

      if (transError) throw transError
      console.log("Créditos atualizados com sucesso!")
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`)
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }
})
