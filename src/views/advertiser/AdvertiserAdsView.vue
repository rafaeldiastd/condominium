<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Pause, 
  Play, 
  ExternalLink,
  Eye,
  MousePointer2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Trash2
} from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useCreditsStore } from '@/stores/credits'

const authStore = useAuthStore()
const uiStore = useUIStore()
const creditsStore = useCreditsStore()
const ads = ref<any[]>([])
const loading = ref(true)
const search = ref('')

async function fetchAds() {
  if (!authStore.user?.id) return
  
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, categories(name), images:announcement_images(url)')
      .eq('advertiser_id', authStore.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    ads.value = data || []
  } catch (err) {
    console.error('Error fetching ads:', err)
  } finally {
    loading.value = false
  }
}

async function toggleAdStatus(ad: any) {
  if (ad.paid_status === 'pending') {
    uiStore.showToast('Ative o anúncio para publicá-lo', 'info')
    return
  }

  const newStatus = ad.status === 'active' ? 'paused' : 'active'
  try {
    const { error } = await supabase
      .from('announcements')
      .update({ status: newStatus })
      .eq('id', ad.id)

    if (error) throw error
    ad.status = newStatus
  } catch (err) {
    console.error('Error updating ad status:', err)
  }
}

async function activateAd(ad: any) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({ 
        status: 'active',
        paid_status: 'active'
      })
      .eq('id', ad.id)

    if (error) throw error
    
    ad.status = 'active'
    ad.paid_status = 'active'
    uiStore.showToast('Anúncio ativado com sucesso!', 'success')
  } catch (err) {
    console.error('Error activating ad:', err)
    uiStore.showToast('Erro ao ativar anúncio', 'error')
  }
}

async function deletePaidAd(ad: any) {
  if (ad.paid_status === 'active') return

  if (!confirm('Deseja realmente excluir este anúncio? Os créditos serão devolvidos.')) return

  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', ad.id)

    if (error) throw error

    // Refund credits
    await creditsStore.refundCredits(
      ad.duration_days,
      `Reembolso: Exclusão de anúncio "${ad.title}"`
    )

    ads.value = ads.value.filter(a => a.id !== ad.id)
    uiStore.showToast('Anúncio excluído e créditos devolvidos.', 'success')
  } catch (err) {
    console.error('Error deleting ad:', err)
    uiStore.showToast('Erro ao excluir anúncio', 'error')
  }
}

onMounted(fetchAds)

const getStatusColor = (ad: any) => {
  if (ad.paid_status === 'pending') return 'bg-orange-100 text-orange-700 border-orange-200'
  
  switch (ad.status) {
    case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'paused': return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'expired': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

const getStatusLabel = (ad: any) => {
  if (ad.paid_status === 'pending') return 'Em Análise'
  switch (ad.status) {
    case 'active': return 'Ativo'
    case 'paused': return 'Pausado'
    case 'expired': return 'Expirado'
    case 'hidden': return 'Oculto'
    default: return ad.status
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Meus Anúncios</h2>
        <p class="text-gray-500 mt-1">Gerencie suas campanhas e acompanhe o desempenho em tempo real.</p>
      </div>
      <RouterLink 
        to="/anunciante/anuncios/novo"
        class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/10 transition-all font-bold text-white text-sm"
      >
        <Plus class="w-5 h-5" />
        Novo Anúncio Pago
      </RouterLink>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          v-model="search"
          type="text" 
          placeholder="Pesquisar por título ou categoria..." 
          class="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none text-gray-900 placeholder:text-gray-400 shadow-sm"
        />
      </div>
      <button class="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 font-medium shadow-sm">
        <Filter class="w-5 h-5" />
        Filtros
      </button>
    </div>

    <!-- Ads List -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
       <div v-for="i in 6" :key="i" class="h-64 rounded-2xl bg-gray-200 animate-pulse"></div>
    </div>

    <div v-else-if="ads.length === 0" class="flex flex-col items-center justify-center p-16 rounded-3xl bg-white border border-dashed border-gray-300 text-center shadow-sm">
      <div class="p-5 rounded-full bg-gray-50 mb-6 text-gray-300">
        <AlertCircle class="w-12 h-12" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 mb-2">Sem anúncios patrocinados</h3>
      <p class="text-gray-500 max-w-xs mx-auto mb-8 text-sm">
        Você ainda não criou nenhum anúncio prioritário. Clique no botão acima para começar.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div 
        v-for="ad in ads" 
        :key="ad.id"
        class="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-blue-300 transition-all duration-300 hover:shadow-lg flex flex-col shadow-sm"
      >
        <!-- Ad Preview Image Placeholder -->
        <div class="aspect-video bg-gray-100 relative overflow-hidden flex-shrink-0 border-b border-gray-100">
          <img 
            v-if="ad.images?.[0]?.url" 
            :src="ad.images[0].url" 
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div v-else class="absolute inset-0 flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform duration-700">
             <Eye class="w-10 h-10 opacity-30" />
          </div>
          <!-- Status Badge -->
          <div class="absolute top-3 right-3 z-10">
            <span 
              class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm"
              :class="getStatusColor(ad)"
            >
              {{ getStatusLabel(ad) }}
            </span>
          </div>
          <!-- Category Label -->
          <span class="absolute bottom-3 left-3 px-2 py-1 rounded bg-white/90 backdrop-blur-md text-[10px] font-bold text-gray-600 uppercase tracking-widest shadow-sm">
            {{ ad.categories?.name || 'Geral' }}
          </span>
        </div>

        <!-- Content -->
        <div class="p-5 flex-1 flex flex-col">
          <h4 class="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
            {{ ad.title }}
          </h4>
          
          <div class="flex items-center gap-4 text-[11px] text-gray-500 mb-6">
            <span class="flex items-center gap-1 font-medium">
              <Eye class="w-3.5 h-3.5" />
              {{ ad.views_count }} views
            </span>
            <span class="flex items-center gap-1 font-medium">
               <Calendar class="w-3.5 h-3.5" />
               Expira {{ new Date(ad.paid_until).toLocaleDateString() }}
            </span>
            <RouterLink 
              :to="`/anunciante/anuncios/${ad.id}/metricas`"
              class="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700"
            >
              <TrendingUp class="w-3.5 h-3.5" />
              Ver Métricas
            </RouterLink>
          </div>

          <div class="mt-auto flex flex-col gap-3 pt-4 border-t border-gray-100">
             <!-- Activation Button (Only for pending) -->
             <button 
                v-if="ad.paid_status === 'pending'"
                @click="activateAd(ad)"
                class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10"
             >
                <TrendingUp class="w-3.5 h-3.5" />
                Ativar Agora
             </button>

             <div class="space-y-3">
               <!-- Main Actions (Active Ads) -->
               <div v-if="ad.paid_status === 'active'" class="flex flex-col gap-3">
                  <button 
                    @click="toggleAdStatus(ad)"
                    class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all font-premium shadow-sm"
                  >
                    <component :is="ad.status === 'active' ? Pause : Play" class="w-4 h-4" />
                    {{ ad.status === 'active' ? 'Pausar Visualização' : 'Resumir Visualização' }}
                  </button>
                  <div class="w-full text-center py-2.5 px-3 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100/50">
                    Anúncio Ativado (Não editável)
                  </div>
               </div>

               <!-- Pending Actions -->
               <div v-else class="grid grid-cols-2 gap-3">
                 <RouterLink 
                    :to="`/anunciante/anuncios/${ad.id}/editar`"
                    class="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                 >
                    Editar
                 </RouterLink>
                 <button 
                    @click="deletePaidAd(ad)"
                    class="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all shadow-sm"
                 >
                    <Trash2 class="w-3.5 h-3.5" />
                    Excluir
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
