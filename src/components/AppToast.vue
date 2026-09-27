<script setup lang="ts">
defineProps<{
  visible: boolean
  mensaje: string
}>()

defineEmits<{
  (e: 'cerrar'): void
}>()
</script>

<template>
  <div
    v-if="visible"
    class="fixed right-6 top-6 z-100 flex items-center gap-3 rounded-lg bg-green-300 px-5 py-3 text-white shadow-lg"
  >
    <span class="font-medium">
      {{ mensaje }}
    </span>

    <button
      type="button"
      class="text-lg font-bold"
      @click="$emit('cerrar')"
    >
      ×
    </button>
  </div>
</template>