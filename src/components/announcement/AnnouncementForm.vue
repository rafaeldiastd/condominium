<template>
  <form @submit.prevent="handleSubmit" class="space-y-5 p-4 pb-8">

    <!-- ① Type selector -->
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

    <!-- ② Subcategory (dynamic per type, replaces full category list) -->
    <div v-if="template.subcategories.length > 0">
      <label class="block text-sm font-medium text-gray-700 mb-1">Subcategoria</label>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="sub in template.subcategories"
          :key="sub"
          type="button"
          @click="form.subcategory = form.subcategory === sub ? '' : sub"
          class="px-3 py-2 rounded-xl border-2 text-xs font-medium text-left transition"
          :class="form.subcategory === sub
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 text-gray-600 hover:border-gray-300'"
        >{{ sub }}</button>
      </div>
    </div>

    <!-- ③ Title -->
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

    <!-- ④ Description -->
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

    <!-- ⑤ Multi-item toggle (shown when type supports items) -->
    <div v-if="template.showItemsSection" class="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-800">Múltiplos itens / Catálogo</p>
          <p class="text-xs text-gray-500 mt-0.5">Permite listar vários itens com preços individuais.</p>
        </div>
        <button
          type="button"
          @click="toggleMultiItem"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
          :class="form.is_multi_item ? 'bg-blue-600' : 'bg-gray-300'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
            :class="form.is_multi_item ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </div>
      <!-- Multi-item notice -->
      <div v-if="form.is_multi_item" class="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
        <PhInfo class="w-4 h-4 text-blue-500 flex-shrink-0" />
        <p class="text-xs text-blue-700">O card exibirá <strong>"Consulte valores no anúncio"</strong> em vez de um preço único.</p>
      </div>
    </div>

    <!-- ⑥ Price (single item mode only) -->
    <div v-if="template.showPriceField && !form.is_multi_item">
      <!-- Preço a combinar switch -->
      <div class="mb-4">
        <div class="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
          <span class="text-sm text-blue-800 font-semibold flex items-center gap-2"><PhTag class="w-4 h-4"/> Preço a combinar</span>
          <button
            type="button"
            @click="form.commerce_method = form.commerce_method === 'negotiable' ? '' : 'negotiable'"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :class="form.commerce_method === 'negotiable' ? 'bg-blue-600' : 'bg-gray-200'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="form.commerce_method === 'negotiable' ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>

      <div v-if="form.commerce_method !== 'negotiable'">
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
    </div>



    <!-- ⑧ Event fields -->
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

    <!-- ⑨ Business Hours – improved UI with days + holiday -->
    <div v-if="template.showBusinessHours" class="space-y-4">
      <label class="block text-sm font-medium text-gray-700">Horário de atendimento</label>

      <!-- Days of Week -->
      <div>
        <p class="text-xs text-gray-500 mb-2">Dias de funcionamento</p>
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-for="day in WEEK_DAYS"
            :key="day.key"
            type="button"
            @click="toggleDay(day.key)"
            class="w-10 h-10 rounded-full text-xs font-semibold border-2 transition"
            :class="form.business_days.includes(day.key)
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'"
          >{{ day.label }}</button>
        </div>
      </div>

      <!-- Time range -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-gray-50 rounded-2xl p-3 border border-gray-100">
          <p class="text-xs text-gray-500 mb-1 flex items-center gap-1"><PhSun class="w-3.5 h-3.5 text-amber-400" /> Abertura</p>
          <input
            v-model="form.business_open_time"
            type="time"
            class="w-full bg-transparent text-gray-900 font-semibold text-base focus:outline-none"
          />
        </div>
        <div class="bg-gray-50 rounded-2xl p-3 border border-gray-100">
          <p class="text-xs text-gray-500 mb-1 flex items-center gap-1"><PhMoon class="w-3.5 h-3.5 text-indigo-400" /> Fechamento</p>
          <input
            v-model="form.business_close_time"
            type="time"
            class="w-full bg-transparent text-gray-900 font-semibold text-base focus:outline-none"
          />
        </div>
      </div>

      <!-- Holiday option -->
      <div class="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <div class="flex items-center gap-2">
          <PhCalendarX class="w-4 h-4 text-amber-500 flex-shrink-0" />
          <div>
            <p class="text-sm font-medium text-gray-800">Fechado em feriados</p>
            <p class="text-xs text-gray-500">O anúncio será sinalizado como fechado em dias de feriado.</p>
          </div>
        </div>
        <button
          type="button"
          @click="form.closed_on_holidays = !form.closed_on_holidays"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 flex-shrink-0 ml-3"
          :class="form.closed_on_holidays ? 'bg-amber-500' : 'bg-gray-200'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
            :class="form.closed_on_holidays ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </div>
    </div>

    <!-- ⑩ Google Maps Link -->
    <div v-if="template.showMapsLink">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        <span class="flex items-center gap-1.5"><PhMapPin class="w-4 h-4 text-red-500" /> Link do Google Maps</span>
      </label>
      <input
        v-model="form.maps_link"
        type="url"
        placeholder="https://maps.google.com/..."
        class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
    </div>

    <!-- ⑪ Items Section (shown when is_multi_item OR type supports it) -->
    <AnnouncementItemsSection
      v-if="template.showItemsSection && form.is_multi_item"
      :show-price="template.showPriceField"
      :initial-items="initialItems"
      @update:items="itemsList = $event"
    />

    <!-- ⑫ Links Section -->
    <AnnouncementLinksSection
      :initial-links="initialLinks"
      @update:links="linksList = $event"
    />

    <!-- ⑬ WhatsApp Contacts Section -->
    <AnnouncementWhatsAppSection
      :initial-contacts="initialContacts"
      @update:contacts="contactsList = $event"
    />

    <!-- ⑭ Contact type (chat vs whatsapp legacy) -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Contato principal</label>
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
        <label class="block text-xs text-gray-500 mb-1">Número principal do WhatsApp (com DDD)</label>
        <input
          v-model="form.contact_whatsapp"
          type="tel"
          placeholder="(11) 99999-9999"
          maxlength="20"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        />
      </div>
    </div>

    <!-- ⑮ Images -->
    <AnnouncementImageUpload
      :max-images="5"
      :existing-images="existingImages"
      :initial-files="imageFiles"
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
import AnnouncementImageUpload from './AnnouncementImageUpload.vue'
import AnnouncementItemsSection from './AnnouncementItemsSection.vue'
import AnnouncementLinksSection from './AnnouncementLinksSection.vue'
import AnnouncementWhatsAppSection from './AnnouncementWhatsAppSection.vue'
import type { ItemFormData } from './AnnouncementItemsSection.vue'
import type { LinkFormData } from './AnnouncementLinksSection.vue'
import type { WhatsAppContactFormData } from './AnnouncementWhatsAppSection.vue'
import type { AnnouncementType, AnnouncementImage } from '@/types/app.types'
import { ANNOUNCEMENT_TEMPLATES, WEEK_DAYS, getCommerceMethods } from '@/config/announcementTemplates'

import {
  PhTag,
  PhWrench,
  PhGift,
  PhHandsPraying,
  PhCalendarBlank,
  PhMegaphone,
  PhChatCircle,
  PhWhatsappLogo,
  PhMapPin,
  PhInfo,
  PhSun,
  PhMoon,
  PhCalendarX,
} from '@phosphor-icons/vue'

import { useAuthStore } from '@/stores/auth'

interface FormData {
  type: AnnouncementType
  title: string
  description: string
  price: number | null
  price_negotiable: boolean
  is_multi_item: boolean
  subcategory: string
  commerce_method: string
  event_date: string
  event_location: string
  contact_type: 'chat' | 'whatsapp'
  contact_whatsapp: string
  maps_link: string
  business_open_time: string
  business_close_time: string
  business_days: string[]
  closed_on_holidays: boolean
}

const props = withDefaults(defineProps<{
  initialData?: Partial<FormData>
  existingImages?: Pick<AnnouncementImage, 'id' | 'url' | 'is_cover'>[]
  initialItems?: Omit<ItemFormData, '_key'>[]
  initialLinks?: Omit<LinkFormData, '_key'>[]
  initialContacts?: Omit<WhatsAppContactFormData, '_key'>[]
  isEdit?: boolean
  draftKey?: string
}>(), {
  existingImages: () => [],
  initialItems: () => [],
  initialLinks: () => [],
  initialContacts: () => [],
  isEdit: false,
  draftKey: 'announcement_draft',
})

const emit = defineEmits<{
  submit: [
    data: FormData,
    images: File[],
    deletedImageIds: string[],
    items: ItemFormData[],
    links: LinkFormData[],
    contacts: WhatsAppContactFormData[]
  ]
}>()

const authStore = useAuthStore()
const isSyndic = computed(() => authStore.isSyndic)

const submitting = ref(false)
const submitError = ref('')
const imageFiles = ref<File[]>([])
const deletedImageIds = ref<string[]>([])

// Pre-populate from initial props so even if sub-components don't emit before submit,
// existing items/links/contacts are preserved during edit.
const now = Date.now()
const itemsList = ref<ItemFormData[]>(
  props.initialItems.map((item, i) => ({ ...item, _key: `item_${i}_${now}` }))
)
const linksList = ref<LinkFormData[]>(
  props.initialLinks.map((l, i) => ({ ...l, _key: `link_${i}_${now}` }))
)
const contactsList = ref<WhatsAppContactFormData[]>(
  props.initialContacts.map((c, i) => ({ ...c, _key: `wa_${i}_${now}` }))
)


const form = reactive<FormData>({
  type: 'sale',
  title: '',
  description: '',
  price: null,
  price_negotiable: false,
  is_multi_item: false,
  subcategory: '',
  commerce_method: '',
  event_date: '',
  event_location: '',
  contact_type: 'chat',
  contact_whatsapp: '',
  maps_link: '',
  business_open_time: '',
  business_close_time: '',
  business_days: [],
  closed_on_holidays: false,
  ...props.initialData,
})

const errors = reactive({ type: '', title: '' })

const template = computed(() => ANNOUNCEMENT_TEMPLATES[form.type] ?? ANNOUNCEMENT_TEMPLATES.sale)

const activeCommerceMethods = computed(() =>
  getCommerceMethods(form.type, form.is_multi_item)
)

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
  return typeOptions.filter(t => !(t as any).syndicOnly)
})

function handleTypeChange(val: AnnouncementType) {
  form.type = val
  form.subcategory = ''
  form.commerce_method = ''
  form.is_multi_item = false
  if (!ANNOUNCEMENT_TEMPLATES[val].showPriceField) {
    form.price = null
    form.price_negotiable = false
  }
}

function toggleMultiItem() {
  form.is_multi_item = !form.is_multi_item
  // When enabling multi-item auto-select Tabelado if available
  if (form.is_multi_item) {
    form.commerce_method = 'tabelado'
  } else if (form.commerce_method === 'tabelado') {
    form.commerce_method = ''
  }
}

function toggleDay(key: string) {
  const idx = form.business_days.indexOf(key)
  if (idx >= 0) form.business_days.splice(idx, 1)
  else form.business_days.push(key)
}

// Auto-save draft
let draftTimer: ReturnType<typeof setTimeout>
watch(form, () => {
  clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    localStorage.setItem(props.draftKey, JSON.stringify(form))
  }, 1000)
}, { deep: true })

onMounted(async () => {
  // Restore draft (only for new announcements)
  if (!props.isEdit && !props.initialData?.title) {
    const saved = localStorage.getItem(props.draftKey)
    if (saved) {
      try {
        const draft = JSON.parse(saved) as Partial<FormData>
        Object.assign(form, draft)
      } catch { /* ignore */ }
    }
  }
})

onBeforeUnmount(() => clearTimeout(draftTimer))

function validate(): boolean {
  errors.type = ''
  errors.title = ''
  let valid = true
  if (!form.type) { errors.type = 'Selecione o tipo'; valid = false }
  if (!form.title || form.title.trim().length < 3) { errors.title = 'Título deve ter ao menos 3 caracteres'; valid = false }
  return valid
}

function handleSubmit() {
  submitError.value = ''
  if (!validate()) return
  emit('submit', { ...form }, imageFiles.value, deletedImageIds.value, itemsList.value, linksList.value, contactsList.value)
}

function setSubmitting(val: boolean) { submitting.value = val }
function setError(msg: string) { submitError.value = msg }
function clearDraft() { localStorage.removeItem(props.draftKey) }

defineExpose({ setSubmitting, setError, clearDraft })
</script>
