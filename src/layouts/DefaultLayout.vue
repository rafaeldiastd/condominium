<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <AppTopBar />
    <main class="flex-1 pb-16">
      <RouterView />
    </main>
    <AppBottomNav />
  </div>
</template>

<script setup lang="ts">
import AppTopBar from '@/components/app/AppTopBar.vue'
import AppBottomNav from '@/components/app/AppBottomNav.vue'
</script>
