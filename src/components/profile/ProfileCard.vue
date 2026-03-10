<template>
  <div class="bg-white rounded-xl p-4 flex items-center gap-4">
    <div class="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
      <img v-if="profile.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" :alt="profile.full_name" />
      <div v-else class="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
        {{ profile.full_name[0]?.toUpperCase() }}
      </div>
    </div>
    <div>
      <p class="font-semibold text-gray-900">{{ profile.full_name }}</p>
      <p v-if="profile.unit" class="text-sm text-gray-500">Unidade {{ profile.unit }}</p>
      <span class="inline-flex mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
        {{ roleLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Profile } from '@/types/app.types'
import { ROLE_LABELS } from '@/utils/constants'

const props = defineProps<{ profile: Profile }>()
const roleLabel = computed(() => ROLE_LABELS[props.profile.role])
</script>
