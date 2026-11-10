<script setup lang="ts">
import { computed } from 'vue'
import type { Storage } from '@/types/Storage'
import { Sheet, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Pencil } from 'lucide-vue-next'
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
    onComplete: done,
  })
}

const props = defineProps<{
  rows: Storage[]
  totalRegistros: number
  pagina: number
  totalPaginas: number
}>()

const emit = defineEmits<{
  entrada: [row: Storage]
  salida: [row: Storage]
  editar: [row: Storage]
  'cambiar-pagina': [pagina: number]
  exportar: []
}>()

// Regla de alerta: stock igual o menor al umbral.
// Está aislada aquí para cambiarla en un solo lugar si hace falta.
function enAlerta(row: Storage) {
  return row.currentStock <= row.minimumStock
}

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatFecha(valor: string | null) {
  if (!valor) return '—'
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? '—' : formatoFecha.format(fecha)
}

type Unidad = Storage['product']['measureUnit']

const CONVERSIONES: Record<Unidad, { etiqueta: string; factor: number }> = {
  Unidades: { etiqueta: 'u', factor: 1 },
  Gramos: { etiqueta: 'kg', factor: 1000 },
  Mililitros: { etiqueta: 'l', factor: 1000 },
}
const convertirCostoVista = (costo: number, unidad: Unidad): string => {
  return '$ ' + String(costo * CONVERSIONES[unidad].factor) + ' ' + CONVERSIONES[unidad].etiqueta
}

const convertirStockVista = (stock: number, unidad: Unidad): string => {
  return String(stock / CONVERSIONES[unidad].factor) + ' ' + CONVERSIONES[unidad].etiqueta
}

const rangoMostrado = computed(() => {
  if (props.rows.length === 0) return '0'
  const inicio = (props.pagina - 1) * props.rows.length + 1
  const fin = inicio + props.rows.length - 1
  return `${inicio}–${fin}`
})
</script>

<template>
  <section class="overflow-hidden rounded-(--radius-card) border border-neutral-200 bg-neutral-50 shadow-sm">
    <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
      <div class="flex items-center gap-2">
        <h2 class="text-title text-secondary-900" style="font-size: 1.125rem">Inventario</h2>
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
            <th class="px-6 py-3 text-left">Nombre</th>
            <th class="px-6 py-3 text-center">Stock</th>
            <th class="px-6 py-3 text-center">Costo</th>
            <th class="px-6 py-3 text-center">Stock Minimo</th>
            <th class="px-6 py-3 text-center">Ultima Actualización</th>
            <th class="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>

        <TransitionGroup tag="tbody" @before-enter="onBeforeEnter" @enter="onEnter">
          <tr
            v-for="(row, index) in rows"
            :key="row.id"
            :data-index="index"
            class="border-b last:border-0"
            :class="
              enAlerta(row)
                ? 'border-red-100 bg-red-50 hover:bg-red-100'
                : 'border-neutral-50 hover:bg-neutral-100/60'
            "
          >
            <td class="px-6 py-4 text-left text-primary-800">{{ row.product.description }}</td>

            <td
              class="px-6 py-4 text-center"
              :class="enAlerta(row) ? 'text-red-700' : 'text-secondary-800'"
            >
              {{ convertirStockVista(row.currentStock, row.product.measureUnit) }}
            </td>

            <td class="px-6 py-4 text-center text-secondary-800">{{ convertirCostoVista(row.product.costPrice, row.product.measureUnit) }}</td>

            <td class="px-6 py-4 text-center text-secondary-800">
                <div class="flex items-center justify-center gap-4">
                    {{ convertirStockVista(row.minimumStock, row.product.measureUnit) }}
                    <button
                    type="button"
                    class="action-button hover:bg-blue-100 hover:text-blue-700 active:bg-blue-200"
                    title="Editar"
                    aria-label="Editar"
                    @click="emit('editar', row)"
                    >
                    <Pencil :size="16" />
                    </button>
                </div>
            </td>

            <td class="px-6 py-4 text-center text-secondary-800">
                <div class="flex items-center justify-center gap-4">
                    {{ row.lastUpdated ? formatFecha(row.lastUpdated) : '—' }}
                </div>
            </td>

            <td class="px-6 py-4">
              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="action-button hover:bg-green-100 hover:text-green-700 active:bg-green-200"
                  title="Entrada"
                  aria-label="Registrar entrada"
                  @click="emit('entrada', row)"
                >
                  <ArrowUp :size="18" />
                </button>
                <button
                  type="button"
                  class="action-button hover:bg-red-100 hover:text-red-600 active:bg-red-200"
                  title="Salida"
                  aria-label="Registrar salida"
                  @click="emit('salida', row)"
                >
                  <ArrowDown :size="18" />
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="rows.length === 0">
            <td colspan="5" class="px-6 py-10 text-center text-neutral-500">
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

      <button
        type="button"
        class="btn btn-inverted flex items-center gap-1 bg-green-700 hover:bg-green-800 active:bg-green-900 text-neutral-100 p-2 rounded-xl"
        @click="emit('exportar')"
      >
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