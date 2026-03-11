<template>
  <div>
    <div class="sticky top-14 z-20 bg-white border-b border-gray-100 flex items-center px-4 py-3">
      <button @click="handleBack" class="text-gray-700 text-sm font-medium">&#8592; Cancelar</button>
      <h1 class="text-base font-bold text-gray-900 mx-auto">Novo anúncio</h1>
      <div class="w-16"></div>
    </div>

    <AnnouncementForm
      ref="formRef"
      draft-key="new_announcement_draft"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useCondominiumStore } from '@/stores/condominium'
import { useUIStore } from '@/stores/ui'
import { useAnnouncements } from '@/composables/useAnnouncements'
import AnnouncementForm from '@/components/announcement/AnnouncementForm.vue'
import type { AnnouncementType } from '@/types/app.types'

const router = useRouter()
const route = useRoute()
const condominiumStore = useCondominiumStore()
const uiStore = useUIStore()
const { createAnnouncement } = useAnnouncements()

const formRef = ref<InstanceType<typeof AnnouncementForm>>()
const slug = computed(() => condominiumStore.current?.slug ?? (route.params.condominio as string))
const isDirty = ref(false)

onBeforeRouteLeave(() => {
  if (isDirty.value) {
    return confirm('Tem certeza que deseja sair? O rascunho será perdido.')
  }
  return true
})

function handleBack() {
  router.back()
}

async function handleSubmit(
  data: { type: AnnouncementType; title: string; description: string; price: number | null; price_negotiable: boolean; category_id: string; event_date: string; event_location: string },
  images: File[],
  _deletedIds: string[]
) {
  isDirty.value = false
  formRef.value?.setSubmitting(true)

  const id = await createAnnouncement(
    data,
    images
  )

  formRef.value?.setSubmitting(false)

  if (id) {
    formRef.value?.clearDraft()
    uiStore.showToast('Anúncio publicado com sucesso!')
    await router.replace(`/${slug.value}/announcements/${id}`)
  } else {
    formRef.value?.setError('Erro ao publicar anúncio. Tente novamente.')
  }
}
</script>
