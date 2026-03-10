<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="text-center max-w-sm space-y-4">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-2xl">
        <span class="text-4xl">🚫</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Acesso suspenso</h1>
      <p class="text-gray-500 text-sm">
        Sua conta foi suspensa pelo síndico do condomínio.
        Entre em contato com a administração para mais informações.
      </p>
      <button
        @click="handleSignOut"
        class="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition"
      >
        Sair
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function handleSignOut() {
  await authStore.signOut()
  await router.push('/login')
}
</script>
