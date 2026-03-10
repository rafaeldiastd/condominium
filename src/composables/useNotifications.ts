import { useNotificationsStore } from '@/stores/notifications'
import { storeToRefs } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types/app.types'

export function useNotifications(userId: string) {
  const store = useNotificationsStore()
  const { notifications, unreadCount } = storeToRefs(store)

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    store.notifications = (data ?? []) as Notification[]
  }

  async function markRead(notificationId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    const n = store.notifications.find(n => n.id === notificationId)
    if (n) n.is_read = true
  }

  return { notifications, unreadCount, fetchNotifications, markRead, markAllRead: store.markAllRead }
}
