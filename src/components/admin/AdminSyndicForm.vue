<template>
  <form @submit.prevent="onSubmit" class="space-y-5">
    <!-- Nome completo -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Nome completo <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.full_name"
        type="text"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        :class="errors.full_name ? 'border-red-400' : ''"
      />
      <p v-if="errors.full_name" class="mt-1 text-xs text-red-500">{{ errors.full_name }}</p>
    </div>

    <!-- Email -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Email <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.email"
        type="email"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        :class="errors.email ? 'border-red-400' : ''"
      />
      <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
    </div>

    <!-- Enviar convite por magic link -->
    <div class="flex items-center gap-2">
      <input
        id="send_invite"
        v-model="form.send_invite"
        type="checkbox"
        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <label for="send_invite" class="text-sm text-gray-700">
        Enviar convite por email (magic link)
      </label>
    </div>

    <!-- Senha (somente se não enviar convite) -->
    <div v-if="!form.send_invite">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Senha <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.password"
        type="password"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        :class="errors.password ? 'border-red-400' : ''"
        placeholder="Mínimo 6 caracteres"
      />
      <p v-if="errors.password" class="mt-1 text-xs text-red-500">{{ errors.password }}</p>
    </div>

    <!-- Condomínio -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Condomínio <span class="text-red-500">*</span>
      </label>
      <div class="relative">
        <input
          v-model="condoSearch"
          type="text"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          :class="errors.condominium_id ? 'border-red-400' : ''"
          placeholder="Buscar condomínio..."
          @input="onCondoSearch"
          @focus="showDropdown = true"
          @blur="onBlur"
        />
        <div
          v-if="showDropdown && condoResults.length"
          class="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto"
        >
          <button
            v-for="c in condoResults"
            :key="c.id"
            type="button"
            class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition"
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
      <p v-if="errors.condominium_id" class="mt-1 text-xs text-red-500">{{ errors.condominium_id }}</p>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      class="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
      :disabled="saving"
    >
      {{ saving ? 'Criando...' : 'Criar Síndico' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { supabase } from '@/lib/supabase'
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
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Email inválido.'; return false
  }
  if (!form.send_invite && (!form.password || form.password.length < 6)) {
    errors.password = 'Senha deve ter ao menos 6 caracteres.'; return false
  }
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
