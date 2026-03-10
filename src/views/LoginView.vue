<template>
  <div class="w-full max-w-sm">
    <!-- Logo/Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
        <span class="text-white text-2xl font-bold">C</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Condomiinus</h1>
      <p class="text-sm text-gray-500 mt-1">Seu condomínio conectado</p>
    </div>



    <!-- Error message -->
    <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
      <p class="text-sm text-red-700">{{ errorMessage }}</p>
    </div>

    <!-- Password form -->
    <form @submit.prevent="handlePasswordLogin" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          placeholder="seu@email.com"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          :class="{ 'border-red-400': emailError }"
        />
        <p v-if="emailError" class="mt-1 text-xs text-red-600">{{ emailError }}</p>
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
        <div class="relative">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            :class="{ 'border-red-400': passwordError }"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
        </div>
        <p v-if="passwordError" class="mt-1 text-xs text-red-600">{{ passwordError }}</p>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <span v-if="loading">Entrando...</span>
        <span v-else>Entrar</span>
      </button>
    </form>


  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')

const loading = computed(() => authStore.loading)

// Client-side validation
const emailError = computed(() => {
  if (!email.value) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? '' : 'Email inválido'
})

const passwordError = computed(() => {
  if (!password.value) return ''
  return password.value.length >= 6 ? '' : 'Mínimo 6 caracteres'
})

async function handlePasswordLogin() {
  errorMessage.value = ''
  if (emailError.value || passwordError.value) return

  try {
    await authStore.signIn(email.value, password.value)
    await redirectAfterLogin()
  } catch (err: unknown) {
    const error = err as Error
    if (error.message?.includes('Invalid login credentials')) {
      errorMessage.value = 'Email ou senha incorretos.'
    } else if (error.message?.includes('Email not confirmed')) {
      errorMessage.value = 'Email não confirmado. Verifique sua caixa de entrada.'
    } else {
      errorMessage.value = error.message || 'Erro ao fazer login. Tente novamente.'
    }
  }
}



async function redirectAfterLogin() {
  await authStore.fetchProfile()
  const redirect = route.query.redirect as string

  if (redirect && !redirect.startsWith('/login') && !redirect.startsWith('/confirm')) {
    await router.push(redirect)
    return
  }

  const profile = authStore.profile
  if (!profile) {
    errorMessage.value = 'Perfil não encontrado. Contate o administrador.'
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
    errorMessage.value = 'Sua conta ainda não foi associada a um condomínio. Contate o síndico.'
  }
}
</script>
