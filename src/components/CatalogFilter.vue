<script setup lang="ts">
import { Search } from 'lucide-vue-next'
withDefaults(
  defineProps<{
    busqueda: string
    categoria: string
    categorias?: string[]
    placeholder?: string
  }>(),
  {
    categorias: () => ['Todas las categorías'],
    placeholder: 'Buscar por nombre o ID...',
  },
)

const emit = defineEmits<{
  'update:busqueda': [valor: string]
  'update:categoria': [valor: string]
  buscar: []
  limpiar: []
}>()
</script>

<template>
  <section class="card mb-6 border border-neutral-200 bg-neutral-50 shadow-sm rounded-(--radius-card)">
    <div class="mb-4 flex items-center gap-2 text-label text-secondary-600 p-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24"
        stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
      </svg>
      Búsqueda y filtros
    </div>

    <div class="flex items-center justify-between">
      <div class="flex flex-wrap justify-between gap-3 p-2">
        <div class="relative">
          <Search :size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input :value="busqueda" type="text" class="input-search pl-10 bg-neutral-100 p-2 rounded-xl" :placeholder="placeholder"
            @input="emit('update:busqueda', ($event.target as HTMLInputElement).value)" @keyup.enter="emit('buscar')" />
        </div>
      </div>

      <div class="flex items-center gap-3 p-4 ">
        <div class="relative">
          <select :value="categoria"
            class="appearance-none rounded-[var(--radius-control)] border border-neutral-200 bg-neutral-50 py-2.5 pl-4 pr-10 text-body text-secondary-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            @change="emit('update:categoria', ($event.target as HTMLSelectElement).value)">
            <option v-for="opcion in categorias" :key="opcion" :value="opcion">{{ opcion }}</option>
          </select>
          <svg xmlns="http://www.w3.org/2000/svg"
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" fill="none"
            viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>

        <button type="button" class="border border-neutral-200 rounded-xl hover:bg-neutral-200 px-4 py-2.5"
          @click="emit('limpiar')">Limpiar</button>

        <button type="button"
          class="flex items-center gap-2 border border-neutral-200 rounded-xl bg-secondary-900 text-secondary-100 hover:bg-secondary-800 px-4 py-2.5"
          @click="emit('buscar')">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Buscar
        </button>
      </div>
    </div>
  </section>
</template>
