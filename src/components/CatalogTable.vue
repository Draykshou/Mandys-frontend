<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogColumn, CatalogRow } from '@/types/CatalogColumns/catalog'
import { Sheet, Pencil, Trash, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { animate } from 'animejs'

const onBeforeEnter = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.opacity = '0'
  htmlEl.style.transform = 'translateY(20px)'
}

const onEnter = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement
  const index = Number(htmlEl.dataset.index) || 0
  
  animate(el, {
    opacity: 1,
    y: 0,
    delay: index * 50,
    duration: 600,
    ease: 'outElastic',
    onComplete: done
  })
}

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
        <span class="chip bg-neutral-100 text-secondary-600 rounded-xl" style="padding: 0.125rem 0.625rem">
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

        <TransitionGroup tag="tbody" @before-enter="onBeforeEnter" @enter="onEnter">
          <tr
            v-for="(row, index) in rows"
            :key="row.id"
            :data-index="index"
            class="border-b border-neutral-50 last:border-0 hover:bg-neutral-100/60" 
          >
            <td v-for="(col, index) in columns" :key="col.key" class="px-6 py-4" :class="claseAlineacion(col)">
              <span
                v-if="col.type === 'boolean'"
                class="chip inline-flex w-12 items-center justify-center rounded-xl"
                :class="row[col.key] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                style="padding: 0.25rem 0.625rem"
              >
                {{ row[col.key] ? (col.trueLabel ?? 'Sí') : (col.falseLabel ?? 'No') }}
              </span>
              <button
                v-else-if="col.type === 'button'"
                type="button"
                class="btn border rounded-xl border-neutral-200 hover:bg-primary-600 active:bg-primary-700 hover:text-neutral-100 "
                :class="variantesBoton[col.buttonVariant ?? 'outlined']"
                style="padding: 0.375rem 0.875rem; font-size: 0.8125rem"
                @click="emit('accion', { columnKey: col.key, row })"
              >
                {{ col.buttonLabel ?? 'Ver' }}
              </button>
              <span v-else :class="index === 0 ? 'text-primary-800' : 'text-secondary-800'">{{ valorCelda(row, col) }}</span>
            </td>

            <td class="px-6 py-4">
              <div class="flex items-center justify-end gap-3 text-neutral-500">
                <button class="hover:text-primary-600 active:text-primary-700" aria-label="Editar" @click="emit('editar', row)">
                  <Pencil :size="20" />
                </button>
                <button class="hover:text-primary-700 active:text-primary-800" aria-label="Eliminar" @click="emit('eliminar', row)">
                  <Trash :size="20" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td :colspan="columns.length + 1" class="px-6 py-10 text-center text-neutral-500">
              No hay registros para mostrar.
            </td>
          </tr>
        </TransitionGroup>
      </table>
    </div>

    <div class="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
      <p class="text-body text-neutral-600">
        Mostrando <span class="font-semibold text-secondary-700">{{ rangoMostrado }}</span> de
        <span class="font-semibold text-secondary-700">{{ totalRegistros }}</span> registros
      </p>

      <button type="button" class="btn btn-inverted flex items-center gap-1 bg-green-700 hover:bg-green-800 active:bg-green-900 text-neutral-100 p-2 rounded-xl" @click="emit('exportar')">
        <Sheet class="h-4 w-4" />
          Exportar Excel
        </button>

      
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-control border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
            :disabled="pagina === 1"
            aria-label="Página anterior"
            @click="emit('cambiar-pagina', pagina - 1)"
          >
            <ChevronLeft :size="20" />
          </button>

          <button
            v-for="p in totalPaginas"
            :key="p"
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-control text-label"
            :class="p === pagina ? 'bg-primary-600 text-neutral-50' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100'"
            @click="emit('cambiar-pagina', p)"
          >
            {{ p }}
          </button>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-control border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
            :disabled="pagina === totalPaginas"
            aria-label="Página siguiente"
            @click="emit('cambiar-pagina', pagina + 1)"
          >
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
