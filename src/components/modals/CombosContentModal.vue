<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { X, Search, Trash2, Check } from 'lucide-vue-next'
import { getDishes } from '@/service/DishesService'
import { getProducts } from '@/service/ProductsService'
import { formatoMoneda } from '@/utils/recipeCost'
import { precioItem, precioTotal, subtotalItem, type ComboItem } from '@/utils/comboPricing'

const props = defineProps<{
  /** Contenido actual del combo. El editor trabaja sobre una copia hasta que se confirma. */
  items: ComboItem[]
}>()

const emit = defineEmits<{
  close: []
  confirm: [items: ComboItem[]]
}>()

// Un platillo y un producto pueden tener el mismo id, por eso la clave incluye el tipo.
const clave = (item: ComboItem) => `${item.type}-${item.id}`

/* ---------------------------------------------------------------------------
 * Lista izquierda: platillos y luego productos de venta (isSupply = false)
 * ------------------------------------------------------------------------- */

const PAGE_SIZE = 30

const lista = ref<ComboItem[]>([])
const listaRef = ref<HTMLElement | null>(null)

// Se recorren primero todos los platillos y después todos los productos de venta.
type Fuente = 'dishes' | 'products' | 'done'
const fuente = ref<Fuente>('dishes')
const page = ref(0)
const loading = ref(false)
const error = ref('')

const busqueda = ref('') // lo que se escribe en la barra
const terminoAplicado = ref('') // lo que realmente se mandó a buscar

// Sirve para descartar respuestas viejas si el usuario busca otra cosa mientras carga.
let version = 0

const loadMore = async () => {
  if (loading.value || fuente.value === 'done') return

  const miVersion = version
  loading.value = true
  error.value = ''

  try {
    if (fuente.value === 'dishes') {
      const res = await getDishes(page.value + 1, PAGE_SIZE, terminoAplicado.value, 'name')
      if (miVersion !== version) return
      lista.value.push(
        ...res.items.map((dish) => ({
          type: 'dish' as const,
          id: dish.id,
          name: dish.name,
          quantity: 1,
          dish,
        })),
      )
      page.value = res.page
      if (res.page >= res.totalPages) {
        fuente.value = 'products'
        page.value = 0
      }
    } else {
      const res = await getProducts(
        page.value + 1,
        PAGE_SIZE,
        terminoAplicado.value,
        'description',
        false,
      )
      if (miVersion !== version) return
      lista.value.push(
        ...res.items.map((product) => ({
          type: 'product' as const,
          id: product.id,
          name: product.description,
          quantity: 1,
          product,
        })),
      )
      page.value = res.page
      if (res.page >= res.totalPages) fuente.value = 'done'
    }
  } catch (err) {
    if (miVersion !== version) return
    console.error('No se pudieron cargar los platillos y productos:', err)
    error.value = 'No se pudieron cargar los platillos y productos.'
  } finally {
    if (miVersion === version) loading.value = false
  }

  if (miVersion === version && !error.value) await llenarSiHaceFalta()
}

// Si lo cargado no alcanza para generar scroll (por ejemplo, pocos platillos),
// sigue cargando para llegar a los productos sin que el usuario tenga que hacer nada.
const llenarSiHaceFalta = async () => {
  await nextTick()
  const el = listaRef.value
  if (el && fuente.value !== 'done' && el.scrollHeight <= el.clientHeight + 80) {
    await loadMore()
  }
}

const buscar = () => {
  version++
  terminoAplicado.value = busqueda.value.trim()
  lista.value = []
  fuente.value = 'dishes'
  page.value = 0
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
 * Lista derecha: contenido del combo
 * ------------------------------------------------------------------------- */

interface FilaCombo {
  item: ComboItem
  // Se guarda como texto para poder borrar y reescribir; se convierte al confirmar.
  cantidad: string
}

// Copia de trabajo: si se sale con la X, lo que se editó aquí se descarta.
const filas = ref<FilaCombo[]>(
  props.items.map((item) => ({ item, cantidad: String(item.quantity) })),
)
const tablaRef = ref<HTMLElement | null>(null)

const clavesAgregadas = computed(() => new Set(filas.value.map((f) => clave(f.item))))

const agregar = async (item: ComboItem) => {
  const k = clave(item)
  if (clavesAgregadas.value.has(k)) return

  filas.value.push({ item, cantidad: '' })

  // Deja el cursor listo en la cantidad del elemento recién agregado.
  await nextTick()
  tablaRef.value?.querySelector<HTMLInputElement>(`[data-cantidad="${k}"]`)?.focus()
}

const quitar = (item: ComboItem) => {
  const k = clave(item)
  filas.value = filas.value.filter((f) => clave(f.item) !== k)
}

// La cantidad de platillos y productos es entera: solo dígitos.
const onCantidad = (e: Event, fila: FilaCombo) => {
  const el = e.target as HTMLInputElement
  const limpio = el.value.replace(/\D/g, '')
  el.value = limpio // si no, el navegador conserva la letra tecleada
  fila.cantidad = limpio
}

const cantidadDe = (f: FilaCombo) => Number(f.cantidad) || 0

// Precio individual × cantidad capturada.
const subtotalFila = (f: FilaCombo) => subtotalItem({ ...f.item, quantity: cantidadDe(f) })

const precioTotalCombo = computed(() =>
  precioTotal(filas.value.map((f) => ({ ...f.item, quantity: cantidadDe(f) }))),
)

// Al menos un elemento y todas las cantidades mayores a 0.
const contenidoValido = computed(
  () => filas.value.length > 0 && filas.value.every((f) => cantidadDe(f) > 0),
)

const hint = computed(() =>
  filas.value.length === 0
    ? 'Agrega al menos un platillo o producto.'
    : 'Captura la cantidad de todos los elementos.',
)

// Devuelve el contenido confirmado al primer modal.
const confirmar = () => {
  emit(
    'confirm',
    filas.value.map((f) => ({ ...f.item, quantity: Number(f.cantidad) })),
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
        <h3 class="text-3xl font-bold text-secondary-900">Contenido del combo</h3>
        <p class="text-neutral-500">
          Elige los platillos y productos que forman parte del combo y captura la cantidad de cada uno.
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
      <!-- Izquierda: búsqueda + lista de platillos y productos -->
      <div class="flex min-h-0 flex-1 flex-col gap-3 md:w-2/5 md:flex-none">
        <form class="flex gap-2" @submit.prevent="buscar">
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar platillo o producto"
            aria-label="Buscar platillo o producto"
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
          ref="listaRef"
          class="min-h-0 flex-1 overflow-y-auto rounded-xl border border-neutral-200 bg-white"
          @scroll="onScroll"
        >
          <button
            v-for="item in lista"
            :key="clave(item)"
            type="button"
            class="block w-full border-t border-neutral-200 px-5 py-3 text-left transition-colors first:border-t-0 hover:bg-neutral-100 active:bg-neutral-200 disabled:cursor-default disabled:bg-neutral-100 disabled:opacity-60"
            :disabled="clavesAgregadas.has(clave(item))"
            @click="agregar(item)"
          >
            <div class="flex items-center justify-between gap-2 border-b border-neutral-300 pb-1">
              <p class="text-body text-primary-800">{{ item.name }}</p>
              <Check
                v-if="clavesAgregadas.has(clave(item))"
                :size="16"
                class="shrink-0 text-green-700"
                aria-label="Ya agregado"
              />
            </div>
            <p class="pt-2 text-caption text-neutral-500">
              {{ item.type === 'dish' ? 'Platillo' : 'Producto' }}
              / Precio: {{ formatoMoneda(precioItem(item)) }}
            </p>
          </button>

          <p v-if="loading" class="px-5 py-4 text-center text-caption text-neutral-500">
            Cargando...
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
            v-else-if="lista.length === 0 && fuente === 'done'"
            class="px-5 py-10 text-center text-neutral-500"
          >
            <template v-if="terminoAplicado">Sin resultados para «{{ terminoAplicado }}».</template>
            <template v-else>No hay platillos ni productos disponibles.</template>
          </p>
        </div>
      </div>

      <!-- Derecha: contenido del combo -->
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
                  Subtotal
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-neutral-200">
              <tr v-for="fila in filas" :key="clave(fila.item)" class="align-middle">
                <td class="px-4 py-3">
                  <div class="flex items-center justify-between gap-2 border-b border-neutral-300 pb-1">
                    <p class="text-body text-primary-800">{{ fila.item.name }}</p>
                    <button
                      type="button"
                      class="action-button shrink-0 hover:bg-red-100 hover:text-red-600 active:bg-red-200"
                      title="Quitar del combo"
                      aria-label="Quitar del combo"
                      @click="quitar(fila.item)"
                    >
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </td>

                <td class="border-l border-neutral-200 px-4 py-3">
                  <input
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    :value="fila.cantidad"
                    :data-cantidad="clave(fila.item)"
                    :aria-label="`Cantidad de ${fila.item.name}`"
                    class="w-full max-w-32 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-body focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600"
                    @input="onCantidad($event, fila)"
                  />
                </td>

                <td class="border-l border-neutral-200 px-4 py-3">
                  <!-- Solo informativo: precio individual × cantidad -->
                  <p class="rounded-lg border border-transparent px-3 py-1.5 text-center text-body text-secondary-800">
                    {{ formatoMoneda(subtotalFila(fila)) }}
                  </p>
                </td>
              </tr>

              <tr v-if="filas.length === 0">
                <td colspan="3" class="px-4 py-10 text-center text-neutral-500">
                  Elige un platillo o producto de la lista para agregarlo al combo.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between gap-4">
          <p class="text-label font-bold text-secondary-900">
            Precio total del combo:
            <span class="font-semibold text-secondary-800">{{ formatoMoneda(precioTotalCombo) }}</span>
          </p>

          <div class="flex items-center gap-4">
            <p v-if="!contenidoValido" class="text-right text-caption text-neutral-500">
              {{ hint }}
            </p>
            <button
              type="button"
              class="shrink-0 rounded-xl bg-primary-600 px-5 py-2 text-label text-neutral-50 hover:bg-primary-700 active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!contenidoValido"
              @click="confirmar"
            >
              Confirmar contenido
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>