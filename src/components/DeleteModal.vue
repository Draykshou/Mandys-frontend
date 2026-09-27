<script setup lang="ts">
import { ref, computed } from 'vue'
import type {CatalogRow} from '@/types/CatalogColumns/catalog'

const props = defineProps<{
    visible: boolean
    row: CatalogRow | null
}>()

const emit = defineEmits<{
    (e: 'cancelar'): void
    (e: 'confirmar', payload: {
        row: CatalogRow
        motivo: string
    }): void
}>()

const motivo = ref('')

const puedeConfirmar = computed(() => {
    return motivo.value.trim().length > 0
})

function cancelar(){
    motivo.value = ''
    emit('cancelar')
}

function confirmar() {
  if (!props.row || !puedeConfirmar.value) {
    return
  }

  emit('confirmar', {
    row: props.row,
    motivo: motivo.value.trim(),
  })

  motivo.value = ''
}
</script>

<template>
    <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  >
    <div class="w-full max-w-md rounded-lg bg-neutral-100 p-6 shadow-xl">

      <h2 class="text-xl font-semibold text-secondary-800">
        Eliminar registro
      </h2>

      <p class="mt-2 text-sm text-gray-600">
        ¿Está seguro de que desea eliminar este registro?
      </p>

      <div v-if="row" class="mt-4 rounded-md bg-white p-3">
        <p class="text-sm text-gray-500">
          Registro seleccionado
        </p>

        <p class="font-medium text-secondary-800">
          {{ row.name }}
        </p>
      </div>

      <div class="mt-4">
        <label
          for="motivo"
          class="block text-sm font-medium text-secondary-800"
        >
          Motivo de eliminación
        </label>

        <textarea
          id="motivo"
          v-model="motivo"
          rows="4"
          placeholder="Ingrese el motivo de la eliminación..."
          class="bg-white mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          @click="cancelar"
        >
          Cancelar
        </button>

        <button
          type="button"
          :disabled="!puedeConfirmar"
          class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          @click="confirmar"
        >
          Confirmar eliminación
        </button>
      </div>

    </div>
  </div>
</template>