<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { 
  ArrowLeft,
  Eye, 
  MousePointer2, 
  Users,
  PieChart,
  Calendar,
  TrendingUp,
  MessageSquare,
  Target,
  Sparkles,
  CheckCircle2,
  Heart
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const adId = route.params.id as string
const announcement = ref<any>(null)
const dailyData = ref<any[]>([])
const summary = ref<any>(null)

async function fetchAdMetrics() {
  if (!authStore.user?.id) return
  
  loading.value = true
  try {
    // 1. Fetch Ad details
    const { data: ad } = await supabase
      .from('announcements')
      .select('*, categories(name)')
      .eq('id', adId)
      .single()
    
    announcement.value = ad

    // 2. Fetch Summary
    const { data: summaryData } = await supabase
      .from('ad_analytics_summary')
      .select('*')
      .eq('announcement_id', adId)
      .single()
    
    summary.value = summaryData

    // 3. Fetch Daily Data (Last 14 days)
    const { data: daily } = await supabase
      .from('ad_daily_analytics')
      .select('*')
      .eq('announcement_id', adId)
      .order('interaction_date', { ascending: true })
      .limit(14)
    
    dailyData.value = daily || []

  } catch (err) {
    console.error('Error fetching ad metrics:', err)
  } finally {
    loading.value = false
  }
}

const ctr = computed(() => {
  if (!summary.value || summary.value.total_views === 0) return '0%'
  const totalClicks = (summary.value.total_clicks || 0) + (summary.value.total_whatsapp_clicks || 0)
  return ((totalClicks / summary.value.total_views) * 100).toFixed(1) + '%'
})

onMounted(fetchAdMetrics)
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button 
        @click="router.back()"
        class="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-900 transition-all shadow-sm"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Métricas do Anúncio</h2>
        <p class="text-gray-500 text-sm mt-0.5">Análise detalhada de desempenho e alcance.</p>
      </div>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-4 gap-4">
       <div v-for="i in 4" :key="i" class="h-32 rounded-2xl bg-gray-200 animate-pulse"></div>
    </div>

    <template v-else-if="announcement">
      <!-- Ad Overview Card -->
      <div class="p-6 rounded-3xl bg-white border border-gray-200 flex flex-col md:flex-row gap-6 shadow-sm">
        <div class="w-full md:w-48 aspect-video rounded-2xl bg-gray-100 overflow-hidden shrink-0">
           <img 
            v-if="announcement.images?.[0]?.url" 
            :src="announcement.images[0].url" 
            class="w-full h-full object-cover" 
           />
           <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
             <Target class="w-10 h-10 opacity-20" />
           </div>
        </div>
        <div class="flex-1 space-y-4">
           <div>
             <h3 class="text-xl font-bold text-gray-900">{{ announcement.title }}</h3>
             <p class="text-sm text-gray-500 mt-1">{{ announcement.categories?.name }} • Postado em {{ new Date(announcement.created_at).toLocaleDateString() }}</p>
           </div>
           <div class="flex flex-wrap gap-2">
              <span class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                {{ announcement.paid_status === 'active' ? 'Anúncio Ativo' : 'Pendente' }}
              </span>
              <span class="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest border border-gray-100">
                Expira em {{ new Date(announcement.paid_until).toLocaleDateString() }}
              </span>
           </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
          <div class="flex items-center justify-between">
             <div class="p-2.5 rounded-xl bg-blue-50 text-blue-600">
               <Eye class="w-5 h-5" />
             </div>
             <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Alcance</span>
          </div>
          <div>
            <p class="text-2xl font-black text-gray-900">{{ summary?.total_views || 0 }}</p>
            <p class="text-xs text-gray-500 font-medium">{{ summary?.unique_users || 0 }} usuários únicos</p>
          </div>
        </div>

        <div class="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
          <div class="flex items-center justify-between">
             <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
               <MousePointer2 class="w-5 h-5" />
             </div>
             <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Cliques</span>
          </div>
          <div>
            <p class="text-2xl font-black text-gray-900">{{ summary?.total_clicks || 0 }}</p>
            <p class="text-xs text-gray-500 font-medium">No card do anúncio</p>
          </div>
        </div>

        <div class="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
          <div class="flex items-center justify-between">
             <div class="p-2.5 rounded-xl bg-purple-50 text-purple-600">
               <MessageSquare class="w-5 h-5" />
             </div>
             <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">WhatsApp</span>
          </div>
          <div>
            <p class="text-2xl font-black text-gray-900">{{ summary?.total_whatsapp_clicks || 0 }}</p>
            <p class="text-xs text-gray-500 font-medium">Contatos diretos</p>
          </div>
        </div>

        <div class="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
          <div class="flex items-center justify-between">
             <div class="p-2.5 rounded-xl bg-red-50 text-red-600">
               <Heart class="w-5 h-5" />
             </div>
             <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Salvos</span>
          </div>
          <div>
            <p class="text-2xl font-black text-gray-900">{{ summary?.total_favorites || 0 }}</p>
            <p class="text-xs text-gray-500 font-medium">Favoritados</p>
          </div>
        </div>

        <div class="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
          <div class="flex items-center justify-between">
             <div class="p-2.5 rounded-xl bg-orange-50 text-orange-600">
               <TrendingUp class="w-5 h-5" />
             </div>
             <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">CTR</span>
          </div>
          <div>
            <p class="text-2xl font-black text-gray-900">{{ ctr }}</p>
            <p class="text-xs text-gray-500 font-medium">Conversão global</p>
          </div>
        </div>
      </div>

      <!-- Charts Area -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Daily Performance (Simple CSS Bar Chart) -->
        <div class="lg:col-span-2 p-8 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-8">
           <div class="flex items-center justify-between">
             <h3 class="font-bold text-gray-900 flex items-center gap-2">
               <TrendingUp class="w-5 h-5 text-blue-600" />
               Performance Diária (Últimos 14 dias)
             </h3>
           </div>
           
           <div class="h-64 flex items-end gap-2 md:gap-4 overflow-x-auto pb-4 scrollbar-hide">
              <div 
                v-for="day in dailyData" 
                :key="day.interaction_date"
                class="flex-1 min-w-[30px] flex flex-col items-center gap-3 group"
              >
                <div class="relative w-full flex flex-col-reverse gap-1 h-[200px]">
                   <div 
                     class="w-full bg-blue-600 rounded-t-md transition-all duration-500 group-hover:bg-blue-700"
                     :style="{ height: (day.views / (Math.max(...dailyData.map(d => d.views)) || 1) * 100) + '%' }"
                     :title="`${day.views} views`"
                   ></div>
                   <div 
                     class="w-full bg-emerald-400 rounded-t-sm"
                     :style="{ height: (day.clicks / (Math.max(...dailyData.map(d => d.views)) || 1) * 100) + '%' }"
                     :title="`${day.clicks} cliques`"
                   ></div>
                </div>
                <span class="text-[9px] font-bold text-gray-400 uppercase leading-none text-center">
                  {{ new Date(day.interaction_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) }}
                </span>
              </div>
              <div v-if="dailyData.length === 0" class="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 italic">
                 <Calendar class="w-8 h-8 opacity-20" />
                 <p class="text-xs">Aguardando dados de interação...</p>
              </div>
           </div>

           <div class="flex items-center gap-6 pt-4 border-t border-gray-50 justify-center">
              <div class="flex items-center gap-2">
                 <div class="w-3 h-3 rounded-full bg-blue-600"></div>
                 <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Views</span>
              </div>
              <div class="flex items-center gap-2">
                 <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                 <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cliques</span>
              </div>
           </div>
        </div>

        <!-- Conversion Target -->
        <div class="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/20 flex flex-col h-full">
           <div class="p-3 rounded-2xl bg-white/10 w-fit mb-6">
              <Sparkles class="w-6 h-6" />
           </div>
           <h3 class="text-xl font-bold mb-2">Dica de Conversão</h3>
           <p class="text-sm text-blue-100/80 leading-relaxed mb-8 flex-1">
             Anúncios com fotos reais e descrições detalhadas têm em média <span class="text-white font-bold underline">45% mais cliques</span> de WhatsApp. 
             Mantenha seu anúncio sempre atualizado!
           </p>
           
           <div class="space-y-4">
              <div class="p-4 rounded-2xl bg-white/10 border border-white/10">
                 <p class="text-[10px] font-bold uppercase tracking-widest text-blue-200/60 mb-1">Status do Budget</p>
                 <div class="flex justify-between items-end">
                    <p class="text-lg font-bold">100% Otimizado</p>
                    <CheckCircle2 class="w-5 h-5 text-emerald-400" />
                 </div>
              </div>
              <RouterLink 
                :to="`/anunciante/anuncios/${announcement.id}/editar`"
                v-if="announcement.paid_status !== 'active'"
                class="w-full py-3.5 rounded-xl bg-white text-blue-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-all"
              >
                Melhorar Anúncio
              </RouterLink>
           </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
