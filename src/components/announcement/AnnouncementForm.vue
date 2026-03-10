<template>
  <form @submit.prevent="handleSubmit" class="space-y-5 p-4 pb-8">
    <!-- Type selector -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de anúncio *</label>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="typeOption in filteredTypeOptions"
          :key="typeOption.value"
          type="button"
          @click="handleTypeChange(typeOption.value)"
          class="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition text-sm"
          :class="form.type === typeOption.value
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-200 text-gray-600 hover:border-gray-300'"
        >
          <component :is="typeOption.icon" class="w-6 h-6" />
          <span class="text-xs font-medium">{{ typeOption.label }}</span>
        </button>
      </div>
      <p v-if="errors.type" class="mt-1 text-xs text-red-600">{{ errors.type }}</p>
    </div>

    <!-- Title -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Título *</label>
      <input
        v-model="form.title"
        type="text"
        placeholder="Ex: Sofá de 3 lugares, quase novo"
        maxlength="100"
        class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        :class="errors.title ? 'border-red-400' : 'border-gray-300'"
      />
      <div class="flex justify-between mt-1">
        <p v-if="errors.title" class="text-xs text-red-600">{{ errors.title }}</p>
        <p class="text-xs text-gray-400 ml-auto">{{ form.title.length }}/100</p>
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
      <textarea
        v-model="form.description"
        placeholder="Descreva o item ou serviço com detalhes..."
        rows="4"
        maxlength="2000"
        class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
      />
    </div>

    <!-- Price (for sale/service) -->
    <div v-if="showPriceField">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ form.type === 'service' ? 'Valor do serviço' : 'Preço' }}
        <span class="text-gray-400 font-normal">(deixe em branco para negociável)</span>
      </label>
      <div class="relative">
        <span class="absolute left-4 top-3 text-gray-500 text-sm">R$</span>
        <input
          v-model.number="form.price"
          type="number"
          min="0"
          step="0.01"
          placeholder="0,00"
          class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>
      <div class="flex items-center justify-between mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
        <span class="text-sm text-gray-700 font-medium">Preço negociável</span>
        <button
          type="button"
          @click="form.price_negotiable = !form.price_negotiable"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :class="form.price_negotiable ? 'bg-blue-600' : 'bg-gray-200'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            :class="form.price_negotiable ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </div>
    </div>

    <!-- Event fields -->
    <div v-if="form.type === 'event'" class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Data e horário do evento</label>
        <input
          v-model="form.event_date"
          type="datetime-local"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Local do evento</label>
        <input
          v-model="form.event_location"
          type="text"
          placeholder="Ex: Salão de festas, Térreo"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>
    </div>

    <!-- Category -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
      <select
        v-model="form.category_id"
        class="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
        :class="errors.category_id ? 'border-red-400' : 'border-gray-300'"
      >
        <option value="">Selecione uma categoria</option>
        <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <p v-if="errors.category_id" class="mt-1 text-xs text-red-600">{{ errors.category_id }}</p>
    </div>

    <!-- Forma de contato -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Forma de contato</label>
      <div class="flex gap-3">
        <button
          type="button"
          @click="form.contact_type = 'chat'"
          class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition text-sm font-medium"
          :class="form.contact_type === 'chat'
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-200 text-gray-600 hover:border-gray-300'"
        >
          <PhChatCircle class="w-5 h-5" /> Chat do app
        </button>
        <button
          type="button"
          @click="form.contact_type = 'whatsapp'"
          class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition text-sm font-medium"
          :class="form.contact_type === 'whatsapp'
            ? 'border-green-600 bg-green-50 text-green-700'
            : 'border-gray-200 text-gray-600 hover:border-gray-300'"
        >
          <PhWhatsappLogo class="w-5 h-5" /> WhatsApp
        </button>
      </div>
      <div v-if="form.contact_type === 'whatsapp'" class="mt-3">
        <label class="block text-xs text-gray-500 mb-1">Número do WhatsApp (com DDD)</label>
        <input
          v-model="form.contact_whatsapp"
          type="tel"
          placeholder="(11) 99999-9999"
          maxlength="20"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        />
      </div>
    </div>

    <!-- Images -->
    <AnnouncementImageUpload
      :max-images="5"
      :existing-images="existingImages"
      @update:files="imageFiles = $event"
      @delete-existing="deletedImageIds.push($event)"
    />

    <!-- Submit error -->
    <p v-if="submitError" class="text-sm text-red-600 text-center">{{ submitError }}</p>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="submitting"
      class="w-full py-4 bg-blue-600 text-white font-semibold rounded-2xl text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      <span v-if="submitting">{{ isEdit ? 'Salvando...' : 'Publicando...' }}</span>
      <span v-else>{{ isEdit ? 'Salvar alterações' : 'Publicar anúncio' }}</span>
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import AnnouncementImageUpload from './AnnouncementImageUpload.vue'
import type { AnnouncementType, AnnouncementImage, Category } from '@/types/app.types'

interface FormData {
  type: AnnouncementType
  title: string
  description: string
  price: number | null
  price_negotiable: boolean
  category_id: string
  event_date: string
  event_location: string
  contact_type: 'chat' | 'whatsapp'
  contact_whatsapp: string
}

const props = withDefaults(defineProps<{
  initialData?: Partial<FormData>
  existingImages?: Pick<AnnouncementImage, 'id' | 'url' | 'is_cover'>[]
  isEdit?: boolean
  draftKey?: string
}>(), {
  existingImages: () => [],
  isEdit: false,
  draftKey: 'announcement_draft',
})

const emit = defineEmits<{
  submit: [data: FormData, images: File[], deletedImageIds: string[]]
}>()

import { useAuthStore } from '@/stores/auth'
import {
  PhTag,
  PhWrench,
  PhGift,
  PhHandsPraying,
  PhCalendarBlank,
  PhMegaphone,
  PhChatCircle,
  PhWhatsappLogo
} from '@phosphor-icons/vue'

const authStore = useAuthStore()
const isSyndic = computed(() => authStore.isSyndic)

const submitting = ref(false)
const submitError = ref('')
const imageFiles = ref<File[]>([])
const deletedImageIds = ref<string[]>([])
const categories = ref<Category[]>([])

const form = reactive<FormData>({
  type: 'sale',
  title: '',
  description: '',
  price: null,
  price_negotiable: false,
  category_id: '',
  event_date: '',
  event_location: '',
  contact_type: 'chat',
  contact_whatsapp: '',
  ...props.initialData,
})

const errors = reactive({
  type: '',
  title: '',
  category_id: '',
})

const showPriceField = computed(() => ['sale', 'service'].includes(form.type))

const typeOptions = [
  { value: 'sale' as AnnouncementType, icon: PhTag, label: 'Produto' },
  { value: 'service' as AnnouncementType, icon: PhWrench, label: 'Serviço' },
  { value: 'donation' as AnnouncementType, icon: PhGift, label: 'Doação' },
  { value: 'donation_request' as AnnouncementType, icon: PhHandsPraying, label: 'Pedido' },
  { value: 'event' as AnnouncementType, icon: PhCalendarBlank, label: 'Evento', syndicOnly: true },
  { value: 'campaign' as AnnouncementType, icon: PhMegaphone, label: 'Campanha', syndicOnly: true },
]

const filteredTypeOptions = computed(() => {
  if (isSyndic.value) return typeOptions
  return typeOptions.filter(t => !t.syndicOnly)
})

const filteredCategories = computed(() => {
  const t = form.type
  return categories.value.filter(c => {
    // Always keep currently selected category valid (useful for edit mode with old categories)
    if (c.id === form.category_id) return true

    if (t === 'sale') return c.slug.startsWith('produ-')
    if (t === 'service') return c.slug.startsWith('serv-')
    if (t === 'donation') return c.slug.startsWith('doac-')
    if (t === 'donation_request') return c.slug.startsWith('ped-')
    if (t === 'event') return c.slug.startsWith('event-')
    if (t === 'campaign') return c.slug.startsWith('camp-')

    // Fallback logic for old categories if DB hasn't been updated yet
    if (t === 'event' || t === 'campaign') {
      return c.slug.includes('evento') || c.slug.includes('comunicado') || c.slug.includes('geral')
    }
    if (t === 'service') {
      return c.slug.includes('servico') || c.slug.includes('manutencao') || c.slug.includes('beleza') || c.slug.includes('aula')
    }
    return !c.slug.includes('evento') && !c.slug.includes('comunicado') && !c.slug.includes('servico') && !c.slug.includes('manutencao') && !c.slug.includes('beleza') && !c.slug.includes('aula')
  })
})

function handleTypeChange(val: AnnouncementType) {
  form.type = val
  form.category_id = '' // Reset category when type changes
  if (!showPriceField.value) {
    form.price = null
    form.price_negotiable = false
  }
}

// Auto-save draft
let draftTimer: ReturnType<typeof setTimeout>
watch(form, () => {
  clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    localStorage.setItem(props.draftKey, JSON.stringify(form))
  }, 1000)
}, { deep: true })

// Load categories and restore draft on mount
onMounted(async () => {
  const { data } = await supabase.from('categories').select('*').order('sort_order')
  categories.value = (data ?? []) as Category[]

  // Restore draft (only for new announcements)
  if (!props.isEdit && !props.initialData?.title) {
    const saved = localStorage.getItem(props.draftKey)
    if (saved) {
      try {
        const draft = JSON.parse(saved) as Partial<FormData>
        Object.assign(form, draft)
      } catch {
        // ignore invalid draft
      }
    }
  }
})

onBeforeUnmount(() => {
  clearTimeout(draftTimer)
})

function validate(): boolean {
  errors.type = ''
  errors.title = ''
  errors.category_id = ''

  let valid = true

  if (!form.type) {
    errors.type = 'Selecione o tipo'
    valid = false
  }
  if (!form.title || form.title.trim().length < 3) {
    errors.title = 'Título deve ter ao menos 3 caracteres'
    valid = false
  }
  if (!form.category_id) {
    errors.category_id = 'Selecione uma categoria'
    valid = false
  }

  return valid
}

function handleSubmit() {
  submitError.value = ''
  if (!validate()) return
  emit('submit', { ...form }, imageFiles.value, deletedImageIds.value)
}

function setSubmitting(val: boolean) { submitting.value = val }
function setError(msg: string) { submitError.value = msg }
function clearDraft() { localStorage.removeItem(props.draftKey) }

defineExpose({ setSubmitting, setError, clearDraft })
</script>
