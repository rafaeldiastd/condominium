<template>
  <div class="pb-20">
    <!-- Back button -->
    <div class="sticky top-14 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 py-3">
      <button @click="$router.back()" class="flex items-center gap-2 text-gray-700 text-sm font-medium">
        &#8592; Voltar
      </button>
      <div class="ml-auto flex gap-2">
        <button @click="handleFavoriteToggle" class="p-2 rounded-full hover:bg-gray-100">
          <PhHeart :weight="isFav ? 'fill' : 'regular'" :class="isFav ? 'text-red-500' : 'text-gray-400'" class="w-6 h-6" />
        </button>
        <button @click="showReportDialog = true" class="p-2 rounded-full hover:bg-gray-100 text-gray-400">
          &#8943;
        </button>
      </div>
    </div>

    <div v-if="loading" class="animate-pulse p-4 space-y-4">
      <div class="aspect-square bg-gray-200 rounded-2xl"></div>
      <div class="h-5 bg-gray-200 rounded w-3/4"></div>
      <div class="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>

    <div v-else-if="announcement" class="max-w-5xl mx-auto md:p-4">
      <div class="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 md:gap-8">
        <!-- Esquerda: Fotos, Título, Info, Descrição -->
        <div class="space-y-4">
          <!-- Image gallery -->
          <AnnouncementImageGallery :images="announcement.images ?? []" class="md:rounded-2xl overflow-hidden" />

          <!-- Content (Left Column) -->
          <div class="px-4 md:px-0 py-4 md:py-0 space-y-4">
            <!-- Title -->
            <div class="flex items-start justify-between gap-2">
              <h1 class="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{{ announcement.title }}</h1>
              <AnnouncementBadge :type="announcement.type" />
            </div>
    
            <!-- Event info -->
            <div v-if="announcement.type === 'event' && announcement.event_date" class="bg-blue-50 rounded-xl p-3 space-y-1">
              <p class="text-xs text-blue-600 font-medium flex items-center gap-1"><PhCalendarBlank class="w-4 h-4" /> {{ formatDateTime(announcement.event_date) }}</p>
              <p v-if="announcement.event_location" class="text-xs text-blue-600 flex items-center gap-1"><PhMapPin class="w-4 h-4" /> {{ announcement.event_location }}</p>
            </div>
    
            <!-- Description -->
            <div v-if="announcement.description">
              <h3 class="text-sm font-semibold text-gray-700 mb-1">Descrição</h3>
              <p class="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{{ announcement.description }}</p>
            </div>
          </div>
        </div>

        <!-- Direita: Preço, Contato, Autor -->
        <div class="px-4 md:px-0 space-y-4">
          <!-- Price Box -->
          <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm md:shadow-md">
            <p class="text-3xl font-bold text-blue-600">{{ priceText }}</p>
            <p v-if="announcement.price_negotiable" class="text-xs text-gray-500 mt-1">Preço negociável</p>
          </div>
          
          <!-- Author card -->
          <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm md:shadow-md">
            <div class="flex items-center gap-3">
              <RouterLink :to="`/${slug}/profile/${announcement.author?.id}`" class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img v-if="announcement.author?.avatar_url" :src="announcement.author.avatar_url + '?width=80'" class="w-full h-full object-cover" alt="Avatar" />
                  <span v-else class="text-blue-700 font-bold">{{ announcement.author?.full_name?.charAt(0) ?? '?' }}</span>
                </div>
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 text-sm truncate">{{ announcement.author?.full_name }}</p>
                  <p class="text-xs text-gray-500">{{ announcement.author?.unit ? `Unidade ${announcement.author.unit}` : 'Morador' }}</p>
                </div>
              </RouterLink>
            </div>
  
            <!-- CTA buttons (not shown for own announcements) -->
            <div v-if="!isOwnAnnouncement" class="flex flex-col gap-2 mt-4">
              <!-- Anuncio pausado -->
              <div
                v-if="announcement.status === 'closed'"
                class="w-full py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-1.5"
              >
                <PhPause class="w-5 h-5" /> Anúncio Pausado
              </div>

              <!-- Bloqueado pelo dono -->
              <div
                v-else-if="isBlockedByOwner"
                class="w-full py-3 bg-gray-100 border border-gray-200 text-gray-400 rounded-xl text-sm text-center cursor-not-allowed"
              >
                Contato indisponível
              </div>

              <!-- Contato via WhatsApp -->
              <a
                v-else-if="whatsappLink"
                :href="whatsappLink"
                target="_blank"
                rel="noopener"
                class="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition text-center flex items-center justify-center gap-1.5"
              >
                <PhWhatsappLogo class="w-5 h-5" /> WhatsApp
              </a>
              <!-- Contato via chat (padrão) -->
              <button
                @click="handleContact"
                class="w-full py-3 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5"
                :class="whatsappLink ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'"
              >
                <component :is="whatsappLink ? PhWhatsappLogo : PhChatCircle" class="w-5 h-5" />
                Entrar em contato
              </button>
            </div>
  
            <!-- Own announcement actions -->
            <div v-else class="flex flex-col gap-2 mt-4">
              <RouterLink
                :to="`/${slug}/announcements/${announcement.id}/edit`"
                class="w-full py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium text-center hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
              >
                <PhPencilSimple class="w-5 h-5" /> Editar anúncio
              </RouterLink>
              <button
                @click="handleMarkAsSold"
                v-if="announcement.status === 'active' && announcement.type === 'sale'"
                class="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-1.5"
              >
                <PhCheckCircle class="w-5 h-5" /> Marcar como Encerrado
              </button>
            </div>
          </div>
  
          <!-- Metadata -->
          <div class="text-xs text-gray-400 text-center md:text-left md:pl-2">
            Publicado em {{ formatDate(announcement.created_at) }} · {{ announcement.views_count }} visualizações
          </div>
        </div>
      </div>
    </div>

    <!-- Report dialog -->
    <ReportDialog
      v-if="showReportDialog && announcement"
      :announcement-id="announcement.id"
      @close="showReportDialog = false"
      @reported="showReportDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnnouncements } from '@/composables/useAnnouncements'
import { useFavorites } from '@/composables/useFavorites'
import { useChat } from '@/composables/useChat'
import {
  PhHeart,
  PhCalendarBlank,
  PhMapPin,
  PhWhatsappLogo,
  PhChatCircle,
  PhPencilSimple,
  PhCheckCircle,
  PhPause,
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/auth'
import { useCondominiumStore } from '@/stores/condominium'
import { formatPrice, formatDate, formatDateTime } from '@/utils/formatters'
import { supabase } from '@/lib/supabase'
import AnnouncementImageGallery from '@/components/announcement/AnnouncementImageGallery.vue'
import AnnouncementBadge from '@/components/announcement/AnnouncementBadge.vue'
import ReportDialog from '@/components/common/ReportDialog.vue'
import type { Announcement } from '@/types/app.types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const condominiumStore = useCondominiumStore()
const { fetchById, incrementViews } = useAnnouncements()
const { isFavorited, toggleFavorite, loadFavoriteIds } = useFavorites()
const { isBlockedByOwner: checkBlockedByOwner } = useChat()

const announcement = ref<Announcement | null>(null)
const loading = ref(true)
const showReportDialog = ref(false)
const isBlockedByOwner = ref(false)

const slug = computed(() => condominiumStore.current?.slug ?? (route.params.condominio as string))
const isFav = computed(() => announcement.value ? isFavorited(announcement.value.id) : false)
const isOwnAnnouncement = computed(() => announcement.value?.author_id === authStore.user?.id)

const priceText = computed(() =>
  announcement.value
    ? formatPrice(announcement.value.price ?? undefined, announcement.value.price_negotiable)
    : ''
)

// Gera link do WhatsApp a partir do número cadastrado ou do telefone do autor
const whatsappLink = computed(() => {
  const ann = announcement.value
  if (!ann) return null
  
  // Só exibe zap se o criador do anúncio escolheu a opção Whatsapp ou não definiu nada (retrocompatibilidade)
  if (ann.contact_type === 'chat') return null

  const phone = ann.contact_whatsapp || ann.author?.phone
  if (!phone) return null

  // Remove caracteres não numéricos e adiciona o código do Brasil se necessário
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null // Muito curto para ser um número válido
  
  const number = digits.startsWith('55') ? digits : `55${digits}`
  const text = encodeURIComponent(`Queria mais informações sobre o anúncio ${ann.title}`)
  return `https://wa.me/${number}?text=${text}`
})

onMounted(async () => {
  const id = route.params.id as string
  const [ann] = await Promise.all([
    fetchById(id),
    loadFavoriteIds(),
  ])

  window.scrollTo(0, 0)
  announcement.value = ann
  loading.value = false

  if (ann) {
    incrementViews(id)
    // Check if current user is blocked by the ad owner
    if (ann.author_id) {
      isBlockedByOwner.value = await checkBlockedByOwner(ann.author_id)
    }
  }
})

async function handleFavoriteToggle() {
  if (announcement.value) {
    await toggleFavorite(announcement.value.id)
  }
}

async function handleContact() {
  if (whatsappLink.value) {
    window.open(whatsappLink.value, '_blank', 'noreferrer')
  } else {
    await startChat()
  }
}

async function startChat() {
  if (!announcement.value || !authStore.user) return
  const authorId = announcement.value.author_id
  const annId = announcement.value.id

  const uId = authStore.user.id

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('announcement_id', annId)
    .or(`and(participant_a.eq.${uId},participant_b.eq.${authorId}),and(participant_a.eq.${authorId},participant_b.eq.${uId})`)
    .maybeSingle()

  if (existing) {
    await router.push(`/${slug.value}/chat/${existing.id}`)
    return
  }

  // Se não existe, vai para a rota com o prefixo para criar preguiçosamente
  await router.push(`/${slug.value}/chat/new_${annId}_${authorId}`)
}

async function handleMarkAsSold() {
  if (!announcement.value) return
  await supabase
    .from('announcements')
    .update({ status: 'sold' })
    .eq('id', announcement.value.id)
  announcement.value.status = 'sold'
}
</script>
