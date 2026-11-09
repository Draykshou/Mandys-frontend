<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  productName: string;
  stockMinimum: number;
  measureUnit: string;
}>()

const emit = defineEmits<{
    close: []
    save: [newStockMinimum: number]
}>()


type Unidad = string

const CONVERSIONES: Record<Unidad, { etiqueta: string; factor: number }> = {
  Unidades: { etiqueta: 'u', factor: 1 },
  Gramos: { etiqueta: 'kg', factor: 1000 },
  Mililitros: { etiqueta: 'l', factor: 1000 },
}

const increaseUnit = (stock: number, unidad: Unidad): number => {
  return stock / CONVERSIONES[unidad].factor
}

const decreaseUnit = (stock: number, unidad: Unidad): number => {
  return stock * CONVERSIONES[unidad].factor
}

const newStockMinimum = ref<number>(increaseUnit(props.stockMinimum, props.measureUnit));
const canSave = ref<boolean>(true);


const saveUpdate = () => {
    if (String(newStockMinimum.value) === '') {
        console.log('Valor inválido para stock mínimo:', newStockMinimum.value)
        canSave.value = false
        return
    }
    else if(newStockMinimum.value <= 0){
      console.log('Valor inválido para stock mínimo:', newStockMinimum.value)
      canSave.value = false
      return
    }

    canSave.value = true
    emit('save', decreaseUnit(newStockMinimum.value, props.measureUnit))
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
            <div class="flex items-center">
              <input
                type="number"
                v-model.number="newStockMinimum"
                min="0"
                step="10"
                class="w-full rounded-l-lg border border-neutral-300 bg-neutral-50 px-4 py-2"
              />
              <p class="rounded-r-lg border border-l-0 border-neutral-300 bg-neutral-100 px-3 py-2 text-secondary-700">
                {{ CONVERSIONES[props.measureUnit].etiqueta}}
              </p>
            </div>

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