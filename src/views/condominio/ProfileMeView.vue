<template>
  <div class="p-4 max-w-lg mx-auto">
    <h2 class="text-xl font-bold text-gray-900 mb-6">Meu Perfil</h2>

    <div v-if="profile" class="space-y-6">
      <!-- Avatar -->
      <div class="flex flex-col items-center gap-3">
        <div class="relative">
          <AppAvatar :src="profile.avatar_url" :name="profile.full_name" size="xl" />
          <label class="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition">
            <PhPencilSimple class="text-white w-3 h-3" />
            <input type="file" accept="image/*" class="hidden" @change="handleAvatarChange" />
          </label>
        </div>
        <span v-if="uploading" class="text-xs text-gray-500">Enviando...</span>
      </div>

      <!-- Info cards -->
      <AppCard padding="none">
        <div class="divide-y divide-gray-50">
          <div class="px-4 py-3 flex items-center justify-between">
            <span class="text-sm text-gray-500">Nome</span>
            <span class="text-sm font-medium text-gray-900">{{ profile.full_name }}</span>
          </div>
          <div class="px-4 py-3 flex items-center justify-between">
            <span class="text-sm text-gray-500">Unidade</span>
            <span class="text-sm font-medium text-gray-900">{{ profile.unit || '—' }}</span>
          </div>
          <div class="px-4 py-3 flex items-center justify-between">
            <span class="text-sm text-gray-500">Telefone</span>
            <span class="text-sm font-medium text-gray-900">{{ profile.phone || '—' }}</span>
          </div>
          <div class="px-4 py-3 flex items-center justify-between">
            <span class="text-sm text-gray-500">Papel</span>
            <span class="text-sm font-medium text-gray-900">{{ ROLE_LABELS[profile.role] }}</span>
          </div>
        </div>
      </AppCard>

      <!-- Edit & signout buttons -->
      <AppButton variant="outline" full @click="showEdit = true">Editar perfil</AppButton>
      <AppButton variant="ghost" full @click="handleSignOut" class="text-red-600 hover:bg-red-50">Sair da conta</AppButton>
    </div>

    <!-- Edit modal -->
    <div v-if="showEdit" class="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold">Editar perfil</h3>

        <AppInput v-model="editForm.full_name" label="Nome completo" />
        <AppInput v-model="editForm.unit" label="Unidade/Apartamento" placeholder="Ex: 101, Bloco A" />
        <AppInput v-model="editForm.phone" label="Telefone" type="tel" placeholder="(11) 99999-9999" />

        <!-- Username com prefixo -->
        <AppFormField label="Nome de usuário (URL Pública)" :error="usernameError">
          <div class="flex items-center mt-1.5">
            <span class="text-gray-500 bg-gray-50 border border-gray-300 border-r-0 rounded-l-xl px-3 py-3 text-sm shrink-0">/profile/</span>
            <input
              v-model="editForm.username"
              type="text"
              placeholder="seu-nome"
              class="flex-1 px-4 py-3 border border-gray-300 rounded-r-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @input="editForm.username = editForm.username.toLowerCase().replace(/[^a-z0-9-]/g, '')"
            />
          </div>
        </AppFormField>

        <AppInput v-model="editForm.public_link" label="Link Público" type="url" placeholder="https://seusite.com" />
        <AppInput v-model="editForm.public_whatsapp" label="WhatsApp Público" type="tel" placeholder="(11) 99999-9999" />
        <AppInput v-model="editForm.public_address" label="Endereço Público" placeholder="Rua Exemplo, 123" />

        <AppToggle v-model="editForm.show_followers_count" label="Mostrar número de seguidores" />
        <AppToggle v-model="editForm.allow_direct_messages" label="Permitir mensagens diretas" />

        <div class="flex gap-3 pt-2">
          <AppButton variant="outline" class="flex-1" @click="showEdit = false">Cancelar</AppButton>
          <AppButton variant="primary" class="flex-1" :loading="saving" @click="saveProfile">Salvar</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { PhPencilSimple } from '@phosphor-icons/vue'
import { useCondominiumStore } from '@/stores/condominium'
import { useProfile } from '@/composables/useProfile'
import { ROLE_LABELS } from '@/utils/constants'
import type { Profile } from '@/types/app.types'
import { AppAvatar, AppCard, AppButton, AppInput, AppFormField, AppToggle } from '@/components/ui'

const router = useRouter()
const authStore = useAuthStore()
const condominiumStore = useCondominiumStore()
const { uploadAvatar, uploading } = useProfile()

const profile = ref<Profile | null>(null)
const showEdit = ref(false)
const saving = ref(false)
const usernameError = ref('')

const editForm = reactive({
  full_name: '',
  username: '',
  unit: '',
  phone: '',
  public_link: '',
  public_whatsapp: '',
  public_address: '',
  show_followers_count: true,
  allow_direct_messages: true,
})

onMounted(() => {
  profile.value = authStore.profile
  if (profile.value) {
    editForm.full_name = profile.value.full_name
    editForm.username = profile.value.username || ''
    editForm.unit = profile.value.unit || ''
    editForm.phone = profile.value.phone || ''
    editForm.public_link = profile.value.public_link || ''
    editForm.public_whatsapp = profile.value.public_whatsapp || ''
    editForm.public_address = profile.value.public_address || ''
    editForm.show_followers_count = profile.value.show_followers_count ?? true
    editForm.allow_direct_messages = profile.value.allow_direct_messages ?? true
  }
})

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.[0]) return
  await uploadAvatar(input.files[0])
  profile.value = authStore.profile
}

async function saveProfile() {
  usernameError.value = ''
  saving.value = true
  try {
    const formattedUsername = editForm.username.trim()
    let finalUsername = undefined
    if (formattedUsername) {
      if (formattedUsername !== profile.value?.username && condominiumStore.current) {
        const { data: isAvailable, error: rpcError } = await supabase.rpc('check_username_available', {
          p_username: formattedUsername,
          p_condominium_id: condominiumStore.current.id,
        })
        if (rpcError) { usernameError.value = 'Erro ao verificar disponibilidade.'; return }
        if (isAvailable === false) { usernameError.value = 'Este nome de usuário já está em uso neste condomínio.'; return }
      }
      finalUsername = formattedUsername
    }
    await authStore.updateProfile({
      full_name: editForm.full_name,
      username: finalUsername || null,
      unit: editForm.unit || undefined,
      phone: editForm.phone || undefined,
      public_link: editForm.public_link || undefined,
      public_whatsapp: editForm.public_whatsapp || undefined,
      public_address: editForm.public_address || undefined,
      show_followers_count: editForm.show_followers_count,
      allow_direct_messages: editForm.allow_direct_messages,
    } as any)
    profile.value = authStore.profile
    showEdit.value = false
  } finally {
    saving.value = false
  }
}

async function handleSignOut() {
  await authStore.signOut()
  await router.push('/login')
}
</script>
