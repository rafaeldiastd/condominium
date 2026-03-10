<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <AppTopBar :show-syndic-badge="true" />
    <main class="flex-1 pb-16">
      <RouterView />
    </main>
    <SyndicBottomNav />
  </div>
</template>

<script setup lang="ts">
import AppTopBar from '@/components/app/AppTopBar.vue'
import SyndicBottomNav from '@/components/app/SyndicBottomNav.vue'
</script>
