<template>
  <form @submit.prevent="onSubmit" class="space-y-5">
    <!-- Nome completo -->
    <AppInput
      v-model="form.full_name"
      label="Nome completo"
      :error="errors.full_name"
      required
    />

    <!-- Email -->
    <AppInput
      v-model="form.email"
      label="Email"
      type="email"
      :error="errors.email"
      required
    />

    <!-- Enviar convite -->
    <AppToggle
      v-model="form.send_invite"
      label="Enviar convite por email (magic link)"
    />

    <!-- Senha (somente se não enviar convite) -->
    <AppInput
      v-if="!form.send_invite"
      v-model="form.password"
      label="Senha"
      type="password"
      placeholder="Mínimo 6 caracteres"
      :error="errors.password"
      required
    />

    <!-- Condomínio (autocomplete) -->
    <AppFormField label="Condomínio" :error="errors.condominium_id" required>
      <div class="relative mt-1.5">
        <input
          v-model="condoSearch"
          type="text"
          class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          :class="errors.condominium_id ? 'border-red-400' : 'border-gray-300'"
          placeholder="Buscar condomínio..."
          @input="onCondoSearch"
          @focus="showDropdown = true"
          @blur="onBlur"
        />
        <div
          v-if="showDropdown && condoResults.length"
          class="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto"
        >
          <button
            v-for="c in condoResults"
            :key="c.id"
            type="button"
            class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition"
            @mousedown.prevent="selectCondo(c)"
          >
            <span class="font-medium">{{ c.name }}</span>
            <span class="ml-1 text-gray-400 text-xs">{{ c.slug }}</span>
          </button>
        </div>
      </div>
      <p v-if="selectedCondo" class="mt-1 text-xs text-green-600">
        Selecionado: {{ selectedCondo.name }}
      </p>
    </AppFormField>

    <!-- Submit -->
    <AppButton type="submit" variant="primary" full :loading="saving">
      Criar Síndico
    </AppButton>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { supabase } from '@/lib/supabase'
import { AppButton, AppInput, AppFormField, AppToggle } from '@/components/ui'
import type { Condominium } from '@/types/app.types'

defineProps<{ saving?: boolean }>()

const emit = defineEmits<{
  submit: [data: {
    full_name: string
    email: string
    password?: string
    condominium_id: string
    send_invite?: boolean
  }]
}>()

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  send_invite: false,
})

const errors = reactive({
  full_name: '',
  email: '',
  password: '',
  condominium_id: '',
})

const condoSearch = ref('')
const condoResults = ref<Condominium[]>([])
const selectedCondo = ref<Condominium | null>(null)
const showDropdown = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onCondoSearch() {
  selectedCondo.value = null
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    if (!condoSearch.value.trim()) { condoResults.value = []; return }
    const { data } = await supabase
      .from('condominiums')
      .select('id, name, slug')
      .ilike('name', `%${condoSearch.value}%`)
      .eq('is_active', true)
      .limit(10)
    condoResults.value = (data ?? []) as Condominium[]
  }, 300)
}

function selectCondo(c: Condominium) {
  selectedCondo.value = c
  condoSearch.value = c.name
  condoResults.value = []
  showDropdown.value = false
}

function onBlur() {
  setTimeout(() => { showDropdown.value = false }, 150)
}

function validate(): boolean {
  errors.full_name = ''
  errors.email = ''
  errors.password = ''
  errors.condominium_id = ''
  if (!form.full_name.trim()) { errors.full_name = 'Nome é obrigatório.'; return false }
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Email inválido.'; return false }
  if (!form.send_invite && (!form.password || form.password.length < 6)) { errors.password = 'Senha deve ter ao menos 6 caracteres.'; return false }
  if (!selectedCondo.value) { errors.condominium_id = 'Selecione um condomínio.'; return false }
  return true
}

function onSubmit() {
  if (!validate()) return
  emit('submit', {
    full_name: form.full_name,
    email: form.email,
    condominium_id: selectedCondo.value!.id,
    send_invite: form.send_invite,
    ...(form.send_invite ? {} : { password: form.password }),
  })
}
</script>
