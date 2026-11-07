<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { Branch } from '@/types/BranchesDtos'

const props = withDefaults(
  defineProps<{
    rolUsuario: string
    branches: Branch[]
    selectedBranchId: number | undefined
  }>(),
  {
    rolUsuario: '',
    selectedBranchId: undefined,
  },
)

const emit = defineEmits<{
  storageIn: []
  storageOut: []
  'update:selectedBranchId': [value: number]
}>()
</script>

<template>
  <div class="mb-6 flex items-start justify-between">
    <div class="flex gap-8">
      <div>
        <h2 class="text-title text-secondary-900">{{ 'Gestion de almacen' }}</h2>
        <p class="mt-1 text-body text-neutral-600">{{ 'Gestiona las entradas y salidas del almacen' }}</p>
      </div>
      <div 
          v-if="rolUsuario === 'Encargado de Almacen Central' || rolUsuario === 'Administrador'"
          class="mb-4 bg-neutral-50 p-4 rounded-xl w-100"
      >
          <label class="font-bold" for="branch">Sucursal: </label>

          <select
            id="branch"
            :value="props.selectedBranchId"
            @change="emit('update:selectedBranchId', Number(($event.target as HTMLSelectElement).value))"
            class="bg-neutral-100 rounded-xl p-2"
          >
            <option
              v-for="branch in branches"
              :key="branch.id"
              :value="branch.id"
            >
              {{ branch.name }}
            </option>
          </select>
       </div>
    </div>

    <div class="flex gap-4">
      <button 
        type="button" 
        class="flex flex-row gap-1 items-center rounded-xl p-2 
        btn btn-primary bg-green-200 text-green-700 text-xl text-bold shadow-sm
        hover:bg-green-300 hover:shadow-md transition-all duration-300
        active:bg-green-400 active:shadow-sm" 
        @click="emit('storageIn')">
        <Plus :size="20" class="text-green-700"/>
        {{ 'Generar entrada' }}
        </button>
        <button 
        type="button" 
        class="flex flex-row gap-1 items-center rounded-xl p-2 
        btn btn-primary bg-red-200 text-red-700 text-xl text-bold shadow-sm
        hover:bg-red-300 hover:shadow-md transition-all duration-300
        active:bg-red-400 active:shadow-sm" 
        @click="emit('storageOut')">
        <Plus :size="20" class="text-red-700"/>
        {{ 'Generar Salida' }}
        </button>
    </div>
    
  </div>
</template>