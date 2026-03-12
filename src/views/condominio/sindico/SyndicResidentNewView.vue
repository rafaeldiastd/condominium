<template>
  <div class="p-4 pb-20">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <AppButton variant="ghost" size="sm" @click="router.back()">←</AppButton>
      <h1 class="text-xl font-bold text-gray-900">Novo Morador</h1>
    </div>

    <form class="space-y-4" @submit.prevent="submit">
      <AppCard class="space-y-4">
        <AppInput
          v-model="form.full_name"
          label="Nome Completo"
          placeholder="Ex: João da Silva"
          required
        />
        <AppInput
          v-model="form.email"
          label="E-mail"
          type="email"
          placeholder="Ex: joao@email.com"
          required
        />
        <AppInput
          v-model="form.unit"
          label="Unidade"
          placeholder="Ex: Apto 102"
          required
        />
        <AppInput
          v-model="form.phone"
          label="Telefone"
          type="tel"
          placeholder="Ex: (11) 99999-9999"
        />
      </AppCard>

      <!-- Error -->
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
        {{ errorMessage }}
      </div>

      <AppButton type="submit" variant="warning" full :loading="loading">
        Criar Morador
      </AppButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useCondominiumStore } from '@/stores/condominium'
import { AppButton, AppInput, AppCard } from '@/components/ui'

const router = useRouter()
const condominiumStore = useCondominiumStore()
const condominiumId = computed(() => condominiumStore.current?.id)
const slug = computed(() => condominiumStore.current?.slug ?? '')

const loading = ref(false)
const errorMessage = ref('')

const form = ref({ full_name: '', email: '', unit: '', phone: '' })

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
    if (error) { errorMessage.value = error.message || 'Erro ao criar morador.'; return }
    router.push(`/${slug.value}/sindico/residents`)
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Erro inesperado.'
  } finally {
    loading.value = false
  }
}
</script>
