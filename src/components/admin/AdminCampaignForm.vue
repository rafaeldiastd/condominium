<template>
  <form @submit.prevent="onSubmit" class="space-y-5">
    <!-- Título -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Título <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.title"
        type="text"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        :class="errors.title ? 'border-red-400' : ''"
      />
      <p v-if="errors.title" class="mt-1 text-xs text-red-500">{{ errors.title }}</p>
    </div>

    <!-- Descrição -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
      <textarea
        v-model="form.description"
        rows="3"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
      />
    </div>

    <!-- Imagem -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Imagem do Banner</label>
      <div class="flex items-start gap-4">
        <div class="flex-1">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          />
          <button
            type="button"
            class="text-sm px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
            @click="fileInput?.click()"
          >
            {{ imagePreview ? 'Trocar imagem' : 'Escolher imagem' }}
          </button>
          <button
            v-if="imagePreview"
            type="button"
            class="ml-2 text-sm text-red-500 hover:underline"
            @click="removeImage"
          >
            Remover
          </button>
          <p class="text-xs text-gray-400 mt-1">PNG, JPG ou WebP. Máx. 5MB.</p>
        </div>
      </div>
    </div>

    <!-- Banner Preview -->
    <div v-if="imagePreview || form.title" class="rounded-xl overflow-hidden relative bg-gray-900" style="height: 140px;">
      <img
        v-if="imagePreview"
        :src="imagePreview"
        class="w-full h-full object-cover opacity-80"
        alt=""
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
        <p class="text-white font-bold text-lg leading-tight">{{ form.title || 'Título da campanha' }}</p>
      </div>
    </div>

    <!-- URL de destino -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">URL de Destino</label>
      <input
        v-model="form.target_url"
        type="url"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="https://"
      />
    </div>

    <!-- Datas -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Início <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.starts_at"
          type="datetime-local"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          :class="errors.starts_at ? 'border-red-400' : ''"
        />
        <p v-if="errors.starts_at" class="mt-1 text-xs text-red-500">{{ errors.starts_at }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Término <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.ends_at"
          type="datetime-local"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          :class="errors.ends_at ? 'border-red-400' : ''"
        />
        <p v-if="errors.ends_at" class="mt-1 text-xs text-red-500">{{ errors.ends_at }}</p>
      </div>
    </div>

    <!-- Condomínios (multi-select com busca) -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Condomínios <span class="text-red-500">*</span>
      </label>

      <!-- Search input -->
      <input
        v-model="condoSearch"
        type="text"
        placeholder="Buscar condomínio para adicionar..."
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mb-2"
        @input="onCondoSearch"
      />

      <!-- Search results -->
      <div v-if="condoSearchResults.length" class="border border-gray-200 rounded-lg mb-2 max-h-40 overflow-auto">
        <label
          v-for="c in condoSearchResults"
          :key="c.id"
          class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
        >
          <input
            type="checkbox"
            :checked="selectedCondoIds.includes(c.id)"
            class="rounded border-gray-300 text-blue-600"
            @change="toggleCondo(c)"
          />
          <span>{{ c.name }}</span>
          <span class="text-gray-400 text-xs font-mono">{{ c.slug }}</span>
        </label>
      </div>

      <!-- Selected condominiums tags -->
      <div v-if="selectedCondos.length" class="flex flex-wrap gap-2">
        <span
          v-for="c in selectedCondos"
          :key="c.id"
          class="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
        >
          {{ c.name }}
          <button type="button" class="hover:text-blue-900 font-bold" @click="removeCondo(c.id)">×</button>
        </span>
      </div>
      <p v-if="errors.condominiumIds" class="mt-1 text-xs text-red-500">{{ errors.condominiumIds }}</p>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      class="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
      :disabled="saving"
    >
      {{ saving ? 'Salvando...' : 'Salvar Campanha' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Campaign, Condominium } from '@/types/app.types'

const props = defineProps<{
  campaignId?: string
  initialData?: Partial<Campaign> | null
  saving?: boolean
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>, condominiumIds: string[]]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const imageFile = ref<File | null>(null)

const condoSearch = ref('')
const condoSearchResults = ref<Condominium[]>([])
const selectedCondos = ref<Condominium[]>([])
const selectedCondoIds = ref<string[]>([])

let condoSearchTimeout: ReturnType<typeof setTimeout> | null = null

const form = reactive({
  title: '',
  description: '',
  target_url: '',
  starts_at: '',
  ends_at: '',
})

const errors = reactive({
  title: '',
  starts_at: '',
  ends_at: '',
  condominiumIds: '',
})

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function removeImage() {
  imagePreview.value = null
  imageFile.value = null
}

function onCondoSearch() {
  if (condoSearchTimeout) clearTimeout(condoSearchTimeout)
  condoSearchTimeout = setTimeout(async () => {
    if (!condoSearch.value.trim()) { condoSearchResults.value = []; return }
    const { data } = await supabase
      .from('condominiums')
      .select('id, name, slug')
      .ilike('name', `%${condoSearch.value}%`)
      .limit(10)
    condoSearchResults.value = (data ?? []) as Condominium[]
  }, 300)
}

function toggleCondo(c: Condominium) {
  const idx = selectedCondoIds.value.indexOf(c.id)
  if (idx === -1) {
    selectedCondoIds.value.push(c.id)
    selectedCondos.value.push(c)
  } else {
    selectedCondoIds.value.splice(idx, 1)
    selectedCondos.value = selectedCondos.value.filter((sc) => sc.id !== c.id)
  }
}

function removeCondo(id: string) {
  selectedCondoIds.value = selectedCondoIds.value.filter((cid) => cid !== id)
  selectedCondos.value = selectedCondos.value.filter((c) => c.id !== id)
}

async function uploadImage(): Promise<string | null> {
  if (!imageFile.value) return null
  const ext = imageFile.value.name.split('.').pop()
  const path = `campaigns/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('campaign-images')
    .upload(path, imageFile.value, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('campaign-images').getPublicUrl(path)
  return data.publicUrl
}

function toISO(dt: string): string {
  if (!dt) return dt
  // datetime-local value → ISO string
  return new Date(dt).toISOString()
}

function fromISO(iso: string): string {
  if (!iso) return ''
  // ISO → datetime-local value (slice to minutes)
  return iso.slice(0, 16)
}

function validate(): boolean {
  errors.title = ''
  errors.starts_at = ''
  errors.ends_at = ''
  errors.condominiumIds = ''

  if (!form.title.trim()) { errors.title = 'Título é obrigatório.'; return false }
  if (!form.starts_at) { errors.starts_at = 'Data de início obrigatória.'; return false }
  if (!form.ends_at) { errors.ends_at = 'Data de término obrigatória.'; return false }
  if (selectedCondoIds.value.length === 0) {
    errors.condominiumIds = 'Selecione ao menos um condomínio.'
    return false
  }
  return true
}

async function onSubmit() {
  if (!validate()) return

  let imageUrl: string | null = props.initialData?.image_url ?? null
  if (imageFile.value) {
    imageUrl = await uploadImage()
  }

  const payload: Record<string, unknown> = {
    title: form.title,
    description: form.description || null,
    target_url: form.target_url || null,
    starts_at: toISO(form.starts_at),
    ends_at: toISO(form.ends_at),
    ...(imageUrl ? { image_url: imageUrl } : {}),
  }

  emit('submit', payload, selectedCondoIds.value)
}

function initForm(data: Partial<Campaign>) {
  form.title = data.title ?? ''
  form.description = data.description ?? ''
  form.target_url = data.target_url ?? ''
  form.starts_at = data.starts_at ? fromISO(data.starts_at) : ''
  form.ends_at = data.ends_at ? fromISO(data.ends_at) : ''
  if (data.image_url) imagePreview.value = data.image_url
}

onMounted(() => {
  if (props.initialData) initForm(props.initialData)
})

watch(() => props.initialData, (val) => {
  if (val) initForm(val)
})
</script>
