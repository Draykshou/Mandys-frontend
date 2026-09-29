<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  cancelar: []
  confirmar: [motivo: string]
}>()

const motivo = ref('')
const puedeConfirmar = computed(() => motivo.value.trim().length >= 25)
const caracteres = computed(() => motivo.value.trim().length)

function cancelar() {
  motivo.value = ''
  emit('cancelar')
}

function confirmar() {
  if (!puedeConfirmar.value) return
  emit('confirmar', motivo.value.trim())
  motivo.value = ''
}

</script>

<template>
  <div class="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
    <div class="w-full max-w-md rounded-lg bg-neutral-100 p-6 shadow-xl">
      <h2 class="text-xl font-semibold text-secondary-800">Motivo de eliminación</h2>
      <p class="mt-2 text-sm text-gray-600">Ingrese el motivo por el cual desea eliminar este registro.</p>
      <div class="mt-4">
        <label for="motivo" class="block text-sm font-medium text-secondary-800">Motivo de eliminación</label>
        <textarea 
          id="motivo" 
          v-model="motivo" 
          rows="4" 
          placeholder="Ingrese el motivo de la eliminación..." 
          class="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        <div class="mt-1 flex justify-between text-xs">
          <span :class="puedeConfirmar ? 'text-green-600' : 'text-gray-500'">Mínimo 25 caracteres</span>
          <span :class="puedeConfirmar ? 'text-green-600' : 'text-gray-500'">{{ caracteres }}/25</span>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button 
          type="button" 
          class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100" 
          @click="cancelar">
          Cancelar
        </button>
        <button 
          type="button" 
          :disabled="!puedeConfirmar" 
          class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50" 
          @click="confirmar">
          Confirmar eliminación
        </button>
      </div>
    </div>
  </div>
</template>