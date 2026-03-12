<template>
  <form @submit.prevent="handleSubmit" class="space-y-5 p-4 pb-8">
    <!-- Type selector -->
    <AppFormField label="Tipo de anúncio" required :error="errors.type">
      <div class="grid grid-cols-2 gap-3 mt-1.5">
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
    </AppFormField>

    <!-- Title -->
    <AppInput
      v-model="form.title"
      label="Título"
      placeholder="Ex: Sofá de 3 lugares, quase novo"
      :maxlength="100"
      :show-count="true"
      :error="errors.title"
      required
    />

    <!-- Description -->
    <AppTextarea
      v-model="form.description"
      label="Descrição"
      placeholder="Descreva o item ou serviço com detalhes..."
      :rows="4"
      :maxlength="2000"
      :show-count="true"
    />

    <!-- Price (for sale/service) -->
    <div v-if="showPriceField" class="space-y-3">
      <AppInput
        v-model.number="form.price"
        :label="form.type === 'service' ? 'Valor do serviço' : 'Preço'"
        hint="Deixe em branco para negociável"
        prefix="R$"
        type="number"
        placeholder="0,00"
      />
      <AppToggle v-model="form.price_negotiable" label="Preço negociável" />
    </div>

    <!-- Event fields -->
    <div v-if="form.type === 'event'" class="space-y-3">
      <AppInput
        v-model="form.event_date"
        label="Data e horário do evento"
        type="datetime-local"
      />
      <AppInput
        v-model="form.event_location"
        label="Local do evento"
        placeholder="Ex: Salão de festas, Térreo"
      />
    </div>

    <!-- Category -->
    <AppSelect
      v-model="form.category_id"
      label="Categoria"
      placeholder="Selecione uma categoria"
      :error="errors.category_id"
      required
    >
      <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
    </AppSelect>

    <!-- Forma de contato -->
    <AppFormField label="Forma de contato">
      <div class="flex gap-3 mt-1.5">
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
        <AppInput
          v-model="form.contact_whatsapp"
          label="Número do WhatsApp (com DDD)"
          type="tel"
          placeholder="(11) 99999-9999"
          :maxlength="20"
        />
      </div>
    </AppFormField>

    <!-- Images -->
    <AppFormField label="Imagens" hint="Máx. 5 imagens, PNG/JPG/WebP">
      <AnnouncementImageUpload
        :max-images="5"
        :existing-images="existingImages"
        @update:files="imageFiles = $event"
        @delete-existing="deletedImageIds.push($event)"
      />
    </AppFormField>

    <!-- Submit error -->
    <p v-if="submitError" class="text-sm text-red-600 text-center">{{ submitError }}</p>

    <!-- Submit -->
    <AppButton type="submit" variant="primary" size="lg" full :loading="submitting">
      {{ isEdit ? 'Salvar alterações' : 'Publicar anúncio' }}
    </AppButton>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import AnnouncementImageUpload from './AnnouncementImageUpload.vue'
import { AppButton, AppInput, AppTextarea, AppSelect, AppFormField, AppToggle } from '@/components/ui'
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
    if (c.id === form.category_id) return true
    if (t === 'sale') return c.slug.startsWith('produ-')
    if (t === 'service') return c.slug.startsWith('serv-')
    if (t === 'donation') return c.slug.startsWith('doac-')
    if (t === 'donation_request') return c.slug.startsWith('ped-')
    if (t === 'event') return c.slug.startsWith('event-')
    if (t === 'campaign') return c.slug.startsWith('camp-')
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
  form.category_id = ''
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

onMounted(async () => {
  const { data } = await supabase.from('categories').select('*').order('sort_order')
  categories.value = (data ?? []) as Category[]

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
  if (!form.type) { errors.type = 'Selecione o tipo'; valid = false }
  if (!form.title || form.title.trim().length < 3) { errors.title = 'Título deve ter ao menos 3 caracteres'; valid = false }
  if (!form.category_id) { errors.category_id = 'Selecione uma categoria'; valid = false }
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
