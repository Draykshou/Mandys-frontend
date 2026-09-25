<script setup lang="ts">
import { Search, ChevronDown, Funnel } from 'lucide-vue-next'
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
    <div class="flex items-center gap-2 text-label text-secondary-600 p-4">
      <Funnel :size="20" class="text-primary-500" />
      Búsqueda y filtros
    </div>

    <div class="flex items-center justify-between  pb-4 px-4">
      <div class="flex flex-wrap justify-between gap-3">
        <div class="relative">
          <Search :size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input :value="busqueda" type="text" class="input-search pl-10 bg-neutral-100 rounded-xl py-2 w-100" :placeholder="placeholder"
            @input="emit('update:busqueda', ($event.target as HTMLInputElement).value)" @keyup.enter="emit('buscar')" />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative">
          <select :value="categoria"
            class="appearance-none rounded-[var(--radius-control)] border border-neutral-200 bg-neutral-50 py-2.5 pl-4 pr-10 text-body text-secondary-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            @change="emit('update:categoria', ($event.target as HTMLSelectElement).value)">
            <option v-for="opcion in categorias" :key="opcion" :value="opcion">{{ opcion }}</option>
          </select>
          <ChevronDown :size="20" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        </div>

        <button type="button" class="border border-neutral-200 rounded-xl hover:bg-neutral-200 active:bg-neutral-300 px-4 py-2.5"
          @click="emit('limpiar')">Limpiar</button>

        <button type="button"
          class="flex items-center gap-2 border border-neutral-200 rounded-xl bg-secondary-900 text-secondary-100 hover:bg-secondary-800 active:bg-secondary-900 px-4 py-2.5"
          @click="emit('buscar')">
          <Search :size="20" />
          Buscar
        </button>
      </div>
    </div>
  </section>
</template>
