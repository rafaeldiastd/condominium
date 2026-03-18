import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useAdTracking() {
  const authStore = useAuthStore()

  async function trackInteraction(
    announcementId: string,
    type: 'view' | 'click' | 'whatsapp_click'
  ) {
    const profile = authStore.profile

    const demographics = {
      gender: profile?.gender || 'not_specified',
      city: profile?.city || 'not_specified',
      state: profile?.state || 'not_specified',
      age_range: calculateAgeRange(profile?.birth_date),
      is_authenticated: !!authStore.user
    }

    try {
      const { error } = await supabase.from('ad_interactions').insert({
        announcement_id: announcementId,
        user_id: authStore.user?.id || null,
        type,
        demographics
      })

      if (error) throw error
    } catch (err) {
      console.error(`Error tracking ${type} for ad ${announcementId}:`, err)
    }
  }

  function calculateAgeRange(birthDate?: string): string {
    if (!birthDate) return 'not_specified'

    const birth = new Date(birthDate)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--
    }

    if (age < 18) return 'under_18'
    if (age <= 24) return '18_24'
    if (age <= 34) return '25_34'
    if (age <= 44) return '35_44'
    if (age <= 54) return '45_54'
    if (age <= 64) return '55_64'
    return '65_plus'
  }

  return {
    trackInteraction
  }
}
