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
  <div class="w-full max-w-120 flex flex-col rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden m-8">
    <div class="bg-red-500 text-neutral-50 text-2xl text-center font-bold p-3">
        MOTIVO DE ELIMINACIÓN
    </div>

    <div class="bg-neutral-50 flex flex-col items-center text-center px-8 pt-4">
        <p class="text-red-500 font-bold">POR FAVOR, INGRESE EL MOTIVO DE LA ELIMINACIÓN</p>
        <p class="text-secondary-700 text-sm mt-2">El motivo debe tener al menos 25 caracteres.</p>
        <textarea 
        id="motivo" 
        v-model="motivo" 
        rows="4" 
        placeholder="Ingrese el motivo de la eliminación..." 
        class="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
      
      <div class="mt-1 flex justify-between text-sm">
        <span :class="puedeConfirmar ? 'text-green-600' : 'text-gray-500'">Mínimo 25 caracteres:</span>
        <span :class="puedeConfirmar ? 'text-green-600' : 'text-gray-500'">{{ caracteres }}/25</span>
      </div>
    </div>

    <div class="bg-neutral-50 flex justify-between px-8 pt-4 pb-4">
      <button 
        class="bg-neutral-50 hover:bg-neutral-200 border hover:border-primary-600 active:bg-neutral-300 border-neutral-200 text-primary-600 py-3 px-7 rounded-xl shadow-xl"
        @click="cancelar"
      >
        Cancelar
      </button>
      <button
        :disabled="!puedeConfirmar"  
        class="bg-red-500 hover:bg-red-600 border hover:border-secondary-600 active:bg-red-700 hover border-neutral-200 text-neutral-50 py-3 px-7 rounded-xl shadow-xl"
        @click="confirmar"
      >
        Confirmar
      </button>
    </div>
  </div>
</template>