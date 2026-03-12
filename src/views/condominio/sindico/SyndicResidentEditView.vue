<template>
  <div class="p-4 pb-20">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <AppButton variant="ghost" size="sm" @click="router.back()">←</AppButton>
      <h1 class="text-xl font-bold text-gray-900">Editar Morador</h1>
    </div>

    <!-- Loading skeleton -->
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
      <AppCard class="space-y-4">
        <AppInput v-model="form.full_name" label="Nome Completo" required />
        <AppInput v-model="form.unit" label="Unidade" placeholder="Ex: Apto 102" />
        <AppInput v-model="form.phone" label="Telefone" type="tel" placeholder="Ex: (11) 99999-9999" />
      </AppCard>

      <!-- Error -->
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </div>

      <AppButton type="submit" variant="warning" full :loading="saving">
        Salvar Alterações
      </AppButton>
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
import { AppButton, AppInput, AppCard } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const userId = route.params.userId as string

const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const profile = ref<Profile | null>(null)
const form = ref({ full_name: '', unit: '', phone: '' })

async function loadProfile() {
  loading.value = true
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
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
      .update({ full_name: form.value.full_name, unit: form.value.unit || null, phone: form.value.phone || null })
      .eq('id', userId)
    if (error) { errorMessage.value = error.message; return }
    router.back()
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Erro inesperado.'
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>
