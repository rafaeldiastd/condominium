<template>
  <div>
    <div class="sticky top-14 z-20 bg-white border-b border-gray-100 flex items-center px-4 py-3">
      <button @click="$router.back()" class="text-gray-700 text-sm font-medium">&#8592; Cancelar</button>
      <h1 class="text-base font-bold text-gray-900 mx-auto">Editar anúncio</h1>
      <!-- Delete button -->
      <button @click="showDeleteConfirm = true" class="text-red-500 text-sm font-medium">
        Excluir
      </button>
    </div>

    <div v-if="loadingAnnouncement" class="p-4 space-y-4 animate-pulse">
      <div class="h-10 bg-gray-200 rounded-xl"></div>
      <div class="h-20 bg-gray-200 rounded-xl"></div>
    </div>

    <AnnouncementForm
      v-else-if="announcement"
      ref="formRef"
      :initial-data="initialData"
      :existing-images="announcement.images ?? []"
      :is-edit="true"
      @submit="handleSubmit"
    />

    <!-- Delete confirmation -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
        <h3 class="text-lg font-bold text-gray-900">Excluir anúncio?</h3>
        <p class="text-sm text-gray-500">Esta ação não pode ser desfeita. O anúncio será removido permanentemente.</p>
        <div class="flex gap-3">
          <button @click="showDeleteConfirm = false" class="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium">Cancelar</button>
          <button @click="handleDelete" :disabled="deleting" class="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {{ deleting ? 'Excluindo...' : 'Excluir' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCondominiumStore } from '@/stores/condominium'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useAnnouncements } from '@/composables/useAnnouncements'
import AnnouncementForm from '@/components/announcement/AnnouncementForm.vue'
import type { Announcement } from '@/types/app.types'

const router = useRouter()
const route = useRoute()
const condominiumStore = useCondominiumStore()
const authStore = useAuthStore()
const uiStore = useUIStore()
const { fetchById, updateAnnouncement, deleteAnnouncement } = useAnnouncements()

const formRef = ref<InstanceType<typeof AnnouncementForm>>()
const announcement = ref<Announcement | null>(null)
const loadingAnnouncement = ref(true)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

const slug = computed(() => condominiumStore.current?.slug ?? (route.params.condominio as string))

const initialData = computed(() => {
  if (!announcement.value) return {}
  const a = announcement.value
  return {
    type: a.type,
    title: a.title,
    description: a.description ?? '',
    price: a.price ?? null,
    price_negotiable: a.price_negotiable,
    category_id: a.category_id,
    event_date: a.event_date ?? '',
    event_location: a.event_location ?? '',
  }
})

onMounted(async () => {
  const id = route.params.id as string
  const ann = await fetchById(id)

  // Only owner or syndic can edit
  if (!ann || (ann.author_id !== authStore.user?.id && authStore.profile?.role !== 'syndic' && authStore.profile?.role !== 'super_admin')) {
    await router.replace(`/${slug.value}`)
    return
  }

  announcement.value = ann
  loadingAnnouncement.value = false
})

async function handleSubmit(data: Parameters<typeof updateAnnouncement>[1], newImages: File[], deletedIds: string[]) {
  formRef.value?.setSubmitting(true)

  await updateAnnouncement(
    route.params.id as string,
    data,
    newImages.length ? newImages : undefined,
    deletedIds.length ? deletedIds : undefined
  )

  formRef.value?.setSubmitting(false)
  uiStore.showToast('Anúncio atualizado com sucesso!')
  await router.push(`/${slug.value}/announcements/${route.params.id}`)
}

async function handleDelete() {
  deleting.value = true
  await deleteAnnouncement(route.params.id as string)
  deleting.value = false
  await router.push(`/${slug.value}`)
}
</script>
