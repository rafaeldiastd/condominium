<template>
  <form @submit.prevent="onSubmit" class="space-y-5">
    <!-- Título -->
    <AppInput v-model="form.title" label="Título" :error="errors.title" required />

    <!-- Descrição -->
    <AppTextarea v-model="form.description" label="Descrição" :rows="3" />

    <!-- Imagem -->
    <AppFormField label="Imagem do Banner" hint="PNG, JPG ou WebP. Máx. 5MB.">
      <div class="flex items-center gap-3 mt-1.5">
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        <AppButton type="button" variant="outline" size="sm" @click="fileInput?.click()">
          {{ imagePreview ? 'Trocar imagem' : 'Escolher imagem' }}
        </AppButton>
        <AppButton v-if="imagePreview" type="button" variant="ghost" size="sm" @click="removeImage" class="text-red-500 hover:text-red-600">
          Remover
        </AppButton>
      </div>
    </AppFormField>

    <!-- Banner Preview -->
    <div v-if="imagePreview || form.title" class="rounded-xl overflow-hidden relative bg-gray-900" style="height: 140px;">
      <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover opacity-80" alt="" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
        <p class="text-white font-bold text-lg leading-tight">{{ form.title || 'Título da campanha' }}</p>
      </div>
    </div>

    <!-- URL de destino -->
    <AppInput v-model="form.target_url" label="URL de Destino" type="url" placeholder="https://" />

    <!-- Datas -->
    <div class="grid grid-cols-2 gap-3">
      <AppInput v-model="form.starts_at" label="Início" type="datetime-local" :error="errors.starts_at" required />
      <AppInput v-model="form.ends_at" label="Término" type="datetime-local" :error="errors.ends_at" required />
    </div>

    <!-- Condomínios (multi-select com busca) -->
    <AppFormField label="Condomínios" :error="errors.condominiumIds" required>
      <div class="mt-1.5 space-y-2">
        <!-- Search input -->
        <input
          v-model="condoSearch"
          type="text"
          placeholder="Buscar condomínio para adicionar..."
          class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @input="onCondoSearch"
        />

        <!-- Search results -->
        <div v-if="condoSearchResults.length" class="border border-gray-200 rounded-xl max-h-40 overflow-auto">
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

        <!-- Selected tags -->
        <div v-if="selectedCondos.length" class="flex flex-wrap gap-2">
          <span
            v-for="c in selectedCondos" :key="c.id"
            class="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full"
          >
            {{ c.name }}
            <button type="button" class="hover:text-blue-900 font-bold leading-none" @click="removeCondo(c.id)">×</button>
          </span>
        </div>
      </div>
    </AppFormField>

    <!-- Submit -->
    <AppButton type="submit" variant="primary" full :loading="saving">
      Salvar Campanha
    </AppButton>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { AppButton, AppInput, AppTextarea, AppFormField } from '@/components/ui'
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

const form = reactive({ title: '', description: '', target_url: '', starts_at: '', ends_at: '' })
const errors = reactive({ title: '', starts_at: '', ends_at: '', condominiumIds: '' })

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}
function removeImage() { imagePreview.value = null; imageFile.value = null }

function onCondoSearch() {
  if (condoSearchTimeout) clearTimeout(condoSearchTimeout)
  condoSearchTimeout = setTimeout(async () => {
    if (!condoSearch.value.trim()) { condoSearchResults.value = []; return }
    const { data } = await supabase.from('condominiums').select('id, name, slug').ilike('name', `%${condoSearch.value}%`).limit(10)
    condoSearchResults.value = (data ?? []) as Condominium[]
  }, 300)
}

function toggleCondo(c: Condominium) {
  const idx = selectedCondoIds.value.indexOf(c.id)
  if (idx === -1) { selectedCondoIds.value.push(c.id); selectedCondos.value.push(c) }
  else { selectedCondoIds.value.splice(idx, 1); selectedCondos.value = selectedCondos.value.filter(sc => sc.id !== c.id) }
}
function removeCondo(id: string) {
  selectedCondoIds.value = selectedCondoIds.value.filter(cid => cid !== id)
  selectedCondos.value = selectedCondos.value.filter(c => c.id !== id)
}

async function uploadImage(): Promise<string | null> {
  if (!imageFile.value) return null
  const ext = imageFile.value.name.split('.').pop()
  const path = `campaigns/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('campaign-images').upload(path, imageFile.value, { upsert: true })
  if (error) return null
  return supabase.storage.from('campaign-images').getPublicUrl(path).data.publicUrl
}

function toISO(dt: string): string { return dt ? new Date(dt).toISOString() : dt }
function fromISO(iso: string): string { return iso ? iso.slice(0, 16) : '' }

function validate(): boolean {
  errors.title = ''; errors.starts_at = ''; errors.ends_at = ''; errors.condominiumIds = ''
  if (!form.title.trim()) { errors.title = 'Título é obrigatório.'; return false }
  if (!form.starts_at) { errors.starts_at = 'Data de início obrigatória.'; return false }
  if (!form.ends_at) { errors.ends_at = 'Data de término obrigatória.'; return false }
  if (selectedCondoIds.value.length === 0) { errors.condominiumIds = 'Selecione ao menos um condomínio.'; return false }
  return true
}

async function onSubmit() {
  if (!validate()) return
  let imageUrl: string | null = props.initialData?.image_url ?? null
  if (imageFile.value) imageUrl = await uploadImage()
  emit('submit', {
    title: form.title,
    description: form.description || null,
    target_url: form.target_url || null,
    starts_at: toISO(form.starts_at),
    ends_at: toISO(form.ends_at),
    ...(imageUrl ? { image_url: imageUrl } : {}),
  }, selectedCondoIds.value)
}

function initForm(data: Partial<Campaign>) {
  form.title = data.title ?? ''
  form.description = data.description ?? ''
  form.target_url = data.target_url ?? ''
  form.starts_at = data.starts_at ? fromISO(data.starts_at) : ''
  form.ends_at = data.ends_at ? fromISO(data.ends_at) : ''
  if (data.image_url) imagePreview.value = data.image_url
}

onMounted(() => { if (props.initialData) initForm(props.initialData) })
watch(() => props.initialData, (val) => { if (val) initForm(val) })
</script>
