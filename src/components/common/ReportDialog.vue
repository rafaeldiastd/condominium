<template>
  <div class="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold">Denunciar anúncio</h3>
        <button @click="$emit('close')" class="p-1 text-gray-400 hover:text-gray-600">&#10005;</button>
      </div>

      <div v-if="sent" class="text-center py-4">
        <p class="text-3xl mb-2">&#9989;</p>
        <p class="font-medium text-gray-900">Denúncia enviada</p>
        <p class="text-sm text-gray-500 mt-1">Nossa equipe irá analisar o conteúdo.</p>
      </div>

      <template v-else>
        <div class="space-y-2">
          <p class="text-sm text-gray-500">Por qual motivo você quer denunciar?</p>
          <div v-for="(label, reason) in REPORT_REASON_LABELS" :key="reason">
            <label class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="radio" :value="reason" v-model="selectedReason" class="text-blue-600" />
              <span class="text-sm text-gray-700">{{ label }}</span>
            </label>
          </div>
        </div>

        <div v-if="selectedReason === 'other'">
          <textarea
            v-model="description"
            placeholder="Descreva o problema..."
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <p v-if="error" class="text-xs text-red-600">{{ error }}</p>

        <div class="flex gap-3">
          <button @click="$emit('close')" class="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium">Cancelar</button>
          <button
            @click="submitReport"
            :disabled="!selectedReason || submitting"
            class="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition"
          >
            {{ submitting ? 'Enviando...' : 'Denunciar' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { REPORT_REASON_LABELS } from '@/utils/constants'
import type { ReportReason } from '@/types/app.types'

const props = defineProps<{ announcementId: string }>()
const emit = defineEmits<{ close: []; reported: [] }>()

const authStore = useAuthStore()
const selectedReason = ref<ReportReason | ''>('')
const description = ref('')
const submitting = ref(false)
const sent = ref(false)
const error = ref('')

async function submitReport() {
  if (!selectedReason.value || !authStore.user) return
  submitting.value = true
  error.value = ''

  const { error: err } = await supabase.from('reports').insert({
    announcement_id: props.announcementId,
    reporter_id: authStore.user.id,
    reason: selectedReason.value,
    description: description.value || null,
  })

  submitting.value = false

  if (err) {
    error.value = 'Erro ao enviar denúncia. Tente novamente.'
    return
  }

  sent.value = true
  setTimeout(() => emit('reported'), 2000)
}
</script>
