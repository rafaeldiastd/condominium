<template>
  <div class="w-full max-w-sm text-center">
    <div v-if="loading" class="space-y-4">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl">
        <span class="text-3xl">⏳</span>
      </div>
      <p class="text-gray-600">Verificando seu acesso...</p>
    </div>

    <div v-else-if="error" class="space-y-4">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl">
        <span class="text-3xl">❌</span>
      </div>
      <h2 class="text-xl font-bold text-gray-900">Link inválido</h2>
      <p class="text-sm text-gray-500">{{ error }}</p>
      <RouterLink to="/login" class="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium">
        Voltar ao login
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const { data, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    if (data.session) {
      await authStore.fetchProfile()
      const profile = authStore.profile

      if (!profile) {
        error.value = 'Perfil não encontrado.'
        return
      }

      if (profile.is_banned) {
        await router.push('/banned')
        return
      }

      if (profile.role === 'super_admin') {
        await router.push('/admin')
      } else if (profile.condominium?.slug) {
        if (profile.role === 'syndic') {
          await router.push(`/${profile.condominium.slug}/sindico`)
        } else {
          await router.push(`/${profile.condominium.slug}`)
        }
      } else {
        error.value = 'Conta não associada a um condomínio. Contate o síndico.'
      }
    } else {
      error.value = 'Link expirado ou inválido. Solicite um novo link de acesso.'
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erro ao verificar acesso.'
  } finally {
    loading.value = false
  }
})
</script>
