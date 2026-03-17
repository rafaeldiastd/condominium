<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="block text-sm font-medium text-gray-700">
        Fotos <span class="text-gray-400 font-normal">({{ totalCount }}/{{ maxImages }})</span>
      </label>
      <span v-if="totalCount >= maxImages" class="text-xs text-amber-600 font-medium">Limite atingido</span>
    </div>

    <!-- Unified grid: existing + new -->
    <div v-if="totalCount > 0" class="grid grid-cols-3 gap-2">
      <!-- Existing images (from DB) -->
      <div
        v-for="img in visibleExisting"
        :key="img.id"
        class="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
      >
        <img :src="img.url" class="w-full h-full object-cover" alt="" />

        <!-- Cover badge -->
        <div
          v-if="img.is_cover"
          class="absolute bottom-0 left-0 right-0 text-center bg-blue-600/80 text-white py-0.5"
        >
          <span class="text-[10px] font-medium">Capa</span>
        </div>

        <!-- Overlay actions -->
        <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
          <button
            type="button"
            @click="deleteExisting(img.id)"
            class="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white"
            title="Excluir"
          >&#10005;</button>
        </div>
      </div>

      <!-- New (local) images -->
      <div
        v-for="(img, i) in newImages"
        :key="img.previewUrl"
        class="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
      >
        <img :src="img.previewUrl" class="w-full h-full object-cover" alt="" />
        <span v-if="visibleExisting.length === 0 && i === 0" class="absolute bottom-0 left-0 right-0 text-center bg-blue-600/80 text-white py-0.5 text-[10px] font-medium">Capa</span>

        <!-- Overlay actions -->
        <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
          <button
            type="button"
            @click="removeNew(i)"
            class="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white"
            title="Remover"
          >&#10005;</button>
        </div>
      </div>

      <!-- Add more slot -->
      <label
        v-if="totalCount < maxImages"
        class="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
      >
        <span class="text-2xl text-gray-400">+</span>
        <span class="text-xs text-gray-400">Adicionar</span>
        <input type="file" accept="image/*" multiple class="hidden" @change="handleFileInput" />
      </label>
    </div>

    <!-- Empty state / drop zone -->
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
import { ref, computed } from 'vue'

interface ExistingImage {
  id: string
  url: string
  is_cover?: boolean
}

interface NewImage {
  file: File
  previewUrl: string
}

const props = withDefaults(defineProps<{
  maxImages?: number
  existingImages?: ExistingImage[]
}>(), {
  maxImages: 5,
  existingImages: () => [],
})

const emit = defineEmits<{
  'update:files': [files: File[]]
  'delete-existing': [id: string]
}>()

// ---- State ----
// Track which existing image IDs have been marked for deletion
const deletedIds = ref<Set<string>>(new Set())
// New locally-picked images
const newImages = ref<NewImage[]>([])
const errorMessage = ref('')

// ---- Computed ----
const visibleExisting = computed(() =>
  props.existingImages.filter(img => !deletedIds.value.has(img.id))
)

const totalCount = computed(() => visibleExisting.value.length + newImages.value.length)

// ---- Handlers ----
function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
  input.value = ''
}

function handleDrop(event: DragEvent) {
  addFiles(Array.from(event.dataTransfer?.files ?? []))
}

function addFiles(files: File[]) {
  errorMessage.value = ''

  const imageFiles = files.filter(f => f.type.startsWith('image/'))
  const oversized = imageFiles.filter(f => f.size > 5 * 1024 * 1024)
  if (oversized.length) {
    errorMessage.value = `${oversized.length} arquivo(s) excedem 5MB e foram ignorados.`
  }

  const available = props.maxImages - totalCount.value
  const valid = imageFiles
    .filter(f => f.size <= 5 * 1024 * 1024)
    .slice(0, available)

  for (const file of valid) {
    newImages.value.push({ file, previewUrl: URL.createObjectURL(file) })
  }

  emitFiles()
}

function removeNew(index: number) {
  const img = newImages.value[index]
  if (img) URL.revokeObjectURL(img.previewUrl)
  newImages.value.splice(index, 1)
  emitFiles()
}

function deleteExisting(id: string) {
  deletedIds.value = new Set([...deletedIds.value, id])
  emit('delete-existing', id)
}

function emitFiles() {
  emit('update:files', newImages.value.map(img => img.file))
}
</script>
