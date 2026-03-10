<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
        <span class="text-white text-2xl font-bold">C</span>
      </div>
      <p class="text-gray-500 text-sm">Redirecionando...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (!authStore.isAuthenticated) {
    await router.push('/login')
    return
  }

  const profile = authStore.profile
  if (!profile) {
    await router.push('/login')
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
    await router.push('/login')
  }
})
</script>
