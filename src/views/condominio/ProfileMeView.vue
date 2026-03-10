<template>
  <div class="p-4 max-w-lg mx-auto">
    <h2 class="text-xl font-bold text-gray-900 mb-6">Meu Perfil</h2>

    <div v-if="profile" class="space-y-6">
      <!-- Avatar -->
      <div class="flex flex-col items-center gap-3">
        <div class="relative">
          <img
            v-if="profile.avatar_url"
            :src="profile.avatar_url"
            class="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            alt="Avatar"
          />
          <div v-else class="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
            {{ profile.full_name.charAt(0).toUpperCase() }}
          </div>
          <label class="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition">
            <PhPencilSimple class="text-white w-3 h-3" />
            <input type="file" accept="image/*" class="hidden" @change="handleAvatarChange" />
          </label>
        </div>
        <span v-if="uploading" class="text-xs text-gray-500">Enviando...</span>
      </div>

      <!-- Info cards -->
      <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
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

      <!-- Edit button -->
      <button
        @click="showEdit = true"
        class="w-full py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        Editar perfil
      </button>

      <!-- Sign out -->
      <button
        @click="handleSignOut"
        class="w-full py-3 text-red-600 text-sm font-medium hover:bg-red-50 rounded-xl transition"
      >
        Sair da conta
      </button>
    </div>

    <!-- Edit modal -->
    <div v-if="showEdit" class="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold">Editar perfil</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input v-model="editForm.full_name" type="text" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Unidade/Apartamento</label>
          <input v-model="editForm.unit" type="text" placeholder="Ex: 101, Bloco A" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input v-model="editForm.phone" type="tel" placeholder="(11) 99999-9999" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome de usuário (URL Pública)</label>
          <div class="flex items-center gap-2">
            <span class="text-gray-500 bg-gray-50 border border-gray-300 rounded-l-xl px-3 py-3 border-r-0 text-sm">/profile/</span>
            <input 
              v-model="editForm.username" 
              type="text" 
              placeholder="seu-nome" 
              class="flex-1 w-full px-4 py-3 border border-gray-300 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              @input="editForm.username = editForm.username.toLowerCase().replace(/[^a-z0-9-]/g, '')"
            />
          </div>
          <p v-if="usernameError" class="text-xs text-red-500 mt-1">{{ usernameError }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Link Público</label>
          <input v-model="editForm.public_link" type="url" placeholder="https://seusite.com" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp Público</label>
           <input v-model="editForm.public_whatsapp" type="tel" placeholder="(11) 99999-9999" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
           <label class="block text-sm font-medium text-gray-700 mb-1">Endereço Público</label>
           <input v-model="editForm.public_address" type="text" placeholder="Rua Exemplo, 123" class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div class="flex items-center gap-2 mt-2">
          <input type="checkbox" id="show_followers" v-model="editForm.show_followers_count" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label for="show_followers" class="text-sm text-gray-700">Mostrar número de seguidores</label>
        </div>

        <div class="flex items-center gap-2 mb-2">
          <input type="checkbox" id="allow_dm" v-model="editForm.allow_direct_messages" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label for="allow_dm" class="text-sm text-gray-700">Permitir mensagens diretas</label>
        </div>

        <div class="flex gap-3">
          <button @click="showEdit = false" class="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium">Cancelar</button>
          <button @click="saveProfile" :disabled="saving" class="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
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
    
    // Validar Username Se preenchido
    if (formattedUsername) {
        if (formattedUsername !== profile.value?.username && condominiumStore.current) {
            // Check availability
            const { data: isAvailable, error: rpcError } = await supabase.rpc('check_username_available', {
                p_username: formattedUsername,
                p_condominium_id: condominiumStore.current.id
            })
            
            if (rpcError) {
                console.error('RPC Error on check_username_available:', rpcError)
                usernameError.value = 'Erro ao verificar disponibilidade. A migration SQL foi rodada?'
                return
            }
            if (isAvailable === false) {
                usernameError.value = 'Este nome de usuário já está em uso neste condomínio.'
                return
            }
        }
        finalUsername = formattedUsername
    }

    await authStore.updateProfile({
      full_name: editForm.full_name,
      username: finalUsername || null, // null removes the username
      unit: editForm.unit || undefined,
      phone: editForm.phone || undefined,
      public_link: editForm.public_link || undefined,
      public_whatsapp: editForm.public_whatsapp || undefined,
      public_address: editForm.public_address || undefined,
      show_followers_count: editForm.show_followers_count,
      allow_direct_messages: editForm.allow_direct_messages,
    } as any) // Typecast for the backend removing string | null
    
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
