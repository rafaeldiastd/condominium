<template>
  <div class="flex items-center gap-1 flex-wrap">
    <button
      v-if="announcement.status !== 'hidden' && announcement.status !== 'deleted'"
      class="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
      @click="$emit('hide', announcement)"
    >
      Ocultar
    </button>
    <button
      v-if="announcement.status === 'hidden'"
      class="text-xs px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
      @click="$emit('activate', announcement)"
    >
      Reativar
    </button>
    <button
      v-if="announcement.status !== 'deleted'"
      class="text-xs px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
      @click="$emit('delete', announcement)"
    >
      Excluir
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Announcement } from '@/types/app.types'

defineProps<{ announcement: Announcement }>()

defineEmits<{
  hide: [announcement: Announcement]
  activate: [announcement: Announcement]
  delete: [announcement: Announcement]
}>()
</script>
