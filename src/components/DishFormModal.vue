<script setup lang="ts">
/**
 * Alta y edición de platillos.
 * Sin `dish` es un alta (POST /dishes). Con `dish` es una edición
 * (PUT /dishes/{id}) y el formulario arranca con los datos del platillo.
 *
 * Estructura de BaseModal y FormField; aquí solo vive el negocio.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { BookOpen, ChefHat, DollarSign, Info, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormField from '@/components/ui/FormField.vue'
import { postDish as createDish, putDish as updateDish } from '@/service/DishesService'
import { getProducts } from '@/service/ProductsService'
import { mensajeDeError } from '@/utils/apiError'
import { toNumber } from '@/utils/format'
import type { CreateDish, Dish } from '@/types/DishesDtos'
import type { Product } from '@/types/ProductsDtos'

const LIMITE_NOMBRE = 50

const props = defineProps<{
  open: boolean
  /** Si viene, el modal edita ese platillo en vez de crear uno nuevo. */
  dish?: Dish | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

// --- Estado -----------------------------------------------------------------
const form = reactive({
  name: '',
  price: null as number | null,
})

/** El DTO declara un solo insumo, con su cantidad. */
const insumo = reactive({ productId: '' as number | '', quantity: null as number | null })

const errors = reactive({ name: '', price: '', insumo: '' })

const availableProducts = ref<Product[]>([])
const loadingProducts = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const esEdicion = computed(() => !!props.dish)

const titulo = computed(() => (esEdicion.value ? 'Editar Platillo' : 'Nuevo Platillo'))
const subtitulo = computed(() =>
  esEdicion.value
    ? 'Modifica los datos del platillo y su insumo principal.'
    : 'Registra los datos y el insumo del platillo.',
)
const textoBoton = computed(() => {
  if (successMsg.value) return '¡Guardado!'
  return esEdicion.value ? 'Guardar cambios' : 'Guardar platillo'
})

const productoElegido = computed(() =>
  availableProducts.value.find((p) => p.id === insumo.productId),
)

function reiniciar() {
  const dish = props.dish

  form.name = dish?.name ?? ''
  form.price = dish ? toNumber(dish.price) : null
  insumo.productId = dish?.recipe?.[0]?.product?.id ?? ''
  insumo.quantity = dish?.recipe?.[0]?.quantity ?? null

  Object.assign(errors, { name: '', price: '', insumo: '' })
  errorMsg.value = ''
  successMsg.value = ''
}

watch(
  () => props.open,
  (abierto) => {
    if (abierto) reiniciar()
  },
)

// --- Insumos disponibles ----------------------------------------------------
async function cargarProductos() {
  try {
    loadingProducts.value = true
    availableProducts.value = (await getProducts(1, 100, '', 'description', true)).items ?? []
  } catch (err) {
    console.error('No se pudieron cargar los insumos:', err)
  } finally {
    loadingProducts.value = false
  }
}

onMounted(cargarProductos)

// --- Validación -------------------------------------------------------------
function errorDeNombre(nombre: string): string {
  if (!nombre) return 'El nombre del platillo es obligatorio.'
  if (nombre.length > LIMITE_NOMBRE) return `Máximo ${LIMITE_NOMBRE} caracteres.`
  return ''
}

function errorDePrecio(valor: number | null): string {
  if (valor === null || Number.isNaN(valor)) return 'El precio de venta es obligatorio.'
  if (valor < 0) return 'El precio no puede ser negativo.'
  return ''
}

function validar(): boolean {
  errors.name = errorDeNombre(form.name.trim())
  errors.price = errorDePrecio(form.price)

  if (insumo.productId && (!insumo.quantity || insumo.quantity <= 0)) {
    errors.insumo = 'Indica la cantidad del insumo.'
  } else {
    errors.insumo = ''
  }

  return !errors.name && !errors.price && !errors.insumo
}

// --- Guardar ----------------------------------------------------------------
/** Arma el insumo con los datos del producto elegido más la cantidad. */
function armarReceta(): CreateDish['recipe'] {
  const producto = productoElegido.value
  if (!producto || insumo.productId === '') return []
  return [
    {
      productId: producto.id,
      quantity: toNumber(insumo.quantity),
    },
  ]
}

async function guardar() {
  if (!validar()) return

  saving.value = true
  errorMsg.value = ''

  const precio = Number(form.price)

  const payload: CreateDish = {
    name: form.name.trim(),
    price: precio,
    recipe: armarReceta(),
  }

  const editando = props.dish

  try {
    if (editando) await updateDish(editando.id, payload)
    else await createDish(payload)

    successMsg.value = editando
      ? '¡Platillo actualizado correctamente!'
      : '¡Platillo guardado exitosamente!'
    emit('saved')
    setTimeout(() => emit('close'), 1500)
  } catch (err) {
    errorMsg.value = mensajeDeError(
      err,
      editando
        ? 'No se pudo actualizar el platillo. Intenta de nuevo.'
        : 'No se pudo guardar el platillo. Intenta de nuevo.',
    )
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="titulo"
    :subtitle="subtitulo"
    :icon="ChefHat"
    :loading="saving"
    :error="errorMsg"
    :success="successMsg"
    :submit-text="textoBoton"
    @close="emit('close')"
    @submit="guardar"
  >
    <template #submitIcon>
      <ChefHat v-if="!saving && !successMsg" :size="18" />
    </template>

    <div class="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2">
      <FormField
        label="Nombre del platillo"
        :span="2"
        required
        :error="errors.name"
        :hint="`${form.name.length}/${LIMITE_NOMBRE} caracteres`"
      >
        <input
          v-model="form.name"
          type="text"
          :maxlength="LIMITE_NOMBRE"
          placeholder="Ej. Tacos de Rib Eye con Tuétano"
          class="field-control"
          :class="errors.name ? 'field-control-error' : 'field-control-ok'"
        />
      </FormField>

      <FormField label="Precio de venta (MXN)" required :error="errors.price">
        <div class="relative">
          <DollarSign
            :size="16"
            class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            v-model="form.price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            class="field-control pl-10"
            :class="errors.price ? 'field-control-error' : 'field-control-ok'"
          />
        </div>
      </FormField>
    </div>

    <div>
      <div class="mb-3 flex items-center justify-between">
        <label class="text-xs font-bold uppercase tracking-wider text-neutral-600">
          Insumo principal
        </label>
        <span class="text-xs text-neutral-400">Opcional</span>
      </div>

      <div class="overflow-hidden rounded-2xl border border-neutral-200">
        <div v-if="!productoElegido" class="bg-neutral-100 px-6 py-8 text-center">
          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
            <BookOpen :size="20" class="text-primary-600" />
          </div>
          <p class="text-sm font-semibold text-secondary-700">Sin insumo configurado</p>
          <p class="mt-1 text-xs leading-relaxed text-neutral-400">
            Elige un insumo para relacionarlo con el platillo.
          </p>
        </div>

        <div v-else class="grid items-start gap-3 px-4 py-3" style="grid-template-columns: 1fr 7rem 2.5rem">
          <div>
            <select
              v-model="insumo.productId"
              class="field-control cursor-pointer"
              :class="errors.insumo ? 'field-control-error' : 'field-control-ok'"
            >
              <option value="" disabled>
                {{ loadingProducts ? 'Cargando...' : 'Seleccionar insumo...' }}
              </option>
              <option v-for="prod in availableProducts" :key="prod.id" :value="prod.id">
                {{ prod.description }}
              </option>
            </select>
            <p v-if="errors.insumo" class="mt-1 text-xs text-red-500">{{ errors.insumo }}</p>
          </div>

          <div>
            <input
              v-model="insumo.quantity"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0"
              class="field-control text-center"
              :class="errors.insumo ? 'field-control-error' : 'field-control-ok'"
            />
            <p v-if="productoElegido" class="mt-1 text-center text-xs text-neutral-400">
              {{ productoElegido.measureUnit }}
            </p>
          </div>

          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Quitar"
            @click="insumo.productId = ''; insumo.quantity = null"
          >
            <Trash2 :size="17" />
          </button>
        </div>
      </div>
    </div>

    <div
      class="mt-5 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-100 p-4 text-xs text-neutral-500"
    >
      <Info :size="16" class="mt-0.5 shrink-0 text-primary-600" />
      <p>
        El precio unitario se calcula con la suma de los insumos, y el margen es la diferencia
        contra el precio de venta.
      </p>
    </div>
  </BaseModal>
</template>
