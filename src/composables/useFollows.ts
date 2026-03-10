import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

// Global state shared across all components
const followingIds = ref<Set<string>>(new Set())
const loading = ref(false)

export function useFollows() {
  const authStore = useAuthStore()

  async function loadFollowingIds(): Promise<void> {
    if (!authStore.user) return
    const { data } = await supabase
      .from('follows')
      .select('followed_id')
      .eq('follower_id', authStore.user.id)
    followingIds.value = new Set(data?.map(f => f.followed_id) ?? [])
  }

  async function toggleFollow(userId: string): Promise<void> {
    if (!authStore.user || authStore.user.id === userId) return

    const isFollowing = followingIds.value.has(userId)

    // Optimistic update
    if (isFollowing) {
      followingIds.value.delete(userId)
    } else {
      followingIds.value.add(userId)
    }

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', authStore.user.id)
        .eq('followed_id', userId)
    } else {
      loading.value = true
      await supabase
        .from('follows')
        .insert({ follower_id: authStore.user.id, followed_id: userId })
      loading.value = false
    }
  }

  async function getFollowersCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('followed_id', userId)
    return count ?? 0
  }

  function isFollowing(userId: string): boolean {
    return followingIds.value.has(userId)
  }

  return {
    followingIds,
    loading,
    loadFollowingIds,
    toggleFollow,
    getFollowersCount,
    isFollowing,
  }
}
