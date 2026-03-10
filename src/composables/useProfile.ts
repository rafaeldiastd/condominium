import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Profile } from '@/types/app.types'

export function useProfile() {
  const authStore = useAuthStore()
  const uploading = ref(false)

  async function fetchProfileById(userId: string): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*, condominium:condominiums(*)')
      .eq('id', userId)
      .single()
    return data as Profile | null
  }

  async function uploadAvatar(file: File): Promise<string | null> {
    if (!authStore.user) return null
    uploading.value = true

    try {
      const ext = file.name.split('.').pop()
      const path = `${authStore.user.id}/avatar.${ext}`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = data.publicUrl

      await authStore.updateProfile({ avatar_url: avatarUrl })
      return avatarUrl
    } finally {
      uploading.value = false
    }
  }

  return {
    uploading,
    fetchProfileById,
    uploadAvatar,
  }
}
