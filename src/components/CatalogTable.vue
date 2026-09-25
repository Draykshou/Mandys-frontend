<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogColumn, CatalogRow } from '@/catalog'

const props = withDefaults(
  defineProps<{
    titulo: string
    columns: CatalogColumn[]
    rows: CatalogRow[]
    totalRegistros: number
    pagina: number
    totalPaginas: number
  }>(),
  {
    totalPaginas: 1,
  },
)

const emit = defineEmits<{
  editar: [row: CatalogRow]
  eliminar: [row: CatalogRow]
  accion: [payload: { columnKey: string; row: CatalogRow }]
  'cambiar-pagina': [pagina: number]
  exportar: []
}>()

const alineacion: Record<NonNullable<CatalogColumn['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

function claseAlineacion(col: CatalogColumn) {
  return alineacion[col.align ?? 'left']
}

function valorCelda(row: CatalogRow, col: CatalogColumn) {
  const valor = row[col.key]
  if (valor === null || valor === undefined || valor === '') {
    return col.emptyLabel ?? '—'
  }
  return String(valor)
}

const rangoMostrado = computed(() => {
  if (props.rows.length === 0) return '0'
  const inicio = (props.pagina - 1) * props.rows.length + 1
  const fin = inicio + props.rows.length - 1
  return `${inicio}–${fin}`
})

const variantesBoton: Record<NonNullable<CatalogColumn['buttonVariant']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outlined: 'btn-outlined',
}
</script>

<template>
  <section class="overflow-hidden rounded-(--radius-card) border border-neutral-200 bg-neutral-50 shadow-sm">
    <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
      <div class="flex items-center gap-2">
        <h3 class="text-title text-secondary-900" style="font-size: 1.125rem">{{ titulo }}</h3>
        <span class="chip bg-neutral-100 text-secondary-600" style="padding: 0.125rem 0.625rem">
          {{ totalRegistros }} registros
        </span>
      </div>
      <span class="text-caption">Página {{ pagina }} de {{ totalPaginas }}</span>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-body">
        <thead>
          <tr class="border-b border-neutral-100 bg-neutral-100/60 text-caption uppercase tracking-wide text-neutral-500">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-6 py-3"
              :class="claseAlineacion(col)"
            >
              {{ col.label }}
            </th>
            <th class="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-b border-neutral-50 last:border-0 hover:bg-neutral-100/60"
          >
            <td v-for="col in columns" :key="col.key" class="px-6 py-4" :class="claseAlineacion(col)">
              <!-- Booleano -->
              <span
                v-if="col.type === 'boolean'"
                class="chip"
                :class="row[col.key] ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'"
                style="padding: 0.25rem 0.625rem"
              >
                {{ row[col.key] ? (col.trueLabel ?? 'Sí') : (col.falseLabel ?? 'No') }}
              </span>

              <!-- Botón de acción propio de la columna -->
              <button
                v-else-if="col.type === 'button'"
                type="button"
                class="btn"
                :class="variantesBoton[col.buttonVariant ?? 'outlined']"
                style="padding: 0.375rem 0.875rem; font-size: 0.8125rem"
                @click="emit('accion', { columnKey: col.key, row })"
              >
                {{ col.buttonLabel ?? 'Ver' }}
              </button>

              <!-- Texto plano (default) -->
              <span v-else class="text-secondary-800">{{ valorCelda(row, col) }}</span>
            </td>

            <td class="px-6 py-4">
              <div class="flex items-center justify-end gap-3 text-neutral-500">
                <button class="hover:text-primary-600" aria-label="Editar" @click="emit('editar', row)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                </button>
                <button class="hover:text-primary-700" aria-label="Eliminar" @click="emit('eliminar', row)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="rows.length === 0">
            <td :colspan="columns.length + 1" class="px-6 py-10 text-center text-neutral-500">
              No hay registros para mostrar.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
      <p class="text-body text-neutral-600">
        Mostrando <span class="font-semibold text-secondary-700">{{ rangoMostrado }}</span> de
        <span class="font-semibold text-secondary-700">{{ totalRegistros }}</span> registros
      </p>

      <div class="flex items-center gap-3">
        <button type="button" class="btn btn-inverted" @click="emit('exportar')">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          Exportar Excel
        </button>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
            :disabled="pagina === 1"
            aria-label="Página anterior"
            @click="emit('cambiar-pagina', pagina - 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            v-for="p in totalPaginas"
            :key="p"
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-label"
            :class="p === pagina ? 'bg-primary-600 text-neutral-50' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100'"
            @click="emit('cambiar-pagina', p)"
          >
            {{ p }}
          </button>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
            :disabled="pagina === totalPaginas"
            aria-label="Página siguiente"
            @click="emit('cambiar-pagina', pagina + 1)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
