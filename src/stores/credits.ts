import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { AdvertiserCredits, CreditTransaction } from '@/types/app.types'

export const useCreditsStore = defineStore('credits', () => {
  const authStore = useAuthStore()
  const credits = ref<AdvertiserCredits | null>(null)
  const transactions = ref<CreditTransaction[]>([])
  const loading = ref(false)

  const balance = computed(() => credits.value?.balance ?? 0)

  async function fetchCredits() {
    if (!authStore.user?.id) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('advertiser_credits')
        .select('*')
        .eq('profile_id', authStore.user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
      credits.value = data
    } catch (err) {
      console.error('Error fetching credits:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactions() {
    if (!authStore.user?.id) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('profile_id', authStore.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      transactions.value = data
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      loading.value = false
    }
  }

  async function createCheckoutSession(amount: number) {
    if (!authStore.user?.id) return

    loading.value = true
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          amount, 
          profile_id: authStore.user.id,
          success_url: `${window.location.origin}/anunciante/creditos?success=true`,
          cancel_url: `${window.location.origin}/anunciante/creditos?canceled=true`
        }
      })

      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error creating checkout session:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function useCredits(amount: number, description: string) {
    if (!authStore.user?.id || !credits.value || credits.value.balance < amount) {
      throw new Error('Saldo insuficiente')
    }

    try {
      // 1. Update balance
      const { error: updateError } = await supabase
        .from('advertiser_credits')
        .update({ 
          balance: Number(credits.value.balance) - amount,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', authStore.user.id)

      if (updateError) throw updateError

      // 2. Add transaction record
      const { error: transError } = await supabase
        .from('credit_transactions')
        .insert({
          profile_id: authStore.user.id,
          amount: -amount,
          type: 'usage',
          description
        })

      if (transError) throw transError

      // Refresh data
      await fetchCredits()
      await fetchTransactions()
    } catch (err) {
      console.error('Error using credits:', err)
      throw err
    }
  }

  return {
    credits,
    transactions,
    loading,
    balance,
    fetchCredits,
    fetchTransactions,
    createCheckoutSession,
    useCredits
  }
})
