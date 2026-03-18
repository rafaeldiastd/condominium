<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { 
  BarChart3, 
  Eye, 
  MousePointer2, 
  Users,
  PieChart,
  Calendar,
  ChevronDown
} from 'lucide-vue-next'

const authStore = useAuthStore()
const loading = ref(true)
const interactions = ref<any[]>([])
const selectedAdId = ref('all')
const myAds = ref<any[]>([])

async function fetchAnalytics() {
  if (!authStore.user?.id) return
  
  loading.value = true
  try {
    const { data: ads } = await supabase
      .from('announcements')
      .select('id, title')
      .eq('advertiser_id', authStore.user.id)
    
    myAds.value = ads || []

    let query = supabase
      .from('ad_interactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (selectedAdId.value !== 'all') {
      query = query.eq('announcement_id', selectedAdId.value)
    } else {
      query = query.in('announcement_id', myAds.value.map(a => a.id))
    }

    const { data, error } = await query
    if (error) throw error
    interactions.value = data || []
  } catch (err) {
    console.error('Error fetching analytics:', err)
  } finally {
    loading.value = false
  }
}

const stats = ref({
  views: 0,
  clicks: 0,
  whatsapp: 0,
  ctr: '0%'
})

function processStats() {
  const views = interactions.value.filter(i => i.type === 'view').length
  const clicks = interactions.value.filter(i => i.type === 'click').length
  const whatsapp = interactions.value.filter(i => i.type === 'whatsapp_click').length
  const totalClicks = clicks + whatsapp
  const ctr = views > 0 ? ((totalClicks / views) * 100).toFixed(1) : '0'

  stats.value = { views, clicks, whatsapp, ctr: `${ctr}%` }
}

const demographics = ref({
  gender: {} as Record<string, number>,
  age: {} as Record<string, number>,
  city: {} as Record<string, number>
})

function processDemographics() {
  const g: Record<string, number> = {}
  const a: Record<string, number> = {}
  const c: Record<string, number> = {}

  interactions.value.forEach(i => {
    const d = i.demographics
    if (d.gender) g[d.gender] = (g[d.gender] || 0) + 1
    if (d.age_range) a[d.age_range] = (a[d.age_range] || 0) + 1
    if (d.city) c[d.city] = (c[d.city] || 0) + 1
  })

  demographics.value = { gender: g, age: a, city: c }
}

onMounted(async () => {
  await fetchAnalytics()
  processStats()
  processDemographics()
})

const handleAdFilterChange = async () => {
  await fetchAnalytics()
  processStats()
  processDemographics()
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Métricas de Desempenho</h2>
        <p class="text-gray-500 mt-1 text-sm">Acompanhe quem está interagindo com seus anúncios.</p>
      </div>
      
      <!-- Ad Selector -->
      <div class="relative w-full md:w-72">
        <select 
          v-model="selectedAdId"
          @change="handleAdFilterChange"
          class="w-full pl-5 pr-12 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 font-bold outline-none appearance-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shadow-sm"
        >
           <option value="all">Todos os Anúncios</option>
           <option v-for="ad in myAds" :key="ad.id" :value="ad.id">{{ ad.title }}</option>
        </select>
        <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
    </div>

    <!-- Stats Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
        <div class="flex items-center justify-between">
           <div class="p-2.5 rounded-xl bg-blue-50 text-blue-600">
             <Eye class="w-5 h-5" />
           </div>
           <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Views</span>
        </div>
        <div>
          <p class="text-2xl font-black text-gray-900">{{ stats.views }}</p>
          <p class="text-xs text-gray-500 font-medium">Visualizações totais</p>
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
          <p class="text-2xl font-black text-gray-900">{{ stats.clicks }}</p>
          <p class="text-xs text-gray-500 font-medium">Cliques no anúncio</p>
        </div>
      </div>

      <div class="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
        <div class="flex items-center justify-between">
           <div class="p-2.5 rounded-xl bg-blue-50 text-blue-600">
             <Users class="w-5 h-5" />
           </div>
           <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">WhatsApp</span>
        </div>
        <div>
          <p class="text-2xl font-black text-gray-900">{{ stats.whatsapp }}</p>
          <p class="text-xs text-gray-500 font-medium">Interessados diretos</p>
        </div>
      </div>

      <div class="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
        <div class="flex items-center justify-between">
           <div class="p-2.5 rounded-xl bg-orange-50 text-orange-600">
             <BarChart3 class="w-5 h-5" />
           </div>
           <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">CTR</span>
        </div>
        <div>
          <p class="text-2xl font-black text-gray-900">{{ stats.ctr }}</p>
          <p class="text-xs text-gray-500 font-medium">Taxa de interação</p>
        </div>
      </div>
    </div>

    <!-- Demographics Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Gender -->
      <div class="p-6 rounded-3xl bg-white border border-gray-200 space-y-6 shadow-sm">
        <div class="flex items-center gap-3">
           <PieChart class="w-5 h-5 text-purple-600" />
           <h3 class="font-bold text-gray-900 text-sm">Gênero</h3>
        </div>
        <div class="space-y-4">
           <div v-for="(count, label) in demographics.gender" :key="label" class="space-y-2">
              <div class="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                 <span class="text-gray-500">{{ label === 'not_specified' ? 'Não informado' : label }}</span>
                 <span class="text-gray-900">{{ count }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                 <div 
                   class="h-full bg-purple-600"
                   :style="{ width: (count / (interactions.length || 1) * 100) + '%' }"
                 ></div>
              </div>
           </div>
           <p v-if="interactions.length === 0" class="text-[10px] text-gray-400 italic">Sem dados suficientes.</p>
        </div>
      </div>

      <!-- Age Range -->
      <div class="p-6 rounded-3xl bg-white border border-gray-200 space-y-6 shadow-sm">
        <div class="flex items-center gap-3">
           <Users class="w-5 h-5 text-blue-600" />
           <h3 class="font-bold text-gray-900 text-sm">Faixa Etária</h3>
        </div>
        <div class="space-y-4">
           <div v-for="(count, label) in demographics.age" :key="label" class="space-y-2">
              <div class="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                 <span class="text-gray-500">{{ label.replace('_', '-') }}</span>
                 <span class="text-gray-900">{{ count }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                 <div 
                   class="h-full bg-blue-600"
                   :style="{ width: (count / (interactions.length || 1) * 100) + '%' }"
                 ></div>
              </div>
           </div>
           <p v-if="interactions.length === 0" class="text-[10px] text-gray-400 italic">Sem dados suficientes.</p>
        </div>
      </div>

      <!-- City -->
      <div class="p-6 rounded-3xl bg-white border border-gray-200 space-y-6 shadow-sm">
        <div class="flex items-center gap-3">
           <Calendar class="w-5 h-5 text-emerald-600" />
           <h3 class="font-bold text-gray-900 text-sm">Cidade</h3>
        </div>
        <div class="space-y-4">
           <div v-for="(count, label) in demographics.city" :key="label" class="space-y-2">
              <div class="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                 <span class="text-gray-500">{{ label }}</span>
                 <span class="text-gray-900">{{ count }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                 <div 
                   class="h-full bg-emerald-600"
                   :style="{ width: (count / (interactions.length || 1) * 100) + '%' }"
                 ></div>
              </div>
           </div>
           <p v-if="interactions.length === 0" class="text-[10px] text-gray-400 italic">Sem dados suficientes.</p>
        </div>
      </div>

    </div>
  </div>
</template>
