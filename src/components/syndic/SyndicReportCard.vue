<template>
  <RouterLink
    :to="`/${slug}/sindico/reports/${report.id}`"
    class="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
  >
    <div class="flex items-start gap-3">
      <!-- Thumbnail -->
      <div class="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
        <img
          v-if="coverImage"
          :src="coverImage"
          class="w-full h-full object-cover"
          alt=""
        />
        <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-xl">
          📋
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">
              {{ REPORT_REASON_LABELS[report.reason] }}
            </p>
            <p v-if="report.announcement" class="text-xs text-gray-500 truncate mt-0.5">
              {{ report.announcement.title }}
            </p>
          </div>
          <span
            class="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
            :class="statusClass"
          >
            {{ statusLabel }}
          </span>
        </div>

        <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <span v-if="report.reporter">
            Por {{ report.reporter.full_name }}
          </span>
          <span>·</span>
          <span>{{ formatTimeAgo(report.created_at) }}</span>
        </div>

        <p v-if="report.description" class="mt-1 text-xs text-gray-500 line-clamp-2">
          {{ report.description }}
        </p>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useCondominiumStore } from '@/stores/condominium'
import type { Report } from '@/types/app.types'
import { REPORT_REASON_LABELS } from '@/utils/constants'
import { formatTimeAgo } from '@/utils/formatters'

const props = defineProps<{ report: Report }>()

const condominiumStore = useCondominiumStore()
const slug = computed(() => condominiumStore.current?.slug ?? '')

const coverImage = computed(() => {
  const images = props.report.announcement?.images
  if (!images || images.length === 0) return null
  return images.find((img) => img.is_cover)?.url ?? images[0]?.url ?? null
})

const statusClass = computed(
  () =>
    ({
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-600',
    })[props.report.status],
)

const statusLabel = computed(
  () =>
    ({
      pending: 'Pendente',
      reviewed: 'Revisado',
      dismissed: 'Ignorado',
    })[props.report.status],
)
</script>
