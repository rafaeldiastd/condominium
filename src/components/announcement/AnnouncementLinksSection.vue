<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">Links externos</label>
      <button
        type="button"
        @click="addLink"
        class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        <PhPlus class="w-4 h-4" /> Adicionar link
      </button>
    </div>

    <div v-if="links.length === 0" class="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
      Nenhum link adicionado.
    </div>

    <div
      v-for="(link, index) in links"
      :key="link._key"
      class="flex gap-2 items-start border border-gray-200 rounded-xl p-3 bg-gray-50 relative"
    >
      <PhLink class="w-4 h-4 text-gray-400 mt-2.5 flex-shrink-0" />
      <div class="flex-1 space-y-2">
        <input
          v-model="link.url"
          type="url"
          placeholder="https://..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          v-model="link.title"
          type="text"
          placeholder="Título ou descrição (opcional)"
          maxlength="80"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="button"
        @click="removeLink(index)"
        class="text-gray-400 hover:text-red-500 transition mt-2"
        title="Remover link"
      >
        <PhX class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhPlus, PhX, PhLink } from '@phosphor-icons/vue'

export interface LinkFormData {
  _key: string
  url: string
  title?: string
  existingId?: string
}

const props = withDefaults(defineProps<{
  initialLinks?: Omit<LinkFormData, '_key'>[]
}>(), {
  initialLinks: () => [],
})

const emit = defineEmits<{
  'update:links': [links: LinkFormData[]]
}>()

const links = ref<LinkFormData[]>(
  props.initialLinks.map((l, i) => ({ ...l, _key: `link_${i}_${Date.now()}` }))
)

function addLink() {
  links.value.push({ _key: `link_${Date.now()}`, url: '', title: '' })
  emitUpdate()
}

function removeLink(index: number) {
  links.value.splice(index, 1)
  emitUpdate()
}

function emitUpdate() {
  emit('update:links', [...links.value])
}

watch(links, emitUpdate, { deep: true })
</script>
