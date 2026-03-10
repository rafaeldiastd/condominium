<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/admin/syndics" class="text-gray-400 hover:text-gray-600 text-sm">
        ← Síndicos
      </RouterLink>
      <span class="text-gray-300">/</span>
      <h1 class="text-xl font-bold text-gray-900">Novo Síndico</h1>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
      <AdminSyndicForm :saving="saving" @submit="onSubmit" />
    </div>

    <p v-if="errorMsg" class="mt-3 text-sm text-red-600">{{ errorMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminSyndicForm from '@/components/admin/AdminSyndicForm.vue'
import { useAdmin } from '@/composables/useAdmin'

const router = useRouter()
const { createSyndic } = useAdmin()

const saving = ref(false)
const errorMsg = ref('')

async function onSubmit(data: {
  full_name: string
  email: string
  password?: string
  condominium_id: string
  send_invite?: boolean
}) {
  saving.value = true
  errorMsg.value = ''
  try {
    await createSyndic(data)
    router.push('/admin/syndics')
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Ocorreu um erro ao criar o síndico.'
  } finally {
    saving.value = false
  }
}
</script>
