<template>
  <div class="p-4 pb-20">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button
        class="text-sm text-gray-500 hover:text-gray-700"
        @click="router.back()"
      >
        ←
      </button>
      <h1 class="text-xl font-bold text-gray-900">Novo Morador</h1>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
        <!-- Full Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
          <input
            v-model="form.full_name"
            type="text"
            required
            placeholder="Ex: João da Silva"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="Ex: joao@email.com"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <!-- Unit -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
          <input
            v-model="form.unit"
            type="text"
            required
            placeholder="Ex: Apto 102"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="Ex: (11) 99999-9999"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
      >
        {{ errorMessage }}
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
      >
        {{ loading ? 'Criando...' : 'Criar Morador' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useCondominiumStore } from '@/stores/condominium'

const router = useRouter()
const condominiumStore = useCondominiumStore()
const condominiumId = computed(() => condominiumStore.current?.id)
const slug = computed(() => condominiumStore.current?.slug ?? '')

const loading = ref(false)
const errorMessage = ref('')

const form = ref({
  full_name: '',
  email: '',
  unit: '',
  phone: '',
})

async function submit() {
  const id = condominiumId.value
  if (!id) return

  errorMessage.value = ''
  loading.value = true

  try {
    const { error } = await supabase.functions.invoke('create-resident', {
      body: {
        full_name: form.value.full_name,
        email: form.value.email,
        unit: form.value.unit,
        phone: form.value.phone || undefined,
        condominium_id: id,
      },
    })

    if (error) {
      errorMessage.value = error.message || 'Erro ao criar morador.'
      return
    }

    router.push(`/${slug.value}/sindico/residents`)
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Erro inesperado.'
  } finally {
    loading.value = false
  }
}
</script>
