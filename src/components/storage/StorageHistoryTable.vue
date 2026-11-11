<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StorageHistory } from '@/types/Storage'
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
    rows: StorageHistory[]
    totalRegistros: number
    pagina: number
    totalPaginas: number
}>()

const emit = defineEmits<{
    'cambiar-pagina': [pagina: number]
    exportar: []
}>()

// Converir valores de entrada a sus valores de vista
// Para el color de la fila
const paintRow = (row: StorageHistory) => {
    if (row.type === 'in')
        return true
    else
        return false
}

// Para el tipo de movimiento
const typeToView = (type: string): string => {
    if (type === 'in')
        return "Entrada"
    else
        return "Salida"
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

// MODALES DE LOS BOTONES DE ACCION

const selectedRow = ref<StorageHistory>()
const modalProductos = ref(false)
const modalDetalles = ref(false)

const esVenta = computed(() =>
  selectedRow.value?.type === 'out' &&
  selectedRow.value?.reason?.trim().toUpperCase() === 'VENTA'
)

const productosModal = computed(() => selectedRow.value?.products ?? [])

const totalCosto = computed(() =>
  productosModal.value.reduce((acc, p) => acc + p.quantity * p.costPrice, 0)
)
const totalVenta = computed(() =>
  productosModal.value.reduce((acc, p) => acc + p.quantity * p.product.salePrice, 0)
)
const totalMovimiento = computed(() => totalVenta.value - totalCosto.value)

const formatoMoneda = (n: number) => {
    if(n === null){
        return 0
    }
    else{
        return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
    }
}


const verProductos = (row: StorageHistory) => {
    selectedRow.value = row
    modalProductos.value = true
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
    <div
    v-if="modalProductos"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
    >
        <div 
        class="flex flex-col rounded-2xl shadow-2xl w-full max-w-180 bg-neutral-50 overflow-hidden" style="max-height: 92vh;">

            <!-- Encabezado del modal -->
            <div class="border-b border-neutral-200 p-4 text-center">
            <h1 class="text-secondary-800 text-2xl font-bold">Lista de productos del movimiento</h1>
            <p class="text-neutral-700">Ve un resumen de los productos y precios</p>
            </div>

            <!-- Contenido del modal -->
            <div class="flex flex-col gap-4 p-6 overflow-y-auto min-h-0">
                <div class="overflow-x-auto rounded-xl border border-neutral-200">
                    <table class="w-full text-sm">
                    <thead class="bg-neutral-100 text-neutral-700">
                        <tr>
                        <th class="px-3 py-2 text-left">Nombre</th>
                        <th class="px-3 py-2 text-right">Cantidad</th>
                        <th class="px-3 py-2 text-right">Costo</th>
                        <th class="px-3 py-2 text-right">Subtotal costo</th>
                        <template v-if="esVenta">
                            <th class="px-3 py-2 text-right">Precio de venta</th>
                            <th class="px-3 py-2 text-right">Subtotal venta</th>
                        </template>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                        v-for="row in productosModal"
                        :key="row.product.id"
                        class="border-t border-neutral-200"
                        >
                        <td class="px-3 py-2">{{ row.product.description }}</td>
                        <td class="px-3 py-2 text-right">{{ row.quantity }}</td>
                        <td class="px-3 py-2 text-right">{{ formatoMoneda(row.costPrice) }}</td>
                        <td class="px-3 py-2 text-right">{{ formatoMoneda(row.quantity * row.costPrice) }}</td>
                        <template v-if="esVenta">
                            <td class="px-3 py-2 text-right">{{ formatoMoneda(row.product.salePrice) }}</td>
                            <td class="px-3 py-2 text-right">{{ formatoMoneda(row.quantity * row.product.salePrice) }}</td>
                        </template>
                        </tr>
                    </tbody>
                    </table>
                </div>

                <!-- Totales -->
                <div class="flex flex-col gap-1 items-end text-neutral-800">
                    <p>
                    <span class="font-semibold">{{ esVenta ? 'Total costo:' : 'Costo total de la entrada:' }}</span>
                    {{ formatoMoneda(totalCosto) }}
                    </p>
                    <template v-if="esVenta">
                    <p><span class="font-semibold">Total venta:</span> {{ formatoMoneda(totalVenta) }}</p>
                    <p
                        class="text-lg font-bold"
                        :class="totalMovimiento >= 0 ? 'text-green-600' : 'text-red-600'"
                    >
                        Total del movimiento: {{ formatoMoneda(totalMovimiento) }}
                    </p>
                    </template>
                </div>
            </div>

            <div class="flex justify-center border-t border-neutral-200 p-4">
                <button class="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-neutral-50 py-3 px-7 rounded-xl shadow-xl"
                        @click="modalProductos = false">
                    Cerrar
                </button>
            </div>
        </div>
    </div>

    <div
    v-if="modalDetalles"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
    >
        <div 
        class="flex flex-col rounded-2xl shadow-2xl w-full max-w-150 bg-neutral-50 overflow-hidden" style="max-height: 92vh;">

            <!-- Encabezado del modal -->
            <div class="border-b border-neutral-200 p-4 text-center">
                <h1 class="text-secondary-800 text-2xl font-bold">Detalles del movimiento</h1>
                <p class="text-neutral-700">Vea los detalles de las entradas y salidas</p>
            </div>

            <!-- Contenido del modal -->
            <div class="flex flex-col gap-4 p-6 overflow-y-auto min-h-0">
                
            </div>

            <div class="flex justify-center border-t border-neutral-200 p-4">
                <button class="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-neutral-50 py-3 px-7 rounded-xl shadow-xl"
                        @click="modalDetalles = false">
                    Cerrar
                </button>
            </div>
        </div>
    </div>
    <section class="overflow-hidden rounded-(--radius-card) border border-neutral-200 bg-neutral-50 shadow-sm">
        <div class="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
            <div class="flex items-center gap-2">
                <h2 class="text-title text-secondary-900" style="font-size: 1.125rem">Movimientos</h2>
                <span class="chip bg-neutral-100 text-secondary-600 rounded-xl" style="padding: 0.125rem 0.625rem">
                </span>
            </div>
            <span class="text-caption">Página {{ pagina }} de {{ totalPaginas }}</span>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left text-body">
                <thead>
                    <tr
                        class="border-b border-neutral-100 bg-neutral-100/60 text-caption uppercase tracking-wide text-neutral-500">
                        <th class="px-6 py-3 text-left">Tipo de movimiento</th>
                        <th class="px-6 py-3 text-center">Productos</th>
                        <th class="px-6 py-3 text-center">Detalles</th>
                        <th class="px-6 py-3 text-center">Fecha</th>
                    </tr>
                </thead>

                <TransitionGroup tag="tbody" @before-enter="onBeforeEnter" @enter="onEnter">
                    <tr v-for="(row, index) in rows" :key="row.id" :data-index="index" class="border-b last:border-0"
                        :class="paintRow(row)
                                ? 'border-green-100 bg-green-50 hover:bg-green-100'
                                : 'border-red-100 bg-red-50 hover:bg-red-100'
                            ">
                        <td class="px-6 py-4 text-left font-semibold" :class="paintRow(row) ? 'text-green-700' : 'text-red-700'">{{ typeToView(row.type) }}</td>

                        <td class="px-6 py-4 text-center text-secondary-800">
                            <button class="p-2 rounded-3xl text-sm bg-neutral-50 border border-neutral-200 text-secondary-800"
                                :class="paintRow(row)
                                ? ' hover:border-green-600 hover:text-green-600 active:border-green-700 active:text-green-700 active:bg-neutral-100'
                                : ' hover:border-red-600 hover:text-red-600 active:border-red-700 active:text-red-700 active:bg-neutral-100'"
                                @click="verProductos(row)">
                                Ver productos
                            </button>
                        </td>

                        <td class="px-6 py-4 text-center text-secondary-800">
                            <div v-if="row.type === 'in'" class="flex flex-col items-center gap-1">
                                <span class="font-medium">{{ row.supplierName }}</span>
                                <span class="text-xs text-neutral-500">{{ row.folio }}</span>
                            </div>

                            <span v-else>
                                {{ row.reason }}
                            </span>
                            </td>

                        <td class="px-6 py-4 text-center text-secondary-800">
                            <div class="flex items-center justify-center gap-4">
                                {{ formatFecha(row.date) }}
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

            <button type="button"
                class="btn btn-inverted flex items-center gap-1 bg-green-700 hover:bg-green-800 active:bg-green-900 text-neutral-100 p-2 rounded-xl"
                @click="emit('exportar')">
                <Sheet class="h-4 w-4" />
                Exportar Excel
            </button>

            <div class="flex items-center gap-3">
                <div class="flex items-center gap-1">
                    <button type="button"
                        class="flex h-8 w-8 items-center justify-center rounded-control border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
                        :disabled="pagina === 1" aria-label="Página anterior"
                        @click="emit('cambiar-pagina', pagina - 1)">
                        <ChevronLeft :size="20" />
                    </button>

                    <button v-for="p in totalPaginas" :key="p" type="button"
                        class="flex h-8 w-8 items-center justify-center rounded-control text-label"
                        :class="p === pagina ? 'bg-primary-600 text-neutral-50' : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100'"
                        @click="emit('cambiar-pagina', p)">
                        {{ p }}
                    </button>

                    <button type="button"
                        class="flex h-8 w-8 items-center justify-center rounded-control border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
                        :disabled="pagina === totalPaginas" aria-label="Página siguiente"
                        @click="emit('cambiar-pagina', pagina + 1)">
                        <ChevronRight :size="20" />
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>