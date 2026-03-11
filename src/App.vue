<template>
  <AppChatListener />
  <AppToast />
  <RouterView />
</template>

<script setup lang="ts">
import AppChatListener from '@/components/app/AppChatListener.vue'
import AppToast from '@/components/common/AppToast.vue'
</script>
