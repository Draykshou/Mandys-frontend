<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

defineProps<{
  titulo: string
  subtitulo: string
  textoBoton: string
}>()

const emit = defineEmits<{
  agregar: []
}>()
</script>

<template>
  <div class="mb-6 flex items-start justify-between">
    <div>
      <h2 class="text-title text-secondary-900">{{ titulo }}</h2>
      <p class="mt-1 text-body text-neutral-600">{{ subtitulo }}</p>
    </div>

    <button type="button" class="flex flex-row gap-2 items-center rounded-xl p-2 
                                btn btn-primary bg-(--primary) text-neutral-100 text-xl text-bold shadow-sm
                                hover:bg-primary-700 hover:shadow-md transition-all duration-300
                                active:bg-primary-800 active:shadow-sm" 
                                @click="emit('agregar')">
      <Plus :size="20" class="text-(--neutral)"/>
      {{ textoBoton }}
    </button>
  </div>
</template>
