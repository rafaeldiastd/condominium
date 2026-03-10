<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/admin/campaigns" class="text-gray-400 hover:text-gray-600 text-sm">
        ← Campanhas
      </RouterLink>
      <span class="text-gray-300">/</span>
      <h1 class="text-xl font-bold text-gray-900">
        {{ isEdit ? 'Editar Campanha' : 'Nova Campanha' }}
      </h1>
    </div>

    <div v-if="loadingData" class="bg-white rounded-xl shadow-sm p-8 text-center text-sm text-gray-400">
      Carregando dados...
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
      <AdminCampaignForm
        :campaign-id="campaignId"
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
import AdminCampaignForm from '@/components/admin/AdminCampaignForm.vue'
import { useAdmin } from '@/composables/useAdmin'
import type { Campaign } from '@/types/app.types'

const route = useRoute()
const router = useRouter()
const { createCampaign, updateCampaign, fetchCampaignById } = useAdmin()

const campaignId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!campaignId.value)

const loadingData = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const initialData = ref<Partial<Campaign> | null>(null)

async function onSubmit(data: Record<string, unknown>, condominiumIds: string[]) {
  saving.value = true
  errorMsg.value = ''
  try {
    if (isEdit.value && campaignId.value) {
      await updateCampaign(campaignId.value, data, condominiumIds)
    } else {
      await createCampaign(data, condominiumIds)
    }
    router.push('/admin/campaigns')
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Ocorreu um erro ao salvar a campanha.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (isEdit.value && campaignId.value) {
    loadingData.value = true
    try {
      initialData.value = await fetchCampaignById(campaignId.value)
    } finally {
      loadingData.value = false
    }
  }
})
</script>
