<script setup lang="ts">
import { computed } from 'vue'
import { Sheet, Pencil, Trash, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { animate } from 'animejs'
import { formatCurrency } from '@/utils/format'
import type { Product } from '@/types/catalogs/ProductsDtos'

// ---------------------------------------------------------------------------
// Props y eventos
// ---------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    productos: Product[]
    totalRegistros: number
    pagina: number
    totalPaginas: number
    tamanoPagina?: number
    exportando?: boolean
    mostrarAcciones?: boolean
  }>(),
  { tamanoPagina: 20, exportando: false, mostrarAcciones: true },
)

const emit = defineEmits<{
  editar: [producto: Product]
  eliminar: [producto: Product]
  verImagen: [string | null]
  exportar: []
  cambiarPagina: [pagina: number]
}>()

// ---------------------------------------------------------------------------
// Texto de las celdas
// ---------------------------------------------------------------------------
const SUFIJO_UNIDAD: Record<Product['measureUnit'], string> = {
  Kilogramos: '/ KG',
  Litros: '/ L',
  Unidades: '/ U',
}

const textoPrecioCompra = (producto: Product) =>
  `${formatCurrency(producto.costPrice)} ${SUFIJO_UNIDAD[producto.measureUnit] ?? ''}`

const textoPrecioVenta = (producto: Product) =>
  producto.isSupply ? 'Sin precio' : formatCurrency(producto.salePrice)

// ---------------------------------------------------------------------------
// Paginación
// ---------------------------------------------------------------------------
const cantidadColumnas = computed(() => 5 + (props.mostrarAcciones ? 1 : 0))

const rangoMostrado = computed(() => {
  if (props.productos.length === 0) return '0'
  const inicio = (props.pagina - 1) * props.tamanoPagina + 1
  const fin = inicio + props.productos.length - 1
  return `${inicio}–${fin}`
})

// ---------------------------------------------------------------------------
// Animación de entrada de las filas
// ---------------------------------------------------------------------------
const alAntesDeEntrar = (el: Element) => {
  const elemento = el as HTMLElement
  elemento.style.opacity = '0'
  elemento.style.transform = 'translateY(20px)'
}

const alEntrar = (el: Element, hecho: () => void) => {
  const elemento = el as HTMLElement
  const indice = Number(elemento.dataset.index) || 0

  animate(el, {
    opacity: 1,
    y: 0,
    delay: indice * 50,
    duration: 600,
    ease: 'outElastic',
    onComplete: hecho,
  })
}
</script>

<template>
  <section class="overflow-hidden rounded-(--radius-card) border border-neutral-200 bg-neutral-50 shadow-sm">
    <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
      <div class="flex items-center gap-2">
        <h3 class="text-title text-secondary-900" style="font-size: 1.125rem">Productos</h3>
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
            <th class="px-6 py-3 text-left">Descripción</th>
            <th class="px-6 py-3 text-left">Insumo</th>
            <th class="px-6 py-3 text-left">Precio de compra</th>
            <th class="px-6 py-3 text-left">Precio de venta</th>
            <th class="px-6 py-3 text-left">Unidad de medida</th>
            <th class="px-6 py-3 text-left">Imagen</th>
            <th v-if="mostrarAcciones" class="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>

        <TransitionGroup tag="tbody" @before-enter="alAntesDeEntrar" @enter="alEntrar">
          <tr
            v-for="(producto, indice) in productos"
            :key="producto.id"
            :data-index="indice"
            class="border-b border-neutral-50 last:border-0 hover:bg-neutral-100/60"
          >
            <td class="px-6 py-4 text-left">
              <span class="text-primary-800">{{ producto.description || '—' }}</span>
            </td>
            <td class="px-6 py-4 text-left">
              <span
                class="chip inline-flex w-12 items-center justify-center rounded-xl"
                :class="producto.isSupply ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                style="padding: 0.25rem 0.625rem"
              >
                {{ producto.isSupply ? 'Sí' : 'No' }}
              </span>
            </td>
            <td class="px-6 py-4 text-left">
              <span class="text-secondary-800">{{ textoPrecioCompra(producto) }}</span>
            </td>
            <td class="px-6 py-4 text-left">
              <span class="text-secondary-800">{{ textoPrecioVenta(producto) }}</span>
            </td>
            <td class="px-6 py-4 text-left">
              <span class="text-secondary-800">{{ producto.measureUnit || '—' }}</span>
            </td>

            <td class="px-6 py-4 text-left">
              <button 
                class="border border-neutral-200 rounded-xl text-caption px-3 py-1.5 font-semibold
                hover:border-primary-600 hover:text-primary-600
                active:border-primary-700 active:text-primary-700 active:bg-neutral-200"
                 
                @click="emit('verImagen', producto.imageUrl)">
                Ver imagen
              </button>
            </td>

            <td v-if="mostrarAcciones" class="px-6 py-4">
              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="action-button hover:bg-blue-100 hover:text-blue-700 active:bg-blue-200"
                  title="Editar"
                  aria-label="Editar"
                  @click="emit('editar', producto)"
                >
                  <Pencil class="size-[1.125rem]" />
                </button>
                <button
                  type="button"
                  class="action-button hover:bg-red-100 hover:text-red-600 active:bg-red-200"
                  title="Eliminar"
                  aria-label="Eliminar"
                  @click="emit('eliminar', producto)"
                >
                  <Trash class="size-[1.125rem]" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="productos.length === 0">
            <td :colspan="cantidadColumnas" class="px-6 py-10 text-center text-neutral-500">
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
        class="btn btn-inverted flex items-center gap-1 rounded-xl bg-green-700 p-2 text-neutral-100 hover:bg-green-800 active:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="exportando"
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
            @click="emit('cambiarPagina', pagina - 1)"
          >
            <ChevronLeft class="size-5" />
          </button>

          <button
            v-for="numeroPagina in totalPaginas"
            :key="numeroPagina"
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-control text-label"
            :class="numeroPagina === pagina ? 'bg-primary-600 text-neutral-50' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100'"
            @click="emit('cambiarPagina', numeroPagina)"
          >
            {{ numeroPagina }}
          </button>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-control border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
            :disabled="pagina === totalPaginas"
            aria-label="Página siguiente"
            @click="emit('cambiarPagina', pagina + 1)"
          >
            <ChevronRight class="size-5" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
