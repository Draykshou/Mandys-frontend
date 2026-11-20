<script setup lang="ts">
import { Plus, Clock, Warehouse } from 'lucide-vue-next'
import type { Branch } from '@/types/BranchesDtos'

const props = withDefaults(
  defineProps<{
    rolUsuario: string
    branches: Branch[]
    selectedBranchId: number | undefined
    selectedBranchName?: string
    inHistoryTable: boolean
  }>(),
  {
    rolUsuario: '',
    selectedBranchId: undefined,
    selectedBranchName: ''
  },
)

const branchWrite = (): string => {
  if(props.selectedBranchName != ''){
    return ': ' + String(props.selectedBranchName)
  }
  else{
    return ''
  }
}


const emit = defineEmits<{
  storageIn: []
  storageOut: []
  storageHistory: []
  'update:selectedBranchId': [value: number]
}>()
</script>

<template>
  <div class="mb-6 flex items-start justify-between">
    <div class="flex gap-8">
      <div>
        <h2 v-if="rolUsuario === 'Encargado de Almacen' || rolUsuario === 'Encargado de Almacen Central'" class="text-title text-secondary-900">Gestion de almacen{{ branchWrite() }}</h2>
        <h2 v-else class="text-title text-secondary-900">Gestión de almacén</h2>
        <p class="mt-1 text-body text-neutral-600">Gestiona las entradas y salidas del almacen</p>
      </div>
      <div 
          v-if="rolUsuario === 'Gerente de Operaciones' || rolUsuario === 'Administrador'"
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
        v-if="!inHistoryTable"
        type="button"
        class="group flex flex-row w-36 gap-2 items-center justify-center rounded-xl p-2
        bg-neutral-50 text-secondary-900 border border-neutral-300 text-xl text-bold shadow-sm
        hover:border-primary-600 hover:text-primary-600 hover:shadow-md transition-all duration-300
        active:bg-primary-100 active:border-primary-700 active:text-primary-700 active:shadow-sm"
        @click="emit('storageHistory')"
      >
        <Clock
          :size="20"
          class="text-secondary-900 group-hover:text-primary-600 group-active:text-primary-700 transition-colors duration-300"
        />
        historial
      </button>

      <button
        v-else
        type="button"
        class="group flex flex-row w-36 gap-2 items-center justify-center rounded-xl p-2
        bg-neutral-50 text-secondary-900 border border-neutral-300 text-xl text-bold shadow-sm
        hover:border-primary-600 hover:text-primary-600 hover:shadow-md transition-all duration-300
        active:bg-primary-100 active:border-primary-700 active:text-primary-700 active:shadow-sm"
        @click="emit('storageHistory')"
      >
        <Warehouse
          :size="20"
          class="text-secondary-900 group-hover:text-primary-600 group-active:text-primary-700 transition-colors duration-300"
        />
        Almacen
      </button>

      <button
        v-if="rolUsuario !== 'Gerente de Operaciones'"
        type="button"
        class="group flex flex-row w-36 gap-2 items-center justify-center rounded-xl p-2
        bg-primary-600 text-neutral-50 text-xl text-bold shadow-sm
        hover:bg-neutral-50 hover:border hover:border-primary-600 hover:text-primary-600 hover:shadow-md transition-all duration-300
        active:bg-primary-200 active:border-primary-700 active:text-primary-700 active:shadow-md"
        @click="emit('storageIn')"
      >
        <Plus
          :size="20"
          class="text-neutral-50 group-hover:text-primary-600 group-active:text-primary-700 transition-colors duration-300"
        />
        Entrada
      </button>

      <button
        v-if="rolUsuario !== 'Gerente de Operaciones'"
        type="button"
        class="group flex flex-row w-36 gap-2 items-center justify-center rounded-xl p-2
        bg-secondary-900 text-neutral-50 text-xl text-bold shadow-sm
        hover:bg-neutral-50 hover:border hover:border-secondary-900 hover:text-secondary-900 hover:shadow-md transition-all duration-300
        active:bg-secondary-200 active:border-secondary-700 active:text-secondary-700 active:shadow-md"
        @click="emit('storageOut')"
      >
        <Plus
          :size="20"
          class="text-neutral-50 group-hover:text-secondary-900 group-active:text-secondary-700 transition-colors duration-300"
        />
        Salida
      </button>
    </div>
  </div>
</template>