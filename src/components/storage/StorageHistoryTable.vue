<script setup lang="ts">
import { computed } from 'vue'
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
                                : ' hover:border-red-600 hover:text-red-600 active:border-red-700 active:text-red-700 active:bg-neutral-100'
                                ">
                                Ver productos
                            </button>
                        </td>

                        <td class="px-6 py-4 text-center text-secondary-800">
                            <button class="p-2 rounded-3xl text-sm bg-neutral-50 border border-neutral-200 text-secondary-800"
                                :class="paintRow(row)
                                ? ' hover:border-green-600 hover:text-green-600 active:border-green-700 active:text-green-700 active:bg-neutral-100'
                                : ' hover:border-red-600 hover:text-red-600 active:border-red-700 active:text-red-700 active:bg-neutral-100'
                                ">
                                Ver Detalles
                            </button>
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