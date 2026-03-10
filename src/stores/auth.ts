import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/app.types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isResident = computed(() => profile.value?.role === 'resident')
  const isSyndic = computed(() => profile.value?.role === 'syndic' || profile.value?.role === 'super_admin')
  const isAdmin = computed(() => profile.value?.role === 'super_admin')
  const isBanned = computed(() => profile.value?.is_banned === true)
  const userCondominiumSlug = computed(() => profile.value?.condominium?.slug ?? null)

  async function initialize() {
    initialized.value = true
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user.value = session.user
      await fetchProfile()
    }
    supabase.auth.onAuthStateChange(async (event, session) => {
      user.value = session?.user ?? null

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user && !profile.value) {
          await fetchProfile()
        }
      } else if (event === 'SIGNED_OUT') {
        profile.value = null
      }
      // Note: We ignore 'TOKEN_REFRESHED' and 'USER_UPDATED' to prevent unnecessary fetches
      // that block the UI when returning to the tab.
    })
  }

  async function fetchProfile() {
    if (!user.value) return
    const { data } = await supabase
      .from('profiles')
      .select('*, condominium:condominiums(*)')
      .eq('id', user.value.id)
      .single()
    if (data) profile.value = data as Profile
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } finally {
      loading.value = false
    }
  }



  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  async function updateProfile(data: Partial<Profile>) {
    if (!user.value) return
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.value.id)
    if (!error) await fetchProfile()
  }

  return {
    user,
    profile,
    loading,
    initialized,
    isAuthenticated,
    isResident,
    isSyndic,
    isAdmin,
    isBanned,
    userCondominiumSlug,
    initialize,
    fetchProfile,
    signIn,
    signOut,
    updateProfile,
  }
})
