<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  productName: string;
  stockMinimum: number;
}>()

const emit = defineEmits<{
    close: []
    save: [newStockMinimum: number]
}>()

const newStockMinimum = ref<number>(props.stockMinimum);
const canSave = ref<boolean>(true);

const saveUpdate = () => {
    if (String(newStockMinimum.value) === '') {
        console.log('Valor inválido para stock mínimo:', newStockMinimum.value)
        canSave.value = false
        return
    }

    canSave.value = true
    emit('save', newStockMinimum.value)
}

</script>

<template>
  <div
  class="fixed inset-0 z-50 flex items-center justify-center p-4"
  style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
  @click.self="emit('close')"
  >
      <div 
      class="flex flex-col rounded-2xl shadow-2xl w-full max-w-100 bg-neutral-50 overflow-hidden" style="max-height: 92vh;">

        <!-- Encabezado del modal -->
        <div class="border-b border-neutral-200 p-4 text-center">
          <h1 class="text-secondary-800 text-2xl font-bold">{{ 'Actualizar Stock Minimo' }}</h1>
          <p class="text-neutral-700">{{ 'Ingrese el nuevo stock mínimo para el producto' }}</p>
        </div>

        <!-- Contenido del modal -->
         <div class="flex flex-col gap-4 p-6">
            <h2 class="font-semibold">Nuevo stock mínimo</h2>
            <input
              type="number"
              v-model.number="newStockMinimum"
              min="0"
              step="10"
              class="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-body text-secondary-800 placeholder:text-neutral-400 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />

            <p v-if="!canSave" class="text-red-500 text-sm mt-2">Por favor, ingrese un valor válido para el stock mínimo.</p>

            <div class="flex justify-between">
              <button
                type="button"
                class="rounded-lg bg-neutral-50 px-4 py-2 text-secondary-800 border border-neutral-300 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:ring-offset-2"
                @click="emit('close')"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="ml-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                @click="saveUpdate"
              >
                Guardar
              </button>
            </div>
         </div>
      </div>
  </div>
</template>