<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCreditsStore } from '@/stores/credits'
import { 
  Wallet, 
  History, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'

const route = useRoute()
const creditsStore = useCreditsStore()
const isPurchasing = ref(false)
const selectedPlanId = ref('')
const showSuccess = ref(false)
const showError = ref(false)

async function handlePurchase() {
  if (!selectedPlanId.value) return
  
  isPurchasing.value = true
  try {
    await creditsStore.createCheckoutSession(selectedPlanId.value)
  } catch (err) {
    console.error('Falha na compra:', err)
    showError.value = true
  } finally {
    isPurchasing.value = false
  }
}

onMounted(async () => {
  if (route.query.success) {
    showSuccess.value = true
    // Give the webhook a moment to process before fetching
    await new Promise(resolve => setTimeout(resolve, 2000))
    setTimeout(() => { showSuccess.value = false }, 5000)
  }
  
  creditsStore.fetchCredits()
  creditsStore.fetchTransactions()
  creditsStore.fetchPlans().then(() => {
    if (creditsStore.plans.length > 0) {
      const popular = creditsStore.plans.find(p => p.is_popular)
      selectedPlanId.value = popular ? popular.id : (creditsStore.plans[0]?.id || '')
    }
  })

  if (route.query.canceled) {
    showError.value = true
    setTimeout(() => { showError.value = false }, 5000)
  }
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Gerenciar Créditos</h2>
      <p class="text-gray-500 mt-1 text-sm">Adquira pontos para destacar seus anúncios no carrossel prioritário.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Purchase Section -->
      <div class="lg:col-span-2 space-y-6">
        <section class="space-y-4">
          <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus class="w-5 h-5 text-blue-600" />
            Comprar Créditos
          </h3>
          
          <div v-if="creditsStore.loadingPlans" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="i in 3" :key="i" class="h-24 rounded-2xl bg-gray-100 animate-pulse"></div>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              v-for="pkg in creditsStore.plans" 
              :key="pkg.id"
              @click="selectedPlanId = pkg.id"
              class="relative p-5 rounded-2xl border transition-all text-left shadow-sm group"
              :class="selectedPlanId === pkg.id 
                ? 'bg-blue-50 border-blue-600' 
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
            >
              <div v-if="pkg.is_popular" class="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-md">Popular</div>
              <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{{ pkg.amount }} Créditos</p>
              <p class="text-xl font-black text-gray-900 group-hover:scale-105 transition-transform">R$ {{ Number(pkg.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
              <div 
                v-if="selectedPlanId === pkg.id" 
                class="absolute bottom-4 right-4 text-blue-600"
              >
                <CheckCircle2 class="w-5 h-5" />
              </div>
            </button>
          </div>

          <div class="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-600 font-medium">Total a pagar:</span>
              <span class="text-2xl font-black text-gray-900">
                R$ {{ Number(creditsStore.plans.find(p => p.id === selectedPlanId)?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
            
            <button 
              @click="handlePurchase"
              :disabled="isPurchasing"
              class="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-blue-600/10"
            >
              <span v-if="!isPurchasing" class="flex items-center gap-2">
                <CreditCard class="w-5 h-5" />
                Finalizar Compra
              </span>
              <span v-else class="flex items-center gap-3">
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processando...
              </span>
            </button>

            <Transition name="fade">
              <div v-if="showSuccess" class="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm shadow-sm">
                <CheckCircle2 class="w-5 h-5" />
                Pagamento confirmado! Seus créditos serão atualizados em instantes.
              </div>
            </Transition>

            <Transition name="fade">
              <div v-if="showError" class="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 font-bold text-sm shadow-sm">
                <AlertCircle class="w-5 h-5" />
                Ocorreu um erro ou o pagamento foi cancelado.
              </div>
            </Transition>
          </div>
        </section>

        <!-- Transaction History -->
        <section class="space-y-4">
          <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History class="w-5 h-5 text-gray-400" />
            Histórico de Transações
          </h3>

          <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div v-if="creditsStore.loading && creditsStore.transactions.length === 0" class="p-8 space-y-3">
               <div v-for="i in 3" :key="i" class="h-16 rounded-xl bg-gray-100 animate-pulse"></div>
            </div>
            <div v-else-if="creditsStore.transactions.length === 0" class="p-12 text-center">
               <p class="text-gray-500 text-sm font-medium">Nenhuma transação encontrada.</p>
            </div>
            <div v-else class="divide-y divide-gray-100">
              <div 
                v-for="tx in creditsStore.transactions" 
                :key="tx.id"
                class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center gap-4">
                  <div 
                    class="p-2.5 rounded-xl border"
                    :class="tx.type === 'purchase' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'"
                  >
                    <ArrowUpRight v-if="tx.type === 'purchase'" class="w-4 h-4" />
                    <ArrowDownRight v-else class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="font-bold text-gray-900 text-sm truncate">{{ tx.description }}</p>
                    <p class="text-[11px] text-gray-500 mt-0.5">{{ new Date(tx.created_at).toLocaleDateString() }} - {{ new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-black text-sm" :class="tx.type === 'purchase' ? 'text-emerald-600' : 'text-red-600'">
                    {{ tx.type === 'purchase' ? '+' : '-' }}{{ tx.amount }}
                  </p>
                  <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">CRD</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Balance Card -->
      <div class="space-y-6">
        <h3 class="text-lg font-bold text-gray-900">Seu Saldo</h3>
        <div class="p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm relative overflow-hidden group">
          <div class="relative z-10 flex flex-col items-center text-center space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform duration-500 border border-blue-100 shadow-sm">
              <Wallet class="w-8 h-8" />
            </div>
            <div>
              <p class="text-gray-400 font-bold uppercase tracking-[0.2em] text-[9px] mb-1">Seu Saldo Atual</p>
              <div class="flex items-baseline gap-1">
                <span class="text-5xl font-black text-gray-900">{{ creditsStore.balance }}</span>
                <span class="text-blue-600 font-bold uppercase tracking-widest text-[10px]">CRD</span>
              </div>
            </div>
            <p class="text-[11px] text-gray-500 leading-relaxed italic px-4">
              Cada crédito garante 1 dia de destaque prioritário nos feeds.
            </p>
          </div>
        </div>

        <!-- Info Card -->
        <div class="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 shadow-inner">
           <div class="flex items-center gap-2 text-blue-600">
             <TrendingUp class="w-5 h-5" />
             <h4 class="font-bold text-sm">Por que comprar?</h4>
           </div>
           <ul class="space-y-2.5">
             <li class="text-[11px] text-gray-600 font-medium flex items-start gap-2.5">
               <span class="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1 flex-shrink-0"></span>
               Destaque máximo no topo do feed.
             </li>
             <li class="text-[11px] text-gray-600 font-medium flex items-start gap-2.5">
               <span class="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1 flex-shrink-0"></span>
               Exibição garantida no carrossel.
             </li>
             <li class="text-[11px] text-gray-600 font-medium flex items-start gap-2.5">
               <span class="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1 flex-shrink-0"></span>
               Métricas exclusivas de audiência.
             </li>
           </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
