import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Report, ReportReason } from '@/types/app.types'
import { TABLE_PAGE_SIZE } from '@/utils/constants'
import { paginate } from '@/utils/supabase-helpers'

export function useReports(condominiumId: string) {
  const reports = ref<Report[]>([])
  const loading = ref(false)
  const total = ref(0)

  async function fetchReports(page = 1) {
    loading.value = true
    try {
      const { from, to } = paginate(page, TABLE_PAGE_SIZE)
      const { data, count } = await supabase
        .from('reports')
        .select('*, announcement:announcements!inner(*), reporter:profiles(*)', { count: 'exact' })
        .eq('announcement.condominium_id', condominiumId)
        .order('created_at', { ascending: false })
        .range(from, to)
      reports.value = (data ?? []) as Report[]
      total.value = count ?? 0
    } finally {
      loading.value = false
    }
  }

  async function submitReport(announcementId: string, reporterId: string, reason: ReportReason, description?: string) {
    await supabase
      .from('reports')
      .insert({ announcement_id: announcementId, reporter_id: reporterId, reason, description })
  }

  async function reviewReport(reportId: string, reviewedBy: string, status: 'reviewed' | 'dismissed') {
    await supabase
      .from('reports')
      .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
      .eq('id', reportId)
  }

  return { reports, loading, total, fetchReports, submitReport, reviewReport }
}
