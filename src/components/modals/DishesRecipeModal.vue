<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { X, Search, Trash2, Check } from 'lucide-vue-next'
import { getProducts } from '@/service/ProductsService'
import type { Product } from '@/types/ProductsDtos'
import type { Recipe } from '@/types/DishesDtos'
import {
  ABREVIATURAS,
  costoInsumo,
  costoTotal,
  etiquetaCosto,
  formatoMoneda,
} from '@/utils/recipeCost'

const props = defineProps<{
  /** Receta actual del platillo. El editor trabaja sobre una copia hasta que se confirma. */
  recipe: Recipe[]
}>()

const emit = defineEmits<{
  close: []
  confirm: [recipe: Recipe[]]
}>()

/* ---------------------------------------------------------------------------
 * Lista izquierda: solo insumos (isSupply = true), búsqueda + scroll infinito
 * ------------------------------------------------------------------------- */

const PAGE_SIZE = 30

const items = ref<Product[]>([])
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

  try {
    const res = await getProducts(
      page.value + 1,
      PAGE_SIZE,
      terminoAplicado.value,
      'description',
      true,
    )
    if (miVersion !== version) return
    items.value.push(...res.items)
    page.value = res.page
    totalPages.value = res.totalPages
  } catch (err) {
    if (miVersion !== version) return
    console.error('No se pudieron cargar los productos:', err)
    error.value = 'No se pudieron cargar los productos.'
  } finally {
    if (miVersion === version) loading.value = false
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
 * Lista derecha: productos de la receta
 * ------------------------------------------------------------------------- */

interface FilaReceta {
  product: Product
  // Se guarda como texto para poder escribir "2." sin que se rompa; se convierte al confirmar.
  cantidad: string
}

// Copia de trabajo: si se sale con la X, lo que se editó aquí se descarta.
const filas = ref<FilaReceta[]>(
  props.recipe.map((r) => ({ product: r.product, cantidad: String(r.quantity) })),
)
const tablaRef = ref<HTMLElement | null>(null)

const idsAgregados = computed(() => new Set(filas.value.map((f) => f.product.id)))

const agregar = async (product: Product) => {
  if (idsAgregados.value.has(product.id)) return

  filas.value.push({ product, cantidad: '' })

  // Deja el cursor listo en la cantidad del producto recién agregado.
  await nextTick()
  tablaRef.value
    ?.querySelector<HTMLInputElement>(`[data-cantidad="${product.id}"]`)
    ?.focus()
}

const quitar = (productId: number) => {
  filas.value = filas.value.filter((f) => f.product.id !== productId)
}

// Deja solo dígitos y un punto decimal.
const limpiarNumero = (valor: string) => {
  const limpio = valor.replace(/[^0-9.]/g, '')
  const [entero, ...decimales] = limpio.split('.')
  return decimales.length ? `${entero}.${decimales.join('')}` : entero
}

const onCantidad = (e: Event, fila: FilaReceta) => {
  const el = e.target as HTMLInputElement
  const limpio = limpiarNumero(el.value)
  el.value = limpio // si no, el navegador conserva la letra tecleada
  fila.cantidad = limpio
}

const cantidadDe = (f: FilaReceta) => Number(f.cantidad) || 0

// Costo de la cantidad capturada (regla en @/utils/recipeCost).
const costoFila = (f: FilaReceta) => costoInsumo(f.product, cantidadDe(f))

const precioElaboracion = computed(() =>
  costoTotal(filas.value.map((f) => ({ product: f.product, quantity: cantidadDe(f) }))),
)

// Al menos un producto y todas las cantidades mayores a 0.
const recetaValida = computed(
  () => filas.value.length > 0 && filas.value.every((f) => cantidadDe(f) > 0),
)

const hint = computed(() =>
  filas.value.length === 0
    ? 'Agrega al menos un producto.'
    : 'Captura la cantidad de todos los productos.',
)

// Devuelve la receta confirmada al primer modal.
const confirmar = () => {
  emit(
    'confirm',
    filas.value.map((f) => ({ product: f.product, quantity: Number(f.cantidad) })),
  )
}

onMounted(loadMore)
</script>

<template>
  <div
    class="flex h-[88vh] max-h-[48rem] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-neutral-50 shadow-2xl"
  >
    <!-- Encabezado -->
    <div class="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
      <div>
        <h3 class="text-3xl font-bold text-secondary-900">Receta</h3>
        <p class="text-neutral-500">
          Elige los insumos que lleva el platillo y captura la cantidad de cada uno.
        </p>
      </div>
      <button
        type="button"
        class="action-button"
        title="Cerrar"
        aria-label="Cerrar"
        @click="emit('close')"
      >
        <X :size="18" />
      </button>
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-4 p-6 md:flex-row">
      <!-- Izquierda: búsqueda + lista de insumos -->
      <div class="flex min-h-0 flex-1 flex-col gap-3 md:w-2/5 md:flex-none">
        <form class="flex gap-2" @submit.prevent="buscar">
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar producto"
            aria-label="Buscar producto"
            class="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-body focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          <button
            type="submit"
            class="flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200"
            title="Buscar"
            aria-label="Buscar"
          >
            <Search :size="18" />
          </button>
        </form>

        <div
          class="min-h-0 flex-1 overflow-y-auto rounded-xl border border-neutral-200 bg-white"
          @scroll="onScroll"
        >
          <button
            v-for="product in items"
            :key="product.id"
            type="button"
            class="block w-full border-t border-neutral-200 px-5 py-3 text-left transition-colors first:border-t-0 hover:bg-neutral-100 active:bg-neutral-200 disabled:cursor-default disabled:bg-neutral-100 disabled:opacity-60"
            :disabled="idsAgregados.has(product.id)"
            @click="agregar(product)"
          >
            <div class="flex items-center justify-between gap-2 border-b border-neutral-300 pb-1">
              <p class="text-body text-primary-800">{{ product.description }}</p>
              <Check
                v-if="idsAgregados.has(product.id)"
                :size="16"
                class="shrink-0 text-green-700"
                aria-label="Ya agregado"
              />
            </div>
            <p class="pt-2 text-caption text-neutral-500">
              Unidad: {{ product.measureUnit }}
              / Costo: {{ formatoMoneda(product.costPrice * 1000) }} por {{ (etiquetaCosto(product.measureUnit)) }}
            </p>
          </button>

          <p v-if="loading" class="px-5 py-4 text-center text-caption text-neutral-500">
            Cargando productos...
          </p>

          <div v-else-if="error" class="px-5 py-6 text-center">
            <p class="text-body text-red-700">{{ error }}</p>
            <button
              type="button"
              class="mt-2 text-label text-primary-600 hover:underline"
              @click="loadMore"
            >
              Reintentar
            </button>
          </div>

          <p
            v-else-if="items.length === 0"
            class="px-5 py-10 text-center text-neutral-500"
          >
            <template v-if="terminoAplicado">Sin resultados para «{{ terminoAplicado }}».</template>
            <template v-else>No hay insumos disponibles.</template>
          </p>
        </div>
      </div>

      <!-- Derecha: receta -->
      <div class="flex min-h-0 flex-1 flex-col gap-3">
        <div
          ref="tablaRef"
          class="min-h-0 flex-1 scroll-pt-12 overflow-auto rounded-xl border border-neutral-200 bg-white"
        >
          <table class="w-full min-w-[34rem] border-collapse text-left">
            <colgroup>
              <col />
              <col class="w-44" />
              <col class="w-44" />
            </colgroup>

            <thead>
              <tr>
                <th class="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-100 px-4 py-3 text-center text-label text-secondary-900">
                  Información
                </th>
                <th class="sticky top-0 z-10 border-b border-l border-neutral-200 bg-neutral-100 px-4 py-3 text-center text-label text-secondary-900">
                  Cantidad
                </th>
                <th class="sticky top-0 z-10 border-b border-l border-neutral-200 bg-neutral-100 px-4 py-3 text-center text-label text-secondary-900">
                  Costo del insumo
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-neutral-200">
              <tr v-for="fila in filas" :key="fila.product.id" class="align-middle">
                <td class="px-4 py-3">
                  <div class="flex items-center justify-between gap-2 border-b border-neutral-300 pb-1">
                    <p class="text-body text-primary-800">{{ fila.product.description }}</p>
                    <button
                      type="button"
                      class="action-button shrink-0 hover:bg-red-100 hover:text-red-600 active:bg-red-200"
                      title="Quitar de la receta"
                      aria-label="Quitar de la receta"
                      @click="quitar(fila.product.id)"
                    >
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </td>

                <td class="border-l border-neutral-200 px-4 py-3">
                  <div class="flex items-center gap-2">
                    <input
                      type="text"
                      inputmode="decimal"
                      autocomplete="off"
                      :value="fila.cantidad"
                      :data-cantidad="fila.product.id"
                      :aria-label="`Cantidad de ${fila.product.description}`"
                      class="min-w-0 max-w-32 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-body focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600"
                      @input="onCantidad($event, fila)"
                    />
                    <span class="w-6 shrink-0 text-caption text-neutral-500">
                      {{ ABREVIATURAS[fila.product.measureUnit] }}
                    </span>
                  </div>
                </td>

                <td class="border-l border-neutral-200 px-4 py-3">
                  <!-- Solo informativo: costo de la cantidad capturada -->
                  <p class="rounded-lg border border-transparent px-3 py-1.5 text-center text-body text-secondary-800">
                    {{ formatoMoneda(costoFila(fila)) }}
                  </p>
                </td>
              </tr>

              <tr v-if="filas.length === 0">
                <td colspan="3" class="px-4 py-10 text-center text-neutral-500">
                  Elige un producto de la lista para agregarlo a la receta.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between gap-4">
          <p class="text-label font-bold text-secondary-900">
            Precio de elaboración:
            <span class="font-semibold text-secondary-800">{{ formatoMoneda(precioElaboracion) }}</span>
          </p>

          <div class="flex items-center gap-4">
            <p v-if="!recetaValida" class="text-right text-caption text-neutral-500">
              {{ hint }}
            </p>
            <button
              type="button"
              class="shrink-0 rounded-xl bg-primary-600 px-5 py-2 text-label text-neutral-50 hover:bg-primary-700 active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!recetaValida"
              @click="confirmar"
            >
              Confirmar receta
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
