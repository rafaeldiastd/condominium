import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Iniciando checkout session...")
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY não configurada!")
      throw new Error("Configuração ausente: STRIPE_SECRET_KEY")
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { amount, profile_id, success_url, cancel_url } = await req.json()
    console.log(`Pacote: ${amount}, Usuário: ${profile_id}`)

    // Package pricing (in cents)
    const prices: Record<number, number> = {
      10: 1000,  // R$ 10
      50: 4500,  // R$ 45
      100: 8000, // R$ 80
    }

    const unitAmount = prices[amount]
    if (!unitAmount) {
      throw new Error(`Pacote inválido: ${amount}`)
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `${amount} Créditos - Condomiinus`,
              description: `Adquira ${amount} créditos para destacar anúncios`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        profile_id,
        amount: amount.toString(),
      },
    })

    console.log("Sessão criada:", session.id)

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Erro na função checkout:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
