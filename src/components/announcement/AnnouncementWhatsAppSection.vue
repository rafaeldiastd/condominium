<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-gray-700">Contacts via WhatsApp</label>
      <button
        type="button"
        @click="addContact"
        class="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
      >
        <PhPlus class="w-4 h-4" /> Adicionar número
      </button>
    </div>

    <div v-if="contacts.length === 0" class="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
      Nenhum número adicionado.
    </div>

    <div
      v-for="(contact, index) in contacts"
      :key="contact._key"
      class="flex gap-2 items-start border border-gray-200 rounded-xl p-3 bg-gray-50 relative"
    >
      <PhWhatsappLogo class="w-4 h-4 text-green-500 mt-2.5 flex-shrink-0" />
      <div class="flex-1 space-y-2">
        <input
          v-model="contact.number"
          type="tel"
          placeholder="(11) 99999-9999"
          maxlength="20"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          v-model="contact.description"
          type="text"
          placeholder="Descrição (ex: Vendas, Suporte...)"
          maxlength="60"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <button
        type="button"
        @click="removeContact(index)"
        class="text-gray-400 hover:text-red-500 transition mt-2"
        title="Remover contato"
      >
        <PhX class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhPlus, PhX, PhWhatsappLogo } from '@phosphor-icons/vue'

export interface WhatsAppContactFormData {
  _key: string
  number: string
  description?: string
  existingId?: string
}

const props = withDefaults(defineProps<{
  initialContacts?: Omit<WhatsAppContactFormData, '_key'>[]
}>(), {
  initialContacts: () => [],
})

const emit = defineEmits<{
  'update:contacts': [contacts: WhatsAppContactFormData[]]
}>()

const contacts = ref<WhatsAppContactFormData[]>(
  props.initialContacts.map((c, i) => ({ ...c, _key: `wa_${i}_${Date.now()}` }))
)

function addContact() {
  contacts.value.push({ _key: `wa_${Date.now()}`, number: '', description: '' })
  emitUpdate()
}

function removeContact(index: number) {
  contacts.value.splice(index, 1)
  emitUpdate()
}

function emitUpdate() {
  emit('update:contacts', [...contacts.value])
}

watch(contacts, emitUpdate, { deep: true })
</script>
