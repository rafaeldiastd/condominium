<template>
  <AppChatListener />
  <AppToast />
  <RouterView />
  <!-- Diálogo de confirmação global (provider do useConfirm) -->
  <AppConfirmDialog
    v-if="confirmState.resolve"
    :visible="confirmState.visible"
    :title="confirmState.title"
    :description="confirmState.description"
    :confirm-label="confirmState.confirmLabel"
    :cancel-label="confirmState.cancelLabel"
    :variant="confirmState.variant"
    :loading="confirmState.loading"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
</template>

<script setup lang="ts">
import AppChatListener from '@/components/app/AppChatListener.vue'
import AppToast from '@/components/common/AppToast.vue'
import { AppConfirmDialog } from '@/components/ui'
import { provideConfirm } from '@/composables/useConfirm'

const { state: confirmState } = provideConfirm()

function onConfirm() {
  confirmState.value.resolve?.(true)
  confirmState.value.visible = false
  confirmState.value.resolve = null
}

function onCancel() {
  confirmState.value.resolve?.(false)
  confirmState.value.visible = false
  confirmState.value.resolve = null
}
</script>
