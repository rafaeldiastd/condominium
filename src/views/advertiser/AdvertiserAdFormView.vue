<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useCreditsStore } from '@/stores/credits'
import { 
  ArrowLeft, 
  Upload, 
  Target, 
  Calendar, 
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useStorage } from '@/composables/useStorage'
import AnnouncementImageUpload from '@/components/announcement/AnnouncementImageUpload.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const creditsStore = useCreditsStore()
const uiStore = useUIStore()
const storage = useStorage()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const submitting = ref(false)
const step = ref(1)

const form = ref({
  title: '',
  description: '',
  category_id: '',
  price: null as number | null,
  condominium_id: '',
  duration_days: 7,
  images: [] as File[],
  contact_type: 'whatsapp' as 'chat' | 'whatsapp',
  contact_whatsapp: '',
  paid_status: 'pending' as 'pending' | 'active' | 'paused' | 'expired',
  existing_images: [] as any[]
})

const imageFiles = ref<File[]>([])

const categories = ref<any[]>([])
const condominiums = ref<any[]>([])
const originalDuration = ref(0)

async function fetchData() {
  loading.value = true
  try {
    const [catRes, condoRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('condominiums').select('*').eq('is_active', true)
    ])
    categories.value = catRes.data || []
    condominiums.value = condoRes.data || []

    if (isEdit.value) {
      const { data } = await supabase
        .from('announcements')
        .select('*, images:announcement_images(*)')
        .eq('id', route.params.id)
        .single()
      if (data) {
        const { images, ...adData } = data
        Object.assign(form.value, adData)
        form.value.existing_images = images || []
        originalDuration.value = data.duration_days || 0
      }
    }
  } catch (err) {
    console.error('Error fetching form data:', err)
  } finally {
    loading.value = false
  }
}

const requiredCredits = computed(() => form.value.duration_days)
const canAfford = computed(() => creditsStore.balance >= requiredCredits.value)

async function handleSubmit() {
  if (!canAfford.value && !isEdit.value) return
  
  submitting.value = true
  try {
    const paidUntil = new Date()
    paidUntil.setDate(paidUntil.getDate() + form.value.duration_days)

    const adData = {
      title: form.value.title,
      description: form.value.description,
      category_id: form.value.category_id,
      price: form.value.price,
      condominium_id: form.value.condominium_id,
      type: 'sale',
      status: 'hidden',
      is_paid: true,
      paid_status: 'pending',
      paid_until: paidUntil.toISOString(),
      duration_days: form.value.duration_days,
      advertiser_id: authStore.user?.id,
      author_id: authStore.user?.id,
      contact_type: form.value.contact_type,
      contact_whatsapp: form.value.contact_whatsapp
    }

    if (!adData.author_id) {
      uiStore.showToast('Erro: Usuário não autenticado', 'error')
      return
    }

    let adId = route.params.id as string

    if (isEdit.value) {
      // Handle Credit Adjustment on Edit (if pending)
      const diff = form.value.duration_days - originalDuration.value
      
      if (diff > 0) {
        await creditsStore.useCredits(diff, `Ajuste de período (+${diff} dias): ${form.value.title}`)
      } else if (diff < 0) {
        await creditsStore.refundCredits(Math.abs(diff), `Ajuste de período (${diff} dias): ${form.value.title}`)
      }

      const { error } = await supabase
        .from('announcements')
        .update(adData)
        .eq('id', adId)
      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from('announcements')
        .insert(adData)
        .select()
        .single()
      if (error) throw error
      adId = data.id

      await creditsStore.useCredits(
        requiredCredits.value, 
        `Destaque de anúncio: ${form.value.title} (${form.value.duration_days} dias)`
      )
    }

    // 3. Upload new images (Both Create & Edit)
    if (imageFiles.value.length > 0) {
      const uploaded = await storage.uploadAnnouncementImages(adId, imageFiles.value)
      if (uploaded.length > 0) {
        // Get current max sort_order for existing images if editing
        let nextSortOrder = 0
        if (isEdit.value) {
          nextSortOrder = form.value.existing_images.reduce((max: number, img: any) => Math.max(max, img.sort_order || 0), -1) + 1
        }

        await supabase.from('announcement_images').insert(
          uploaded.map((img, i) => ({
            announcement_id: adId,
            storage_path: img.storagePath,
            url: img.url,
            sort_order: nextSortOrder + i,
            is_cover: !isEdit.value && i === 0 && form.value.existing_images.length === 0
          }))
        )
      }
    }

    uiStore.showToast('Anúncio enviado para aprovação!', 'success')
    router.push('/anunciante/anuncios')
  } catch (err) {
    console.error('Error saving ad:', err)
    uiStore.showToast('Erro ao salvar anúncio', 'error')
  } finally {
    submitting.value = false
  }
}

async function handleDeleteExistingImage(image: any) {
  try {
    const { error } = await supabase
      .from('announcement_images')
      .delete()
      .eq('id', image.id)
    
    if (error) throw error
    
    // Update local state
    form.value.existing_images = form.value.existing_images.filter((img: any) => img.id !== image.id)
    uiStore.showToast('Imagem removida', 'success')
  } catch (err) {
    console.error('Error deleting image:', err)
    uiStore.showToast('Erro ao remover imagem', 'error')
  }
}

onMounted(() => {
  fetchData()
  creditsStore.fetchCredits()
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button 
        @click="router.back()"
        class="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 transition-all shadow-sm"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">
          {{ isEdit ? 'Editar Anúncio' : 'Novo Anúncio Pago' }}
        </h2>
        <p class="text-gray-500 text-xs mt-0.5">Defina os detalhes da sua campanha prioritária.</p>
      </div>
    </div>

    <!-- Stepper -->
    <div class="flex items-center gap-3 px-1">
       <div v-for="i in 3" :key="i" class="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div 
            class="h-full bg-blue-600 transition-all duration-500"
            :class="step >= i ? 'w-full' : 'w-0'"
          ></div>
       </div>
    </div>

    <!-- Locked Message (if active) -->
    <div v-if="isEdit && form.paid_status === 'active'" class="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
       <Info class="w-5 h-5 text-blue-600" />
       <p class="text-sm font-bold text-blue-700">Este anúncio já está ativo e não pode ser editado.</p>
    </div>

    <!-- Form Container -->
    <form v-if="!(isEdit && form.paid_status === 'active')" @submit.prevent="handleSubmit" class="space-y-8 pb-10">
      
      <!-- Step 1: Basic Info -->
      <div v-if="step === 1" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
           <Sparkles class="w-5 h-5 text-blue-600" />
           Informações Básicas
        </h3>

        <div class="grid grid-cols-1 gap-5 p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Título do Anúncio</label>
            <input 
              v-model="form.title"
              type="text" 
              required
              placeholder="Ex: Apartamento decorado no centro"
              class="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
              <select 
                v-model="form.category_id"
                required
                class="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition-all text-gray-900 appearance-none"
              >
                <option value="" disabled>Selecione uma categoria</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Preço (Opcional)</label>
              <input 
                v-model="form.price"
                type="number" 
                placeholder="0.00"
                class="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
            <textarea 
              v-model="form.description"
              rows="4"
              placeholder="Descreva seu produto ou serviço detalhadamente..."
              class="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
            ></textarea>
          </div>
        </div>

        <button 
          @click="step = 2"
          type="button"
          class="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 transition-all"
        >
          Próximo Passo
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <!-- Step 2: Media & Targeting -->
      <div v-if="step === 2" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
           <Target class="w-5 h-5 text-blue-600" />
           Público & Mídia
        </h3>

        <div class="p-6 rounded-3xl bg-white border border-gray-200 space-y-6 shadow-sm">
          <div class="space-y-3">
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Imagens</label>
            <AnnouncementImageUpload 
              :max-images="5"
              :existing-images="form.existing_images"
              @update:files="imageFiles = $event"
              @delete-existing="handleDeleteExistingImage"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Onde exibir? (Condomínio)</label>
            <select 
              v-model="form.condominium_id"
              required
              class="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition-all text-gray-900 appearance-none"
            >
              <option value="" disabled>Selecione o condomínio alvo</option>
              <option v-for="condo in condominiums" :key="condo.id" :value="condo.id">{{ condo.name }}</option>
            </select>
          </div>

          <div class="space-y-1.5">
             <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
             <input 
               v-model="form.contact_whatsapp"
               type="text" 
               placeholder="Ex: 5511999999999"
               class="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 outline-none transition-all text-gray-900 placeholder:text-gray-400"
             />
          </div>
        </div>

        <div class="flex gap-4">
          <button 
            @click="step = 1"
            type="button"
            class="flex-1 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            Voltar
          </button>
          <button 
            @click="step = 3"
            type="button"
            class="flex-[2] py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 transition-all"
          >
            Configurar Destaque
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Step 3: Duration & Payment -->
      <div v-if="step === 3" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
           <Calendar class="w-5 h-5 text-blue-600" />
           Período de Destaque
        </h3>

        <div class="p-6 rounded-3xl bg-white border border-gray-200 space-y-6 shadow-sm">
          <div class="space-y-3 mr-1">
            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Período de Destaque</label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
               <button 
                  v-for="days in [3, 7, 15, 30]" 
                  :key="days"
                  type="button"
                  @click="form.duration_days = days"
                  class="p-3 rounded-xl border transition-all text-center"
                  :class="form.duration_days === days ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300'"
               >
                  <p class="text-lg font-black">{{ days }}</p>
                  <p class="text-[9px] uppercase font-bold opacity-70">Dias</p>
               </button>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between shadow-sm">
             <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                   <Sparkles class="w-4 h-4" />
                </div>
                <div>
                   <p class="text-[9px] font-bold text-blue-600/60 uppercase tracking-widest">Custo do Destaque</p>
                   <p class="text-lg font-black text-blue-900">{{ requiredCredits }} Créditos</p>
                </div>
             </div>
             <div class="text-right">
                <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Saldo Atual</p>
                <p class="text-lg font-black" :class="canAfford ? 'text-emerald-600' : 'text-red-500'">{{ creditsStore.balance }} CRD</p>
             </div>
          </div>

          <div v-if="!canAfford" class="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
             <AlertCircle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
             <div class="space-y-1">
                <p class="text-sm font-bold text-red-600">Saldo Insuficiente</p>
                <p class="text-[11px] text-red-500/70 leading-relaxed">Você precisa de mais {{ requiredCredits - creditsStore.balance }} créditos. Recarregue seu saldo para continuar.</p>
                <RouterLink to="/anunciante/creditos" class="text-[11px] font-bold text-red-600 underline block mt-1">Comprar Créditos</RouterLink>
             </div>
          </div>

          <div class="flex items-start gap-3 text-gray-400 text-[11px] bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
             <Info class="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
             <p class="leading-relaxed">Seu anúncio será enviado para moderação. O tempo de destaque começa a contar após a aprovação.</p>
          </div>
        </div>

        <div class="flex gap-4">
          <button 
            @click="step = 2"
            type="button"
            class="flex-1 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            Voltar
          </button>
          <button 
            type="submit"
            :disabled="!canAfford || submitting"
            class="flex-[2] py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 transition-all"
          >
            <span v-if="submitting" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <CheckCircle2 v-else class="w-5 h-5" />
            Finalizar e Pagar
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.appearance-none {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-position: right 1.25rem center;
  background-size: 1.25rem;
}
</style>
