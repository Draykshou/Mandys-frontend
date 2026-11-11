<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { X, Search, Trash2, Check } from 'lucide-vue-next'
import { getStorage, getOneStorage } from '@/service/StorageService'
import type { Storage, StorageIn, StorageOut } from '@/types/Storage'

const props = withDefaults(
  defineProps<{
    branchId: number
    /** 'entrada' (por defecto) o 'salida'. El resto del modal es igual. */
    modo?: 'entrada' | 'salida'
    /** Opcional: producto que ya aparece en la lista al abrir (atajo desde la tabla). */
    productoInicial?: Storage
    /** Opcional: deshabilita el botón de confirmar mientras el padre manda la petición. */
    enviando?: boolean
    isShortCut: boolean
    rolUsuario: string
  }>(),
  { modo: 'entrada' },
)

const emit = defineEmits<{
  close: []
  storageIn: [payload: StorageIn]
  storageOut: [payload: StorageOut]
}>()

/* ---------------------------------------------------------------------------
 * Textos y colores según el modo
 * ------------------------------------------------------------------------- */

const TEXTOS = {
  entrada: {
    titulo: 'Entrada de productos',
    subtitulo: 'Elige los productos que van a ingresar al almacén y captura cantidad y costo.',
    vacio: 'Elige un producto de la lista para agregarlo a la entrada.',
    quitar: 'Quitar de la entrada',
    hint: 'Completa folio, cantidad y costo.',
    confirmar: 'Confirmar entrada',
    confirmarTitulo: 'Confirmar entrada',
    accion: 'la entrada',
    destino: 'en el almacén',
    revisar: 'Revisa que las cantidades y los costos sean correctos.',
    boton: 'bg-green-700 hover:bg-green-800 active:bg-green-900',
  },
  salida: {
    titulo: 'Salida de productos',
    subtitulo: 'Elige los productos que van a salir del almacén y captura la cantidad.',
    vacio: 'Elige un producto de la lista para agregarlo a la salida.',
    quitar: 'Quitar de la salida',
    hint: 'Completa el folio y revisa las cantidades.',
    confirmar: 'Confirmar salida',
    confirmarTitulo: 'Confirmar salida',
    accion: 'la salida',
    destino: 'del almacén',
    revisar: 'Revisa que las cantidades sean correctas.',
    boton: 'bg-red-700 hover:bg-red-800 active:bg-red-900',
  },
} as const

const t = computed(() => TEXTOS[props.modo])
const esEntrada = computed(() => props.modo === 'entrada')

/* ---------------------------------------------------------------------------
 * Unidades
 * ------------------------------------------------------------------------- */

type Unidad = Storage['product']['measureUnit']

// Cómo se muestran stock y cantidad (siempre en la unidad base).
const abreviaturas: Record<Unidad, string> = {
  Unidades: 'u',
  Kilogramos: 'kg',
  Litros: 'l',
}

// Cómo se captura el COSTO.
// `factor` = cuántas unidades base (g, ml, u) trae la unidad en la que se captura.
// Hoy se captura por unidad base. Para pasar a kilo y litro, solo cambia a:
//   Gramos:     { etiqueta: 'kg', factor: 1000 },
//   Mililitros: { etiqueta: 'L',  factor: 1000 },
// El encabezado, los textos y el costPrice que se envía se ajustan solos.
const CONVERSIONES: Record<Unidad, { etiqueta: string; factor: number }> = {
  Unidades: { etiqueta: 'u', factor: 1 },
  Kilogramos: { etiqueta: 'kg', factor: 1 },
  Litros: { etiqueta: 'l', factor: 1 },
}

const convertirStockVista = (stock: number, unidad: Unidad): string => {
  return String(stock / CONVERSIONES[unidad].factor) + ' ' + CONVERSIONES[unidad].etiqueta
}

const encabezadoCosto = Object.values(CONVERSIONES)
  .map((c) => c.etiqueta)
  .join('/')

const formatCantidad = (cantidad: number, unidad: Unidad) =>
  `${cantidad} ${abreviaturas[unidad]}`

// Misma regla que storageTable: stock igual o menor al mínimo.
const enAlerta = (row: Storage) => row.currentStock <= row.minimumStock

/* ---------------------------------------------------------------------------
 * Lista izquierda: búsqueda + scroll infinito
 * ------------------------------------------------------------------------- */

const PAGE_SIZE = 30

const items = ref<Storage[]>([])
const page = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')

const busqueda = ref('') // lo que se escribe en la barra
const terminoAplicado = ref('') // lo que realmente se mandó a buscar

// Sirve para descartar respuestas viejas si el usuario busca otra cosa mientras carga.
let version = 0

const loadMore = async () => {
  if (loading.value || page.value >= totalPages.value) return

  const miVersion = version
  loading.value = true
  error.value = ''

  if (props.rolUsuario === 'Encargado de Almacen') {
    try {
      const res = await getOneStorage(
        page.value + 1,
        PAGE_SIZE,
        terminoAplicado.value,
        'description',
        null,
      )
      if (miVersion !== version) return
      items.value.push(...res.items)
      page.value = res.page
      totalPages.value = res.totalPages
    } catch (err) {
      if (miVersion !== version) return
      console.error('No se pudo cargar el inventario:', err)
      error.value = 'No se pudo cargar el inventario.'
    } finally {
      if (miVersion === version) loading.value = false
    }
  }
  else {
    try {
      const res = await getStorage(
        props.branchId,
        page.value + 1,
        PAGE_SIZE,
        terminoAplicado.value,
        'description',
        null,
      )
      if (miVersion !== version) return
      items.value.push(...res.items)
      page.value = res.page
      totalPages.value = res.totalPages
    } catch (err) {
      if (miVersion !== version) return
      console.error('No se pudo cargar el inventario:', err)
      error.value = 'No se pudo cargar el inventario.'
    } finally {
      if (miVersion === version) loading.value = false
    }
  }
}

const buscar = () => {
  version++
  terminoAplicado.value = busqueda.value.trim()
  items.value = []
  page.value = 0
  totalPages.value = 1
  loading.value = false
  error.value = ''
  loadMore()
}

const onScroll = (e: Event) => {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
    loadMore()
  }
}

/* ---------------------------------------------------------------------------
 * Lista derecha: productos de la entrada
 * ------------------------------------------------------------------------- */

interface FilaEntrada {
  storage: Storage
  // Se guardan como texto para poder escribir "2." sin que se rompa; se convierten al confirmar.
  cantidad: string
  costo: string
}

const seleccionados = ref<FilaEntrada[]>([])
const productoInicial = ref<Storage | null>(props.productoInicial ?? null)
const tablaRef = ref<HTMLElement | null>(null)

const idsAgregados = computed(
  () => new Set(seleccionados.value.map((f) => f.storage.product.id)),
)

const agregar = async (row: Storage) => {
  const productId = row.product.id
  if (idsAgregados.value.has(productId)) return

  seleccionados.value.push({ storage: row, cantidad: '', costo: '' })

  // Deja el cursor listo en la cantidad del producto recién agregado.
  await nextTick()
  tablaRef.value
    ?.querySelector<HTMLInputElement>(`[data-cantidad="${productId}"]`)
    ?.focus()
}

const quitar = (productId: number) => {
  seleccionados.value = seleccionados.value.filter((f) => f.storage.product.id !== productId)
}

// Deja solo dígitos y un punto decimal.
const limpiarNumero = (valor: string) => {
  const limpio = valor.replace(/[^0-9.]/g, '')
  const [entero, ...decimales] = limpio.split('.')
  return decimales.length ? `${entero}.${decimales.join('')}` : entero
}

const onNumero = (e: Event, fila: FilaEntrada, campo: 'cantidad' | 'costo') => {
  const el = e.target as HTMLInputElement
  const limpio = limpiarNumero(el.value)
  el.value = limpio // si no, el navegador conserva la letra tecleada
  fila[campo] = limpio
}

const folio = ref('')
const supplierName = ref('')
type StorageOutReason = 'TRASPASO' | 'MERMA'
const reason = ref<StorageOutReason>('TRASPASO')

// En salida no se puede sacar más de lo que hay en stock.
const excedeStock = (f: FilaEntrada) =>
  !esEntrada.value && Number(f.cantidad) > f.storage.currentStock

// Cantidad mayor a 0 y, según el modo: costo capturado (entrada) o dentro del stock (salida).
const filaValida = (f: FilaEntrada) => {
  if(props.rolUsuario === "Encargado de Almacen"){
    //console.log("Entro al if correcto")
    return Number(f.cantidad) > 0 && !excedeStock(f) && (!esEntrada.value || (String(f.storage.product.costPrice) !== '' && !Number.isNaN(f.storage.product.costPrice)))
  }
  else{
    //console.log("Entro al if malo")
    return Number(f.cantidad) > 0 && !excedeStock(f) && (!esEntrada.value || (f.costo !== '' && !Number.isNaN(Number(f.costo))))
  }
}

// Folio capturado + al menos un producto + todas las filas válidas.
const movimientoValido = computed(() => {
  if (esEntrada.value) {
    return (
      folio.value.trim() !== '' &&
      supplierName.value.trim() !== '' &&
      seleccionados.value.length > 0 &&
      seleccionados.value.every(filaValida)
    )
  }
  return (
    seleccionados.value.length > 0 &&
    seleccionados.value.every(filaValida)
  )
})

/* ---------------------------------------------------------------------------
 * Confirmación en dos pasos
 * ------------------------------------------------------------------------- */

const confirmando = ref(false)

const construirEntrada = (): StorageIn => ({
  folio: folio.value.trim(),
  supplierName: supplierName.value.trim(),
  products: seleccionados.value.map((f) => ({
    productId: f.storage.product.id,
    quantity: Number(f.cantidad) * CONVERSIONES[f.storage.product.measureUnit].factor,
    // El costo se captura en la unidad de CONVERSIONES; al back va siempre por unidad base.
    costPrice: (props.rolUsuario === "Encargado de Almacen" ? f.storage.product.costPrice : Number(f.costo)) / CONVERSIONES[f.storage.product.measureUnit].factor,
  })),
})

const construirSalida = (): StorageOut => ({
  reason: reason.value,
  products: seleccionados.value.map((f) => ({
    productId: f.storage.product.id,
    quantity: Number(f.cantidad) * CONVERSIONES[f.storage.product.measureUnit].factor,
  })),
})

const confirmar = () => {
  if (props.enviando) 
    return
  if (esEntrada.value){
    console.log(
      seleccionados.value.map((f) => ({
      costPrice: (props.rolUsuario === "Encargado de Almacen" ? f.storage.product.costPrice : Number(f.costo)) / CONVERSIONES[f.storage.product.measureUnit].factor,
    }))
    )
    emit('storageIn', construirEntrada())
  }
  else{
    emit('storageOut', construirSalida())
  } 
}

// Clic en el fondo: solo cierra si todavía no se capturó nada.
const cerrarPorFondo = () => {
  if (seleccionados.value.length === 0) emit('close')
}

const close = () => {
  console.log('Cerrando modal, limpiando seleccionados:', seleccionados.value)
  seleccionados.value = []
  console.log('Cerrando modal, limpiando seleccionados:', seleccionados.value)
  emit('close')
}

onMounted(() => {
  loadMore()
  // Atajo desde la tabla: el producto ya aparece en la lista, con el cursor en la cantidad.
  if (props.isShortCut) {
    agregar(productoInicial.value as Storage)
  }
  else {
    console.log('No hay producto inicial, limpiando seleccionados')
    seleccionados.value = []
  }
})
</script>

<template>
  <!-- Paso 1: captura (se oculta con v-show para no perder la lista al cancelar) -->
  <div v-show="!confirmando" class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);" @click.self="cerrarPorFondo">
    <div
      class="flex h-[88vh] max-h-[48rem] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-neutral-50 shadow-2xl">
      <!-- Encabezado -->
      <div class="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
        <div>
          <h3 class="text-3xl font-bold text-secondary-900">{{ t.titulo }}</h3>
          <p class="text-neutral-500">
            {{ t.subtitulo }}
          </p>
        </div>
        <button type="button" class="action-button" title="Cerrar" aria-label="Cerrar" @click="close">
          <X :size="18" />
        </button>
      </div>

      <div class="flex min-h-0 flex-1 flex-col gap-4 p-6 md:flex-row">
        <!-- Izquierda: búsqueda + lista -->
        <div class="flex min-h-0 flex-1 flex-col gap-3 md:w-2/5 md:flex-none">
          <form class="flex gap-2" @submit.prevent="buscar">
            <input v-model="busqueda" type="text" placeholder="Buscar producto" aria-label="Buscar producto"
              class="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-body focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600" />
            <button type="submit"
              class="flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200"
              title="Buscar" aria-label="Buscar">
              <Search :size="18" />
            </button>
          </form>

          <div class="min-h-0 flex-1 overflow-y-auto rounded-xl border border-neutral-200 bg-white" @scroll="onScroll">
            <button v-for="row in items" :key="row.id" type="button"
              class="block w-full border-t border-neutral-200 px-5 py-3 text-left transition-colors first:border-t-0 hover:bg-neutral-100 active:bg-neutral-200 disabled:cursor-default disabled:bg-neutral-100 disabled:opacity-60"
              :disabled="idsAgregados.has(row.product.id)" @click="agregar(row)">
              <div class="flex items-center justify-between gap-2 border-b border-neutral-300 pb-1">
                <p class="text-body text-primary-800">{{ row.product.description }}</p>
                <Check v-if="idsAgregados.has(row.product.id)" :size="16" class="shrink-0 text-green-700"
                  aria-label="Ya agregado" />
              </div>
              <p class="pt-2 text-caption" :class="enAlerta(row) ? 'text-red-700' : 'text-neutral-500'">
                Stock: {{ convertirStockVista(row.currentStock, row.product.measureUnit) }}
                / Stock Min: {{ convertirStockVista(row.minimumStock, row.product.measureUnit) }}
              </p>
            </button>

            <p v-if="loading" class="px-5 py-4 text-center text-caption text-neutral-500">
              Cargando productos...
            </p>

            <div v-else-if="error" class="px-5 py-6 text-center">
              <p class="text-body text-red-700">{{ error }}</p>
              <button type="button" class="mt-2 text-label text-primary-600 hover:underline" @click="loadMore">
                Reintentar
              </button>
            </div>

            <p v-else-if="items.length === 0" class="px-5 py-10 text-center text-neutral-500">
              <template v-if="terminoAplicado">Sin resultados para «{{ terminoAplicado }}».</template>
              <template v-else>No hay productos en el almacén de esta sucursal.</template>
            </p>
          </div>
          <div v-if="esEntrada" class="flex items-center gap-3">
            <label for="folio-movimiento" class="text-label font-bold text-secondary-900">Proveedor:</label>
            <input id="folio-movimiento" v-model="supplierName" type="text" autocomplete="off"
              class="w-48 min-w-0 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-body focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600" />
            <label for="folio-movimiento" class="text-label font-bold text-secondary-900">Folio:</label>
            <input id="folio-movimiento" v-model="folio" type="text" autocomplete="off"
              class="w-48 min-w-0 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-body focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600" />
          </div>
        </div>

        <!-- Derecha: productos de la entrada -->
        <div class="flex min-h-0 flex-1 flex-col gap-3">
          <div ref="tablaRef"
            class="min-h-0 flex-1 scroll-pt-12 overflow-auto rounded-xl border border-neutral-200 bg-white">
            <table class="w-full min-w-[34rem] border-collapse text-left">
              <colgroup>
                <col />
                <col class="w-44" />
                <col v-if="esEntrada" class="w-44" />
              </colgroup>

              <thead>
                <tr>
                  <th
                    class="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-100 px-4 py-3 text-center text-label text-secondary-900">
                    Información
                  </th>
                  <th
                    class="sticky top-0 z-10 border-b border-l border-neutral-200 bg-neutral-100 px-4 py-3 text-center text-label text-secondary-900">
                    Cantidad
                  </th>
                  <th v-if="esEntrada"
                    class="sticky top-0 z-10 border-b border-l border-neutral-200 bg-neutral-100 px-4 py-3 text-center text-label text-secondary-900">
                    Costo por K/L/U
                  </th>
                </tr>
              </thead>

              <tbody class="divide-y divide-neutral-200">
                <tr v-for="fila in seleccionados" :key="fila.storage.product.id" class="align-top">
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-between gap-2 border-b border-neutral-300 pb-1">
                      <p class="text-body text-primary-800">{{ fila.storage.product.description }}</p>
                      <button type="button"
                        class="action-button shrink-0 hover:bg-red-100 hover:text-red-600 active:bg-red-200"
                        :title="t.quitar" :aria-label="t.quitar" @click="quitar(fila.storage.product.id)">
                        <Trash2 :size="16" />
                      </button>
                    </div>
                    <p class="pt-2 text-caption" :class="enAlerta(fila.storage) ? 'text-red-700' : 'text-neutral-500'">
                      Stock: {{ convertirStockVista(fila.storage.currentStock, fila.storage.product.measureUnit) }}
                      / Stock Min: {{ convertirStockVista(fila.storage.minimumStock, fila.storage.product.measureUnit)
                      }}
                    </p>
                  </td>

                  <td class="border-l border-neutral-200 px-4 py-3">
                    <div class="flex items-center gap-2">
                      <input type="text" inputmode="decimal" autocomplete="off" :value="fila.cantidad"
                        :data-cantidad="fila.storage.product.id"
                        :aria-label="`Cantidad de ${fila.storage.product.description}`"
                        class="min-w-0 max-w-32 flex-1 rounded-lg border bg-white px-3 py-1.5 text-body focus:outline-none focus:ring-2"
                        :class="excedeStock(fila)
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-neutral-300 focus:border-primary-600 focus:ring-primary-600'
                          " :title="excedeStock(fila) ? 'Es mayor al stock disponible' : undefined"
                        @input="onNumero($event, fila, 'cantidad')" />
                      <span class="w-6 shrink-0 text-caption text-neutral-500">
                        {{ abreviaturas[fila.storage.product.measureUnit] }}
                      </span>
                    </div>
                  </td>

                  <td v-if="esEntrada" class="border-l border-neutral-200 px-4 py-3">
                    <div class="flex items-center gap-2">
                      <input type="text" 
                        inputmode="decimal" 
                        autocomplete="off"
                        :disabled="props.rolUsuario === 'Encargado de Almacen'"
                        :value="props.rolUsuario === 'Encargado de Almacen' ? String(fila.storage.product.costPrice) : fila.costo"
                        :aria-label="`Costo por ${CONVERSIONES[fila.storage.product.measureUnit].etiqueta} de ${fila.storage.product.description}`"
                        class="min-w-0 max-w-32 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-body
                         focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600
                         disabled:bg-neutral-100"
                        @input="onNumero($event, fila, 'costo')" />
                      <span class="w-6 shrink-0 text-caption text-neutral-500">$</span>
                    </div>
                  </td>
                </tr>

                <tr v-if="seleccionados.length === 0">
                  <td :colspan="esEntrada ? 3 : 2" class="px-4 py-10 text-center text-neutral-500">
                    {{ t.vacio }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex gap-4" :class="esEntrada ? 'justify-end' : 'justify-between'">
            <div v-if="!esEntrada" class="flex items-center gap-2">
              <label for="reason" class="text-label font-bold text-secondary-900">
                Motivo de salida:
              </label>

              <select id="reason" v-model="reason"
                class="rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-secondary-800">
                <option value="VENTA">Venta</option>
                <option value="TRASPASO">Traspaso</option>
                <option value="MERMA">Merma</option>
              </select>
            </div>
            <div class="flex items-center gap-4">
              <p v-if="seleccionados.length > 0 && !movimientoValido" class="text-right text-caption text-neutral-500">
                {{ t.hint }}
              </p>
              <button type="button"
                class="shrink-0 rounded-xl px-5 py-2 text-label text-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                :class="t.boton" :disabled="!movimientoValido" @click="confirmando = true">
                {{ t.confirmar }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Paso 2: confirmación -->
  <div v-if="confirmando" class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);">
    <div class="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-neutral-50 shadow-2xl"
      style="max-height: 85vh;">
      <div class="border-b border-neutral-200 px-6 py-4">
        <h3 class="text-title text-secondary-900" style="font-size: 1.125rem">{{ t.confirmarTitulo }}</h3>
        <p class="text-caption text-neutral-500">
          Se registrará {{ t.accion }} de {{ seleccionados.length }}
          {{ seleccionados.length === 1 ? 'producto' : 'productos' }} {{ t.destino }}
          con el folio <span class="font-semibold text-secondary-800">{{ folio.trim() }}</span>.
          {{ t.revisar }}
        </p>
      </div>

      <ul class="min-h-0 flex-1 divide-y divide-neutral-200 overflow-y-auto px-6">
        <li v-for="fila in seleccionados" :key="fila.storage.product.id"
          class="flex items-start justify-between gap-4 py-3">
          <span class="text-body text-primary-800">{{ fila.storage.product.description }}</span>
          <span class="shrink-0 text-right text-body">
            <span class="font-semibold text-secondary-800">
              {{ fila.cantidad }} {{ abreviaturas[fila.storage.product.measureUnit] }}
            </span>
            <span v-if="esEntrada" class="block text-caption text-neutral-500">
              a ${{ props.rolUsuario === "Encargado de Almacen" ? fila.storage.product.costPrice : fila.costo }} por {{ CONVERSIONES[fila.storage.product.measureUnit].etiqueta }}
            </span>
          </span>
        </li>
      </ul>

      <div class="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
        <button type="button"
          class="rounded-xl border border-neutral-300 bg-white px-5 py-2 text-label text-secondary-800 hover:bg-neutral-100 active:bg-neutral-200"
          @click="confirmando = false">
          Cancelar
        </button>
        <button type="button"
          class="rounded-xl px-5 py-2 text-label text-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
          :class="t.boton" :disabled="enviando" @click="confirmar">
          {{ t.confirmar }}
        </button>
      </div>
    </div>
  </div>
</template>