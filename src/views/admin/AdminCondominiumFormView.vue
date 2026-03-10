<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/admin/condominiums" class="text-gray-400 hover:text-gray-600 text-sm">
        ← Condomínios
      </RouterLink>
      <span class="text-gray-300">/</span>
      <h1 class="text-xl font-bold text-gray-900">
        {{ isEdit ? 'Editar Condomínio' : 'Novo Condomínio' }}
      </h1>
    </div>

    <div v-if="loadingData" class="bg-white rounded-xl shadow-sm p-8 text-center text-sm text-gray-400">
      Carregando dados...
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
      <AdminCondominiumForm
        :condominium-id="condominiumId"
        :initial-data="initialData"
        :saving="saving"
        @submit="onSubmit"
      />
    </div>

    <p v-if="errorMsg" class="mt-3 text-sm text-red-600">{{ errorMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminCondominiumForm from '@/components/admin/AdminCondominiumForm.vue'
import { useAdmin } from '@/composables/useAdmin'
import type { Condominium } from '@/types/app.types'

const route = useRoute()
const router = useRouter()
const { createCondominium, updateCondominium, fetchCondominiumById } = useAdmin()

const condominiumId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!condominiumId.value)

const loadingData = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const initialData = ref<Partial<Condominium> | null>(null)

async function onSubmit(data: Record<string, unknown>) {
  saving.value = true
  errorMsg.value = ''
  try {
    if (isEdit.value && condominiumId.value) {
      await updateCondominium(condominiumId.value, data)
    } else {
      await createCondominium(data)
    }
    router.push('/admin/condominiums')
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Ocorreu um erro ao salvar.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (isEdit.value && condominiumId.value) {
    loadingData.value = true
    try {
      initialData.value = await fetchCondominiumById(condominiumId.value)
    } finally {
      loadingData.value = false
    }
  }
})
</script>
