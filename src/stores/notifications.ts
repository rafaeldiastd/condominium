import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Notification } from '@/types/app.types'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  let realtimeChannel: RealtimeChannel | null = null

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.is_read).length
  )

  async function fetchNotifications() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) notifications.value = data as Notification[]
  }

  function subscribeToNotifications() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    const userId = authStore.user.id

    // Remove canal anterior se existir
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
    }

    realtimeChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Insere nova notificação no topo sem refetch
          notifications.value.unshift(payload.new as Notification)
        }
      )
      .subscribe()
  }

  function unsubscribeFromNotifications() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  async function markAllRead() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', authStore.user.id)
      .eq('is_read', false)

    notifications.value.forEach(n => { n.is_read = true })
  }

  async function markOneRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    const n = notifications.value.find(n => n.id === id)
    if (n) n.is_read = true
  }

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    markAllRead,
    markOneRead,
  }
})
