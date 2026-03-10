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
      <h1 class="text-xl font-bold text-gray-900">Editar Morador</h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div class="h-12 bg-gray-100 rounded-xl animate-pulse" />
      <div class="h-12 bg-gray-100 rounded-xl animate-pulse" />
      <div class="h-12 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <!-- Not Found -->
    <EmptyState
      v-else-if="!profile"
      :icon="PhUser"
      title="Morador não encontrado"
      description="O perfil não existe ou foi removido."
    />

    <form v-else class="space-y-4" @submit.prevent="submit">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
        <!-- Full Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
          <input
            v-model="form.full_name"
            type="text"
            required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <!-- Unit -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
          <input
            v-model="form.unit"
            type="text"
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
        :disabled="saving"
        class="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
      >
        {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/app.types'
import { PhUser } from '@phosphor-icons/vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const userId = route.params.userId as string

const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const profile = ref<Profile | null>(null)

const form = ref({
  full_name: '',
  unit: '',
  phone: '',
})

async function loadProfile() {
  loading.value = true
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    profile.value = data as Profile | null
    if (profile.value) {
      form.value.full_name = profile.value.full_name
      form.value.unit = profile.value.unit ?? ''
      form.value.phone = profile.value.phone ?? ''
    }
  } finally {
    loading.value = false
  }
}

async function submit() {
  errorMessage.value = ''
  saving.value = true
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.value.full_name,
        unit: form.value.unit || null,
        phone: form.value.phone || null,
      })
      .eq('id', userId)

    if (error) {
      errorMessage.value = error.message
      return
    }

    router.back()
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Erro inesperado.'
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>
