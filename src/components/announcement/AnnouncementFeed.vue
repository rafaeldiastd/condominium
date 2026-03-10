<template>
  <div class="grid grid-cols-2 gap-3 p-3">
    <AnnouncementCard
      v-for="item in announcements"
      :key="item.id"
      :announcement="item"
      @click="$emit('select', item)"
    />
    <EmptyState v-if="!announcements.length" title="Nenhum anúncio encontrado" class="col-span-2" />
  </div>
</template>

<script setup lang="ts">
import type { Announcement } from '@/types/app.types'
import AnnouncementCard from './AnnouncementCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'

defineProps<{ announcements: Announcement[] }>()
defineEmits<{ select: [announcement: Announcement] }>()
</script>
