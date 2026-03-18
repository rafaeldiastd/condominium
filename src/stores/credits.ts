import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { AdvertiserCredits, CreditTransaction, CreditPlan } from '@/types/app.types'

export const useCreditsStore = defineStore('credits', () => {
  const authStore = useAuthStore()
  const credits = ref<AdvertiserCredits | null>(null)
  const transactions = ref<CreditTransaction[]>([])
  const plans = ref<CreditPlan[]>([])
  const loading = ref(false)
  const loadingPlans = ref(false)

  const balance = computed(() => credits.value?.balance ?? 0)

  async function fetchCredits(retryCount = 0) {
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
      if (retryCount < 3) {
        console.log(`Retrying fetchCredits (${retryCount + 1})...`)
        await new Promise(resolve => setTimeout(resolve, 1500))
        return fetchCredits(retryCount + 1)
      }
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

  async function fetchPlans() {
    loadingPlans.value = true
    try {
      const { data, error } = await supabase
        .from('credit_plans')
        .select('*')
        .eq('is_active', true)
        .order('amount', { ascending: true })

      if (error) throw error
      plans.value = data
    } catch (err) {
      console.error('Error fetching credit plans:', err)
    } finally {
      loadingPlans.value = false
    }
  }

  async function fetchAllPlans() {
    loadingPlans.value = true
    try {
      const { data, error } = await supabase
        .from('credit_plans')
        .select('*')
        .order('amount', { ascending: true })

      if (error) throw error
      plans.value = data
    } catch (err) {
      console.error('Error fetching all credit plans:', err)
    } finally {
      loadingPlans.value = false
    }
  }

  async function savePlan(plan: Partial<CreditPlan>) {
    try {
      const isNew = !plan.id
      const { data, error } = isNew
        ? await supabase.from('credit_plans').insert(plan).select().single()
        : await supabase.from('credit_plans').update(plan).eq('id', plan.id).select().single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error saving credit plan:', err)
      throw err
    }
  }

  async function deletePlan(id: string) {
    try {
      const { error } = await supabase.from('credit_plans').delete().eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Error deleting credit plan:', err)
      throw err
    }
  }

  async function createCheckoutSession(planId: string) {
    if (!authStore.user?.id) return

    loading.value = true
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          plan_id: planId, 
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
    try {
      const { error } = await supabase.rpc('use_advertiser_credits', {
        p_amount: amount,
        p_description: description
      })

      if (error) throw error

      // Refresh data
      await fetchCredits()
      await fetchTransactions()
    } catch (err) {
      console.error('Error using credits:', err)
      throw err
    }
  }

  async function refundCredits(amount: number, description: string) {
    try {
      const { error } = await supabase.rpc('refund_advertiser_credits', {
        p_amount: amount,
        p_description: description
      })

      if (error) throw error

      // Refresh data
      await fetchCredits()
      await fetchTransactions()
    } catch (err) {
      console.error('Error refunding credits:', err)
      throw err
    }
  }

  return {
    credits,
    transactions,
    plans,
    loading,
    loadingPlans,
    balance,
    fetchCredits,
    fetchTransactions,
    fetchPlans,
    fetchAllPlans,
    savePlan,
    deletePlan,
    createCheckoutSession,
    useCredits,
    refundCredits
  }
})
