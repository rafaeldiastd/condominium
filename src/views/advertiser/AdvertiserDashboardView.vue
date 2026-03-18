<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCreditsStore } from '@/stores/credits'
import { supabase } from '@/lib/supabase'
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer2, 
  Plus, 
  ArrowUpRight,
  Clock,
  AlertCircle,
  Megaphone,
  Wallet
} from 'lucide-vue-next'

const authStore = useAuthStore()
const creditsStore = useCreditsStore()

const stats = ref([
  { name: 'Anúncios Ativos', value: '0', icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { name: 'Visualizações Totais', value: '0', icon: Eye, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { name: 'Cliques Totais', value: '0', icon: MousePointer2, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { name: 'CTR Médio', value: '0%', icon: ArrowUpRight, color: 'text-orange-600', bgColor: 'bg-orange-50' },
])

const recentAds = ref<any[]>([])
const loading = ref(true)

async function fetchDashboardData() {
  if (!authStore.user?.id) return
  
  loading.value = true
  try {
    const { data: ads, error: adsError } = await supabase
      .from('announcements')
      .select('id, title, status, paid_until, views_count, is_paid')
      .eq('advertiser_id', authStore.user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (adsError) throw adsError
    recentAds.value = ads || []

    // Fetch Summary for ALL ads of this advertiser
    const { data: interactionSummary } = await supabase
      .from('ad_analytics_summary')
      .select('total_views, total_clicks, total_whatsapp_clicks')
      .in('announcement_id', ads?.map(a => a.id) || [])

    const views = interactionSummary?.reduce((acc, current) => acc + (current.total_views || 0), 0) || 0
    const clicks = interactionSummary?.reduce((acc, current) => acc + (current.total_clicks || 0) + (current.total_whatsapp_clicks || 0), 0) || 0
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0'

    if (stats.value[0]) stats.value[0].value = ads?.filter(a => a.status === 'active').length.toString() || '0'
    if (stats.value[1]) stats.value[1].value = views.toLocaleString()
    if (stats.value[2]) stats.value[2].value = clicks.toLocaleString()
    if (stats.value[3]) stats.value[3].value = `${ctr}%`

  } catch (err) {
    console.error('Error fetching dashboard data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
  creditsStore.fetchCredits()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">
          Olá, {{ authStore.profile?.full_name?.split(' ')[0] }}! 👋
        </h2>
        <p class="text-gray-500 mt-1">Bem-vindo ao seu painel de anúncios prioritários.</p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink 
          to="/anunciante/creditos"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all font-medium text-sm text-gray-700 shadow-sm"
        >
          <Plus class="w-4 h-4" />
          Adicionar Créditos
        </RouterLink>
        <RouterLink 
          to="/anunciante/anuncios/novo"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/10 transition-all font-bold text-sm"
        >
          Criar Anúncio Pago
        </RouterLink>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div 
        v-for="stat in stats" 
        :key="stat.name"
        class="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between mb-3">
          <div :class="['p-2.5 rounded-xl', stat.bgColor]">
            <component :is="stat.icon" :class="['w-5 h-5', stat.color]" />
          </div>
          <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Geral</span>
        </div>
        <div class="space-y-0.5">
          <p class="text-xl font-bold text-gray-900">{{ stat.value }}</p>
          <p class="text-xs text-gray-500 font-medium">{{ stat.name }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Recent Ads -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-900">Anúncios Recentes</h3>
          <RouterLink to="/anunciante/anuncios" class="text-sm text-blue-600 hover:underline font-medium">Ver todos</RouterLink>
        </div>

        <div v-if="loading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-20 rounded-2xl bg-gray-200 animate-pulse"></div>
        </div>

        <div v-else class="grid grid-cols-1 gap-4">
          <RouterLink 
            v-for="ad in recentAds" 
            :key="ad.id"
            :to="`/anunciante/anuncios/${ad.id}/metricas`"
            class="group p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center gap-4 shadow-sm"
          >
            <div class="w-14 h-14 rounded-xl bg-gray-50 flex-shrink-0 flex items-center justify-center text-gray-300 overflow-hidden border border-gray-100 relative group-hover:scale-105 transition-transform">
               <img v-if="ad.images?.[0]?.url" :src="ad.images[0].url" class="w-full h-full object-cover" />
               <Eye v-else class="w-5 h-5 opacity-40" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-gray-900 truncate text-sm">{{ ad.title }}</h4>
              <div v-if="ad.paid_until" class="flex items-center gap-2 mt-1">
                <span 
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  :class="{
                    'bg-emerald-100 text-emerald-700': ad.status === 'active',
                    'bg-orange-100 text-orange-700': ad.status === 'pending',
                    'bg-red-100 text-red-700': ad.status === 'paused'
                  }"
                >
                  {{ ad.status }}
                </span>
                <span class="text-[10px] text-gray-500 flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  Expira {{ new Date(ad.paid_until).toLocaleDateString() }}
                </span>
              </div>
            </div>
            <div class="text-right flex flex-col items-end gap-1">
               <div class="p-1 px-2 rounded-lg bg-blue-50 text-blue-600">
                  <ArrowUpRight class="w-3.5 h-3.5" />
               </div>
               <span class="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Detalhes</span>
            </div>
          </RouterLink>
        </div>
      </div>

      <!-- Quick Tips / Credit Status -->
      <div class="space-y-6">
        <h3 class="text-lg font-bold text-gray-900">Seu Saldo</h3>
        
        <div class="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/10 relative overflow-hidden group border border-blue-500">
          <div class="relative z-10 space-y-4">
            <div class="flex items-center justify-between">
              <Wallet class="w-7 h-7 text-white/40" />
              <div class="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white">Ativo</div>
            </div>
            <div>
              <p class="text-blue-100 text-xs font-medium uppercase tracking-wider">Pontos de Destaque</p>
              <p class="text-3xl font-black text-white mt-1">{{ creditsStore.balance }}</p>
            </div>
            <RouterLink 
              to="/anunciante/creditos"
              class="block w-full text-center py-2.5 bg-white text-blue-600 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Recarregar Créditos
            </RouterLink>
          </div>
          <!-- Decorative element -->
          <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        </div>

        <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
          <div class="flex items-center gap-2 text-orange-600">
            <AlertCircle class="w-5 h-5" />
            <h4 class="font-bold text-sm">Dica Pro</h4>
          </div>
          <p class="text-gray-600 text-xs leading-relaxed">
            Anúncios com fotos em alta qualidade convertem até 3x mais que anúncios sem imagem. Não esqueça de caprichar na capa!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
