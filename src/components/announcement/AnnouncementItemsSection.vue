<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">Itens / Catálogo</label>
      <button
        type="button"
        @click="addItem"
        class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        <PhPlus class="w-4 h-4" /> Adicionar item
      </button>
    </div>

    <div v-if="items.length === 0" class="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
      Nenhum item adicionado. Clique em "+ Adicionar item".
    </div>

    <div
      v-for="(item, index) in items"
      :key="item._key"
      class="border border-gray-200 rounded-xl p-3 space-y-3 relative bg-gray-50"
    >
      <!-- Remove button -->
      <button
        type="button"
        @click="removeItem(index)"
        class="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"
        title="Remover item"
      >
        <PhX class="w-4 h-4" />
      </button>

      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item {{ index + 1 }}</p>

      <!-- Name -->
      <div>
        <label class="block text-xs text-gray-600 mb-1">Nome do item *</label>
        <input
          v-model="item.name"
          type="text"
          placeholder="Ex: Bolo de chocolate"
          maxlength="100"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Price (optional, shown based on prop) -->
      <div v-if="showPrice">
        <label class="block text-xs text-gray-600 mb-1">Valor (opcional)</label>
        <div class="relative">
          <span class="absolute left-3 top-2.5 text-gray-400 text-xs">R$</span>
          <input
            v-model.number="item.price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-xs text-gray-600 mb-1">Descrição curta</label>
        <input
          v-model="item.description"
          type="text"
          placeholder="Descreva brevemente..."
          maxlength="200"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Single image upload -->
      <div>
        <label class="block text-xs text-gray-600 mb-1">Foto do item</label>
        <div class="flex items-center gap-3">
          <!-- Preview -->
          <div v-if="item.previewUrl || item.image_url" class="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
            <img :src="item.previewUrl || item.image_url" alt="Preview" class="w-full h-full object-cover" />
          </div>
          <label class="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition">
            <PhCamera class="w-4 h-4" />
            {{ item.previewUrl || item.image_url ? 'Trocar foto' : 'Escolher foto' }}
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleImageChange($event, index)"
            />
          </label>
          <button
            v-if="item.previewUrl || item.image_url"
            type="button"
            @click="removeItemImage(index)"
            class="text-xs text-red-500 hover:text-red-600"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhPlus, PhX, PhCamera } from '@phosphor-icons/vue'

export interface ItemFormData {
  _key: string
  name: string
  price?: number | null
  description?: string
  image_url?: string      // existing URL (edit mode)
  imageFile?: File        // new file to upload
  previewUrl?: string     // local preview URL
  // For tracking existing items in edit mode
  existingId?: string
  deleteImage?: boolean
}

const props = withDefaults(defineProps<{
  showPrice?: boolean
  initialItems?: Omit<ItemFormData, '_key'>[]
}>(), {
  showPrice: true,
  initialItems: () => [],
})

const emit = defineEmits<{
  'update:items': [items: ItemFormData[]]
}>()

const items = ref<ItemFormData[]>(
  props.initialItems.map((item, i) => ({ ...item, _key: `item_${i}_${Date.now()}` }))
)

function addItem() {
  items.value.push({
    _key: `item_${Date.now()}`,
    name: '',
    price: null,
    description: '',
  })
  emitUpdate()
}

function removeItem(index: number) {
  items.value.splice(index, 1)
  emitUpdate()
}

function handleImageChange(event: Event, index: number) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const item = items.value[index]
  if (!item) return
  item.imageFile = file
  item.previewUrl = URL.createObjectURL(file)
  item.deleteImage = false
  emitUpdate()
}

function removeItemImage(index: number) {
  const item = items.value[index]
  if (!item) return
  item.imageFile = undefined
  if (item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl)
    item.previewUrl = undefined
  }
  item.image_url = undefined
  item.deleteImage = true
  emitUpdate()
}

function emitUpdate() {
  emit('update:items', [...items.value])
}

watch(items, emitUpdate, { deep: true })
</script>
