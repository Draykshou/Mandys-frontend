<script setup lang="ts"> 
import AppHeader from '@/components/AppHeader.vue'
import appSidebar from '@/components/AppSidebar.vue'
</script>

<template>
  <AppHeader/>
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <appSidebar/>
  </div>
</template>
