<script setup lang="ts">
const emit = defineEmits<{
  notificaciones: []
  perfil: []
}>()
</script>

<template>
  <header
    class="flex items-center justify-between px-6 py-4 text-neutral-50"
    style="background: linear-gradient(90deg, var(--color-primary-700), var(--color-primary-600))"
  >
    <div class="flex items-center gap-3">
      <h1 class="text-title text-neutral-50">Mandy's</h1>
    </div>

    <div class="flex items-center gap-5">
      <!-- Profile and notifications moved to sidebar -->
    </div>
  </header>
</template>
