<template>
  <div class="p-4 max-w-lg mx-auto">
    <button @click="$router.back()" class="flex items-center gap-2 text-sm text-gray-500 mb-4 hover:text-gray-700">
      ← Voltar
    </button>

    <div v-if="loading" class="space-y-4">
      <div class="animate-pulse">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-32"></div>
            <div class="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="profile">
      <!-- Profile header -->
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700 overflow-hidden flex-shrink-0">
          <img v-if="profile.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" alt="Avatar" />
          <span v-else>{{ profile.full_name.charAt(0).toUpperCase() }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="font-bold text-gray-900">{{ profile.full_name }}</h2>
          <p class="text-sm text-gray-500">{{ profile.unit ? `Unidade ${profile.unit}` : '' }}</p>
          <p v-if="profile.show_followers_count !== false" class="text-xs text-gray-400 mt-0.5">{{ followersCount }} seguidor{{ followersCount !== 1 ? 'es' : '' }}</p>
        </div>
        <!-- Botão seguir (não mostra para o próprio usuário) -->
        <button
          v-if="!isSelf"
          @click="handleToggleFollow"
          :disabled="followLoading"
          class="px-4 py-2 rounded-xl text-sm font-medium transition flex-shrink-0"
          :class="following
            ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            : 'bg-blue-600 text-white hover:bg-blue-700'"
        >
          {{ following ? 'Seguindo' : 'Seguir' }}
        </button>
      </div>

      <!-- Announcements count -->
      <p class="text-sm text-gray-500 mb-3">{{ announcements.length }} anúncio{{ announcements.length !== 1 ? 's' : '' }}</p>

      <!-- Public Info -->
      <div v-if="profile.public_link || profile.public_whatsapp || profile.public_address" class="bg-white rounded-xl border border-gray-100 p-4 mb-6 space-y-3">
        <h3 class="text-sm font-medium text-gray-900">Contato & Informações</h3>
        <div v-if="profile.public_link" class="flex items-center gap-2 text-sm">
          <span class="text-gray-400">🔗</span>
          <a :href="profile.public_link.startsWith('http') ? profile.public_link : `https://${profile.public_link}`" target="_blank" class="text-blue-600 hover:underline break-all">{{ profile.public_link.replace(/^https?:\/\//, '') }}</a>
        </div>
        <div v-if="profile.public_whatsapp" class="flex items-center gap-2 text-sm">
          <span class="text-gray-400">📱</span>
          <a :href="`https://wa.me/55${profile.public_whatsapp.replace(/\D/g, '')}`" target="_blank" class="text-green-600 hover:underline">{{ profile.public_whatsapp }}</a>
        </div>
        <div v-if="profile.public_address" class="flex items-center gap-2 text-sm">
          <span class="text-gray-400">📍</span>
          <span class="text-gray-700">{{ profile.public_address }}</span>
        </div>
        <div v-if="profile.allow_direct_messages !== false && !isSelf" class="pt-2">
            <button class="w-full py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-100 transition flex items-center justify-center gap-2">
              Mensagem Direta
            </button>
        </div>
      </div>

      <!-- Announcements grid -->
      <div v-if="announcements.length" class="grid grid-cols-2 gap-3">
        <RouterLink
          v-for="ann in announcements"
          :key="ann.id"
          :to="`/${condominiumSlug}/announcements/${ann.id}`"
          class="block"
        >
          <div class="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition">
            <div class="aspect-square bg-gray-100">
              <img
                v-if="ann.images?.[0]"
                :src="ann.images[0].url + '?width=200&quality=70'"
                class="w-full h-full object-cover"
                :alt="ann.title"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-3xl">📦</div>
            </div>
            <div class="p-2">
              <p class="text-xs font-medium text-gray-900 truncate">{{ ann.title }}</p>
              <p class="text-xs text-gray-500">{{ ann.price != null ? formatCurrency(ann.price) : 'Gratuito' }}</p>
            </div>
          </div>
        </RouterLink>
      </div>

      <div v-else class="text-center py-10">
        <p class="text-gray-500 text-sm">Nenhum anúncio publicado.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useCondominiumStore } from '@/stores/condominium'
import { useAuthStore } from '@/stores/auth'
import { useFollows } from '@/composables/useFollows'
import { formatCurrency } from '@/utils/formatters'
import type { Profile, Announcement } from '@/types/app.types'

const route = useRoute()
const condominiumStore = useCondominiumStore()
const authStore = useAuthStore()
const { loadFollowingIds, toggleFollow, getFollowersCount, isFollowing, loading: followLoading } = useFollows()

const profile = ref<Profile | null>(null)
const announcements = ref<Announcement[]>([])
const loading = ref(true)
const followersCount = ref(0)

const condominiumSlug = computed(() => condominiumStore.current?.slug ?? '')
const userId = computed(() => route.params.userId as string)
const isSelf = computed(() => authStore.user?.id === userId.value)
const following = computed(() => isFollowing(userId.value))

async function handleToggleFollow() {
  await toggleFollow(userId.value)
  // Atualiza contagem de seguidores
  followersCount.value = await getFollowersCount(userId.value)
}

onMounted(async () => {
  const [profileResult, annResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId.value).single(),
    supabase.from('announcements')
      .select('*, images:announcement_images(*)')
      .eq('author_id', userId.value)
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false }),
    loadFollowingIds(),
  ])

  if (profileResult.data) profile.value = profileResult.data as Profile
  if (annResult.data) announcements.value = annResult.data as Announcement[]

  followersCount.value = await getFollowersCount(userId.value)
  loading.value = false
})
</script>
