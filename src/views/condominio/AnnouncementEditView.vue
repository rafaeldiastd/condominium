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
      :initial-items="initialItems"
      :initial-links="initialLinks"
      :initial-contacts="initialContacts"
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
import type { ItemFormData } from '@/components/announcement/AnnouncementItemsSection.vue'
import type { LinkFormData } from '@/components/announcement/AnnouncementLinksSection.vue'
import type { WhatsAppContactFormData } from '@/components/announcement/AnnouncementWhatsAppSection.vue'
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
    is_multi_item: a.is_multi_item ?? false,
    subcategory: a.subcategory ?? '',
    commerce_method: a.commerce_method ?? '',
    maps_link: a.maps_link ?? '',
    business_open_time: a.business_open_time ?? '',
    business_close_time: a.business_close_time ?? '',
    business_days: a.business_days ?? [],
    closed_on_holidays: a.closed_on_holidays ?? false,
    event_date: a.event_date ?? '',
    event_location: a.event_location ?? '',
    contact_type: a.contact_type ?? 'chat',
    contact_whatsapp: a.contact_whatsapp ?? '',
  }
})

const initialItems = computed<Omit<ItemFormData, '_key'>[]>(() => {
  return (announcement.value?.items ?? []).map(item => ({
    existingId: item.id,
    name: item.name,
    price: item.price ?? null,
    description: item.description ?? '',
    image_url: item.image_url ?? '',
    storage_path: item.storage_path ?? '',
  }))
})

const initialLinks = computed<Omit<LinkFormData, '_key'>[]>(() => {
  return (announcement.value?.links ?? []).map(link => ({
    existingId: link.id,
    url: link.url,
    title: link.title ?? '',
  }))
})

const initialContacts = computed<Omit<WhatsAppContactFormData, '_key'>[]>(() => {
  return (announcement.value?.whatsapp_contacts ?? []).map(c => ({
    existingId: c.id,
    number: c.number,
    description: c.description ?? '',
  }))
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

async function handleSubmit(
  data: any,
  newImages: File[],
  deletedIds: string[],
  items: ItemFormData[],
  links: LinkFormData[],
  contacts: WhatsAppContactFormData[]
) {
  formRef.value?.setSubmitting(true)

  try {
    await updateAnnouncement(
      route.params.id as string,
      data,
      newImages.length ? newImages : undefined,
      deletedIds.length ? deletedIds : undefined,
      items,
      links,
      contacts
    )

    uiStore.showToast('Anúncio atualizado com sucesso!')
    await router.push(`/${slug.value}/announcements/${route.params.id}`)
  } catch (err) {
    console.error('Erro ao atualizar anúncio:', err)
    formRef.value?.setError('Erro ao salvar as alterações.')
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete() {
  deleting.value = true
  await deleteAnnouncement(route.params.id as string)
  deleting.value = false
  await router.push(`/${slug.value}`)
}
</script>
