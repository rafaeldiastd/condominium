<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Eye,
  Calendar,
  User,
  Building2
} from 'lucide-vue-next'

const ads = ref<any[]>([])
const loading = ref(true)

async function fetchPendingAds() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, author:profiles!author_id(*), condominium:condominiums(*)')
      .eq('is_paid', true)
      .eq('paid_status', 'pending')
      .order('created_at', { ascending: true })

    if (error) throw error
    ads.value = data || []
  } catch (err) {
    console.error('Error fetching pending ads:', err)
  } finally {
    loading.value = false
  }
}

async function approveAd(ad: any) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({ 
        paid_status: 'active',
        status: 'active'
      })
      .eq('id', ad.id)

    if (error) throw error
    ads.value = ads.value.filter(a => a.id !== ad.id)
  } catch (err) {
    console.error('Error approving ad:', err)
  }
}

async function rejectAd(ad: any) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({ 
        paid_status: 'paused',
        status: 'hidden'
      })
      .eq('id', ad.id)

    if (error) throw error
    ads.value = ads.value.filter(a => a.id !== ad.id)
  } catch (err) {
    console.error('Error rejecting ad:', err)
  }
}

onMounted(fetchPendingAds)
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Aprovação de Anúncios</h2>
      <p class="text-gray-500 mt-1 text-sm">Revise os novos anúncios pagos antes de serem exibidos nos condominios.</p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-48 rounded-3xl bg-gray-100 animate-pulse"></div>
    </div>

    <div v-else-if="ads.length === 0" class="flex flex-col items-center justify-center p-20 rounded-[3rem] bg-gray-50 border border-dashed border-gray-200">
       <CheckCircle2 class="w-12 h-12 text-emerald-500/20 mb-4" />
       <p class="text-gray-400 font-medium">Nenhum anúncio pendente de aprovação.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6">
      <div 
        v-for="ad in ads" 
        :key="ad.id"
        class="bg-white border border-gray-200 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="w-full md:w-64 aspect-video md:aspect-square bg-gray-50 flex-shrink-0 flex items-center justify-center text-gray-200 border-r border-gray-100">
           <Eye class="w-12 h-12 opacity-50" />
        </div>

        <div class="p-8 flex-1 flex flex-col">
          <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">{{ ad.title }}</h3>
              <div class="flex flex-wrap gap-4 text-xs text-gray-500 font-medium">
                <span class="flex items-center gap-1.5">
                  <User class="w-4 h-4 text-gray-400" />
                  {{ ad.author?.full_name }}
                </span>
                <span class="flex items-center gap-1.5">
                  <Building2 class="w-4 h-4 text-gray-400" />
                  {{ ad.condominium?.name }}
                </span>
                <span class="flex items-center gap-1.5">
                  <Calendar class="w-4 h-4 text-gray-400" />
                  {{ new Date(ad.created_at).toLocaleDateString() }}
                </span>
              </div>
            </div>
            <div class="px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold text-sm shadow-sm">
              {{ ad.paid_until ? Math.ceil((new Date(ad.paid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0 }} Dias solicitados
            </div>
          </div>

          <p class="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-8">
            {{ ad.description }}
          </p>

          <div class="mt-auto flex flex-wrap gap-3 pt-6 border-t border-gray-50">
            <button 
              @click="approveAd(ad)"
              class="flex-1 md:flex-none px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              <CheckCircle2 class="w-5 h-5" />
              Aprovar
            </button>
            <button 
              @click="rejectAd(ad)"
              class="flex-1 md:flex-none px-8 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <XCircle class="w-5 h-5" />
              Rejeitar
            </button>
            <RouterLink 
              :to="`/${ad.condominium?.slug}/announcements/${ad.id}`"
              target="_blank"
              class="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink class="w-5 h-5" />
              Ver Detalhes
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
