<template>
  <form @submit.prevent="onSubmit" class="space-y-5">
    <!-- Nome -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Nome <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.name"
        type="text"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        :class="errors.name ? 'border-red-400' : ''"
        @input="onNameInput"
      />
      <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
    </div>

    <!-- Slug -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Slug <span class="text-red-500">*</span>
      </label>
      <div class="relative">
        <input
          v-model="form.slug"
          type="text"
          class="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
          :class="slugStatusClass"
          placeholder="ex: residencial-jardins"
          @input="onSlugInput"
        />
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
          <span v-if="checkingSlug" class="text-gray-400">verificando...</span>
          <span v-else-if="form.slug && slugIsUnique === true" class="text-green-600">disponível</span>
          <span v-else-if="form.slug && slugIsUnique === false" class="text-red-500">indisponível</span>
        </span>
      </div>
      <p v-if="errors.slug" class="mt-1 text-xs text-red-500">{{ errors.slug }}</p>
    </div>

    <!-- Endereço -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
      <input
        v-model="form.address"
        type="text"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
    </div>

    <!-- Cidade / Estado -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
        <input
          v-model="form.city"
          type="text"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
        <input
          v-model="form.state"
          type="text"
          maxlength="2"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
    </div>

    <!-- Logo upload -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Logo</label>
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
          <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover" alt="logo preview" />
          <span v-else class="text-2xl text-gray-300">🏢</span>
        </div>
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
            {{ logoPreview ? 'Trocar imagem' : 'Escolher imagem' }}
          </button>
          <button
            v-if="logoPreview"
            type="button"
            class="ml-2 text-sm text-red-500 hover:underline"
            @click="removeLogo"
          >
            Remover
          </button>
          <p class="text-xs text-gray-400 mt-1">PNG, JPG ou WebP. Máx. 2MB.</p>
        </div>
      </div>
    </div>

    <!-- Ativo (somente em edição) -->
    <div v-if="condominiumId" class="flex items-center gap-3 py-2">
      <label class="relative inline-flex items-center cursor-pointer">
        <input v-model="form.is_active" type="checkbox" class="sr-only peer" />
        <div class="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition peer-checked:after:translate-x-4"></div>
      </label>
      <span class="text-sm font-medium text-gray-700">
        Condomínio {{ form.is_active ? 'ativo' : 'inativo' }}
      </span>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      class="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
      :disabled="saving || (!!form.slug && slugIsUnique === false)"
    >
      {{ saving ? 'Salvando...' : 'Salvar' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { slugify } from '@/utils/formatters'
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

const slugStatusClass = computed(() => {
  if (!form.slug) return 'border-gray-300'
  if (checkingSlug.value) return 'border-gray-300'
  if (slugIsUnique.value === true) return 'border-green-400'
  if (slugIsUnique.value === false) return 'border-red-400'
  return 'border-gray-300'
})

function onNameInput() {
  if (!props.condominiumId) {
    // Auto-generate slug only on creation
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
    let query = supabase
      .from('condominiums')
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug)

    if (props.condominiumId) {
      query = query.neq('id', props.condominiumId)
    }

    const { count } = await query
    slugIsUnique.value = (count ?? 0) === 0
  } finally {
    checkingSlug.value = false
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

function removeLogo() {
  logoPreview.value = null
  logoFile.value = null
  form.is_active = form.is_active // keep reactive
}

async function uploadLogo(): Promise<string | null> {
  if (!logoFile.value) return null
  const ext = logoFile.value.name.split('.').pop()
  const path = `condominiums/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, logoFile.value, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

function validate(): boolean {
  errors.name = ''
  errors.slug = ''
  if (!form.name.trim()) {
    errors.name = 'Nome é obrigatório.'
    return false
  }
  if (!form.slug.trim()) {
    errors.slug = 'Slug é obrigatório.'
    return false
  }
  if (!/^[a-z0-9-]+$/.test(form.slug)) {
    errors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens.'
    return false
  }
  return true
}

async function onSubmit() {
  if (!validate()) return

  let logoUrl: string | null = props.initialData?.logo_url ?? null
  if (logoFile.value) {
    logoUrl = await uploadLogo()
  }

  const payload: Record<string, unknown> = {
    name: form.name,
    slug: form.slug,
    address: form.address || null,
    city: form.city || null,
    state: form.state ? form.state.toUpperCase() : null,
    ...(logoUrl ? { logo_url: logoUrl } : {}),
  }

  if (props.condominiumId) {
    payload.is_active = form.is_active
  }

  emit('submit', payload)
}

onMounted(() => {
  if (props.initialData) {
    form.name = props.initialData.name ?? ''
    form.slug = props.initialData.slug ?? ''
    form.address = props.initialData.address ?? ''
    form.city = props.initialData.city ?? ''
    form.state = props.initialData.state ?? ''
    form.is_active = props.initialData.is_active ?? true
    if (props.initialData.logo_url) {
      logoPreview.value = props.initialData.logo_url
    }
  }
})

watch(() => props.initialData, (val) => {
  if (val) {
    form.name = val.name ?? ''
    form.slug = val.slug ?? ''
    form.address = val.address ?? ''
    form.city = val.city ?? ''
    form.state = val.state ?? ''
    form.is_active = val.is_active ?? true
    if (val.logo_url) logoPreview.value = val.logo_url
  }
})
</script>
