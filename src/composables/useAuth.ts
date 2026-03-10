import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isResident = computed(() => authStore.isResident)
  const isSyndic = computed(() => authStore.isSyndic)
  const isAdmin = computed(() => authStore.isAdmin)
  const isBanned = computed(() => authStore.isBanned)
  const profile = computed(() => authStore.profile)
  const user = computed(() => authStore.user)
  const loading = computed(() => authStore.loading)

  async function signIn(email: string, password: string) {
    await authStore.signIn(email, password)
  }


  async function signOut() {
    await authStore.signOut()
    await router.push('/login')
  }

  async function updateProfile(data: Parameters<typeof authStore.updateProfile>[0]) {
    await authStore.updateProfile(data)
  }

  return {
    isAuthenticated, isResident, isSyndic, isAdmin, isBanned,
    profile, user, loading,
    signIn, signOut, updateProfile,
  }
}
