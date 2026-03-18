<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCreditsStore } from '@/stores/credits'
import type { CreditPlan } from '@/types/app.types'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Package,
  Star
} from 'lucide-vue-next'

const creditsStore = useCreditsStore()
const isEditing = ref(false)
const editingPlan = ref<Partial<CreditPlan>>({})
const isSubmitting = ref(false)
const error = ref('')

async function loadPlans() {
  await creditsStore.fetchAllPlans()
}

function startCreate() {
  editingPlan.value = {
    amount: 0,
    price: 0,
    is_popular: false,
    is_active: true
  }
  isEditing.value = true
}

function startEdit(plan: CreditPlan) {
  editingPlan.value = { ...plan }
  isEditing.value = true
}

async function handleSave() {
  if (!editingPlan.value.amount || editingPlan.value.amount <= 0) {
    error.value = 'A quantidade deve ser maior que zero.'
    return
  }
  if (editingPlan.value.price === undefined || editingPlan.value.price < 0) {
    error.value = 'O preço não pode ser negativo.'
    return
  }

  isSubmitting.value = true
  error.value = ''
  try {
    await creditsStore.savePlan(editingPlan.value)
    await loadPlans()
    isEditing.value = false
  } catch (err: any) {
    error.value = 'Falha ao salvar o plano.'
  } finally {
    isSubmitting.value = false
  }
}

async function toggleActive(plan: CreditPlan) {
  try {
    await creditsStore.savePlan({ id: plan.id, is_active: !plan.is_active })
    await loadPlans()
  } catch (err) {
    console.error('Falha ao alternar status do plano')
  }
}

async function handleDelete(id: string) {
  if (!confirm('Tem certeza que deseja excluir este plano?')) return
  
  try {
    await creditsStore.deletePlan(id)
    await loadPlans()
  } catch (err) {
    alert('Erro ao excluir plano. Ele pode estar vinculado a transações existentes.')
  }
}

onMounted(loadPlans)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Planos de Crédito</h1>
        <p class="text-sm text-gray-500">Gerencie os pacotes de créditos disponíveis para os anunciantes.</p>
      </div>
      <button 
        @click="startCreate"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
      >
        <Plus class="w-4 h-4" />
        Novo Plano
      </button>
    </div>

    <!-- Edit Modal -->
    <div v-if="isEditing" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">{{ editingPlan.id ? 'Editar Plano' : 'Novo Plano' }}</h2>
          <button @click="isEditing = false" class="text-gray-400 hover:text-gray-600">
            <X class="w-6 h-6" />
          </button>
        </div>
        
        <div class="p-6 space-y-4">
          <div v-if="error" class="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100">
            <AlertCircle class="w-4 h-4" />
            {{ error }}
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantidade de Créditos</label>
            <input 
              v-model.number="editingPlan.amount" 
              type="number"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Ex: 50"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Preço (R$)</label>
            <input 
              v-model.number="editingPlan.price" 
              type="number"
              step="0.01"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Ex: 45.00"
            />
          </div>

          <div class="flex items-center gap-6 py-2">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" v-model="editingPlan.is_popular" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span class="text-sm font-medium text-gray-700 group-hover:text-gray-900">Plano Popular</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" v-model="editingPlan.is_active" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span class="text-sm font-medium text-gray-700 group-hover:text-gray-900">Ativo</span>
            </label>
          </div>
        </div>

        <div class="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button 
            @click="isEditing = false"
            class="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-sm hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button 
            @click="handleSave"
            :disabled="isSubmitting"
            class="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <div v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ editingPlan.id ? 'Salvar Alterações' : 'Criar Plano' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Plans List -->
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div v-if="creditsStore.loadingPlans" class="p-12 space-y-4">
        <div v-for="i in 3" :key="i" class="h-16 bg-gray-50 rounded-xl animate-pulse"></div>
      </div>
      <div v-else-if="creditsStore.plans.length === 0" class="p-12 text-center space-y-3">
        <div class="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto">
          <Package class="w-8 h-8" />
        </div>
        <p class="text-gray-500 font-medium">Nenhum plano cadastrado ainda.</p>
        <button @click="startCreate" class="text-blue-600 font-bold text-sm hover:underline">Cadastrar o primeiro</button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">Quantidade</th>
              <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">Preço</th>
              <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">Destaques</th>
              <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">Status</th>
              <th class="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-[0.1em] text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="plan in creditsStore.plans" :key="plan.id" class="hover:bg-gray-50/50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                    <Package class="w-5 h-5" />
                  </div>
                  <span class="font-bold text-gray-900">{{ plan.amount }} Créditos</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="font-black text-gray-900">R$ {{ Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
              </td>
              <td class="px-6 py-4">
                <div v-if="plan.is_popular" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-wider">
                  <Star class="w-3 h-3 fill-current" />
                  Popular
                </div>
                <span v-else class="text-gray-300 text-xs">—</span>
              </td>
              <td class="px-6 py-4">
                <button 
                  @click="toggleActive(plan)"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold transition"
                  :class="plan.is_active 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' 
                    : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'"
                >
                  {{ plan.is_active ? 'Ativo' : 'Inativo' }}
                </button>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="startEdit(plan)"
                    class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Editar"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button 
                    @click="handleDelete(plan.id)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
