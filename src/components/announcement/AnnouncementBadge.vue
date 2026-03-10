<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
    :class="colorClass"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ANNOUNCEMENT_TYPE_LABELS, ANNOUNCEMENT_TYPE_COLORS } from '@/utils/constants'
import type { AnnouncementType } from '@/types/app.types'

const props = defineProps<{ type: AnnouncementType }>()

const label = computed(() => ANNOUNCEMENT_TYPE_LABELS[props.type] ?? props.type)
const colorClass = computed(() => ANNOUNCEMENT_TYPE_COLORS[props.type] ?? 'bg-gray-100 text-gray-800')
</script>
