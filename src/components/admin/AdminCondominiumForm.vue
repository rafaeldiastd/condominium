<template>
  <form @submit.prevent="onSubmit" class="space-y-5">
    <!-- Nome -->
    <AppInput
      v-model="form.name"
      label="Nome"
      :error="errors.name"
      required
      @input="onNameInput"
    />

    <!-- Slug -->
    <AppFormField label="Slug" :error="errors.slug" required>
      <div class="relative mt-1.5">
        <input
          v-model="form.slug"
          type="text"
          class="w-full rounded-xl border bg-white px-4 py-3 pr-32 text-sm font-mono text-gray-900 transition-shadow
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          :class="slugBorderClass"
          placeholder="ex: residencial-jardins"
          @input="onSlugInput"
        />
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
          <span v-if="checkingSlug" class="text-gray-400">verificando...</span>
          <span v-else-if="form.slug && slugIsUnique === true" class="text-green-600">disponível</span>
          <span v-else-if="form.slug && slugIsUnique === false" class="text-red-500">indisponível</span>
        </span>
      </div>
    </AppFormField>

    <!-- Endereço -->
    <AppInput v-model="form.address" label="Endereço" />

    <!-- Cidade / Estado -->
    <div class="grid grid-cols-2 gap-3">
      <AppInput v-model="form.city" label="Cidade" />
      <AppInput v-model="form.state" label="Estado (UF)" :maxlength="2" />
    </div>

    <!-- Logo upload -->
    <AppFormField label="Logo" hint="PNG, JPG ou WebP. Máx. 2MB.">
      <div class="flex items-center gap-4 mt-1.5">
        <div class="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
          <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover" alt="logo preview" />
          <span v-else class="text-2xl text-gray-300">🏢</span>
        </div>
        <div class="flex items-center gap-2">
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
          <AppButton type="button" variant="outline" size="sm" @click="fileInput?.click()">
            {{ logoPreview ? 'Trocar imagem' : 'Escolher imagem' }}
          </AppButton>
          <AppButton v-if="logoPreview" type="button" variant="ghost" size="sm" @click="removeLogo" class="text-red-500 hover:text-red-600">
            Remover
          </AppButton>
        </div>
      </div>
    </AppFormField>

    <!-- Ativo (somente em edição) -->
    <AppToggle
      v-if="condominiumId"
      v-model="form.is_active"
      :label="`Condomínio ${form.is_active ? 'ativo' : 'inativo'}`"
    />

    <!-- Submit -->
    <AppButton
      type="submit"
      variant="primary"
      full
      :loading="saving"
      :disabled="!!form.slug && slugIsUnique === false"
    >
      Salvar
    </AppButton>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/utils/formatters'
import { AppButton, AppInput, AppFormField, AppToggle } from '@/components/ui'
import type { Condominium } from '@/types/app.types'

const props = defineProps<{
  condominiumId?: string
  initialData?: Partial<Condominium> | null
  saving?: boolean
}>()

const emit = defineEmits<{
  submit: [data: Record<string, unknown>]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const logoPreview = ref<string | null>(null)
const logoFile = ref<File | null>(null)
const checkingSlug = ref(false)
const slugIsUnique = ref<boolean | null>(null)
const errors = reactive({ name: '', slug: '' })

const form = reactive({
  name: '',
  slug: '',
  address: '',
  city: '',
  state: '',
  is_active: true,
})

let slugCheckTimeout: ReturnType<typeof setTimeout> | null = null

const slugBorderClass = computed(() => {
  if (!form.slug || checkingSlug.value) return 'border-gray-300'
  if (slugIsUnique.value === true) return 'border-green-400'
  if (slugIsUnique.value === false) return 'border-red-400'
  return 'border-gray-300'
})

function onNameInput() {
  if (!props.condominiumId) {
    form.slug = slugify(form.name)
    triggerSlugCheck()
  }
}

function onSlugInput() {
  form.slug = slugify(form.slug)
  triggerSlugCheck()
}

function triggerSlugCheck() {
  if (slugCheckTimeout) clearTimeout(slugCheckTimeout)
  if (!form.slug) { slugIsUnique.value = null; return }
  checkingSlug.value = true
  slugCheckTimeout = setTimeout(() => checkSlugUnique(form.slug), 500)
}

async function checkSlugUnique(slug: string) {
  try {
    let query = supabase.from('condominiums').select('id', { count: 'exact', head: true }).eq('slug', slug)
    if (props.condominiumId) query = query.neq('id', props.condominiumId)
    const { count } = await query
    slugIsUnique.value = (count ?? 0) === 0
  } finally {
    checkingSlug.value = false
  }
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

function removeLogo() {
  logoPreview.value = null
  logoFile.value = null
}

async function uploadLogo(): Promise<string | null> {
  if (!logoFile.value) return null
  const ext = logoFile.value.name.split('.').pop()
  const path = `condominiums/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, logoFile.value, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

function validate(): boolean {
  errors.name = ''
  errors.slug = ''
  if (!form.name.trim()) { errors.name = 'Nome é obrigatório.'; return false }
  if (!form.slug.trim()) { errors.slug = 'Slug é obrigatório.'; return false }
  if (!/^[a-z0-9-]+$/.test(form.slug)) { errors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens.'; return false }
  return true
}

async function onSubmit() {
  if (!validate()) return
  let logoUrl: string | null = props.initialData?.logo_url ?? null
  if (logoFile.value) logoUrl = await uploadLogo()
  const payload: Record<string, unknown> = {
    name: form.name,
    slug: form.slug,
    address: form.address || null,
    city: form.city || null,
    state: form.state ? form.state.toUpperCase() : null,
    ...(logoUrl ? { logo_url: logoUrl } : {}),
  }
  if (props.condominiumId) payload.is_active = form.is_active
  emit('submit', payload)
}

function loadInitialData(data: Partial<Condominium>) {
  form.name = data.name ?? ''
  form.slug = data.slug ?? ''
  form.address = data.address ?? ''
  form.city = data.city ?? ''
  form.state = data.state ?? ''
  form.is_active = data.is_active ?? true
  if (data.logo_url) logoPreview.value = data.logo_url
}

onMounted(() => { if (props.initialData) loadInitialData(props.initialData) })
watch(() => props.initialData, (val) => { if (val) loadInitialData(val) })
</script>
