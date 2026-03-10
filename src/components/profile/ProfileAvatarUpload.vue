<template>
  <div class="flex flex-col items-center gap-3">
    <div class="relative">
      <div class="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
        <img v-if="previewUrl || currentUrl" :src="previewUrl ?? currentUrl" class="w-full h-full object-cover" alt="Avatar" />
        <div v-else class="w-full h-full flex items-center justify-center text-3xl text-gray-400">
          👤
        </div>
      </div>
      <button
        type="button"
        class="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700"
        @click="inputRef?.click()"
      >
        <CameraIcon class="w-4 h-4" />
      </button>
    </div>
    <input ref="inputRef" type="file" accept="image/*" class="hidden" @change="onFileChange" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Camera as CameraIcon } from 'lucide-vue-next'

defineProps<{ currentUrl?: string }>()
const emit = defineEmits<{ change: [file: File] }>()

const inputRef = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  previewUrl.value = URL.createObjectURL(file)
  emit('change', file)
}
</script>
