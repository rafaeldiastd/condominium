<template>
  <div class="space-y-3">
    <label class="block text-sm font-medium text-gray-700">
      Fotos <span class="text-gray-400 font-normal">(máx. {{ maxImages }})</span>
    </label>

    <!-- Images preview list -->
    <div v-if="previewImages.length" class="grid grid-cols-3 gap-2">
      <div
        v-for="(img, i) in previewImages"
        :key="i"
        class="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
      >
        <img :src="img.previewUrl" class="w-full h-full object-cover" alt="" />

        <!-- Cover badge -->
        <div
          class="absolute bottom-0 left-0 right-0 text-center"
          :class="i === coverIndex ? 'bg-blue-600/80 text-white text-[10px] py-0.5' : ''"
        >
          <span v-if="i === coverIndex" class="text-[10px] font-medium">Capa</span>
        </div>

        <!-- Actions overlay -->
        <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
          <button
            type="button"
            @click="setCover(i)"
            class="w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs"
            title="Definir como capa"
          >&#11088;</button>
          <button
            type="button"
            @click="removeImage(i)"
            class="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white text-xs"
            title="Remover"
          >&#10005;</button>
        </div>

        <!-- Upload progress -->
        <div v-if="uploadProgressMap[i] !== undefined && uploadProgressMap[i] < 100" class="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span class="text-white text-xs font-bold">{{ uploadProgressMap[i] }}%</span>
        </div>
      </div>

      <!-- Add more button -->
      <label
        v-if="previewImages.length < maxImages"
        class="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
      >
        <span class="text-2xl text-gray-400">+</span>
        <span class="text-xs text-gray-400">Adicionar</span>
        <input type="file" accept="image/*" multiple class="hidden" @change="handleFileInput" />
      </label>
    </div>

    <!-- Drop zone (when empty) -->
    <label
      v-else
      class="block border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <span class="text-4xl block mb-2">&#128247;</span>
      <p class="text-sm font-medium text-gray-700">Arraste fotos aqui</p>
      <p class="text-xs text-gray-400 mt-1">ou toque para selecionar</p>
      <p class="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP &middot; máx. 5MB cada</p>
      <input type="file" accept="image/*" multiple class="hidden" @change="handleFileInput" />
    </label>

    <p v-if="errorMessage" class="text-xs text-red-600">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface PreviewImage {
  file: File
  previewUrl: string
}

const props = withDefaults(defineProps<{
  maxImages?: number
  existingImages?: { id: string; url: string; is_cover?: boolean }[]
}>(), {
  maxImages: 5,
  existingImages: () => [],
})

const emit = defineEmits<{
  'update:files': [files: File[]]
  'delete-existing': [id: string]
  'set-cover': [index: number]
}>()

const previewImages = ref<PreviewImage[]>([])
const coverIndex = ref(0)
const errorMessage = ref('')
const uploadProgressMap = ref<Record<number, number>>({})

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
  input.value = ''
}

function handleDrop(event: DragEvent) {
  const files = Array.from(event.dataTransfer?.files ?? [])
  addFiles(files)
}

function addFiles(files: File[]) {
  errorMessage.value = ''

  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  const oversized = imageFiles.filter(f => f.size > 5 * 1024 * 1024)

  if (oversized.length) {
    errorMessage.value = `${oversized.length} arquivo(s) excedem 5MB e foram ignorados.`
  }

  const validFiles = imageFiles
    .filter(f => f.size <= 5 * 1024 * 1024)
    .slice(0, props.maxImages - previewImages.value.length)

  validFiles.forEach(file => {
    const previewUrl = URL.createObjectURL(file)
    previewImages.value.push({ file, previewUrl })
  })

  emitFiles()
}

function removeImage(index: number) {
  URL.revokeObjectURL(previewImages.value[index]!.previewUrl)
  previewImages.value.splice(index, 1)
  if (coverIndex.value >= previewImages.value.length) {
    coverIndex.value = Math.max(0, previewImages.value.length - 1)
  }
  emitFiles()
}

function setCover(index: number) {
  coverIndex.value = index
  emit('set-cover', index)
}

function emitFiles() {
  emit('update:files', previewImages.value.map(img => img.file))
}

function setProgress(index: number, percent: number) {
  uploadProgressMap.value[index] = percent
}

defineExpose({ setProgress })
</script>
