<script setup lang="ts">
/**
 * Alta y edición de combos.
 * Sin `combo` es un alta (POST /combos). Con `combo` es una edición
 * (PUT /combos/{id}) y el formulario arranca con los datos del combo.
 *
 * Estructura de BaseModal y FormField; aquí solo vive el negocio.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { DollarSign, Info, Package, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormField from '@/components/ui/FormField.vue'
import { postCombo as createCombo, putCombo as updateCombo } from '@/service/CombosService'
import { getDishes } from '@/service/DishesService'
import { mensajeDeError } from '@/utils/apiError'
import { formatCurrency, toNumber } from '@/utils/format'
import type { Combo, CreateCombo } from '@/types/CombosDtos'
import type { Dish } from '@/types/DishesDtos'

const LIMITE_NOMBRE = 50

const props = defineProps<{
  open: boolean
  /** Si viene, el modal edita ese combo en vez de crear uno nuevo. */
  combo?: Combo | null
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

/** El DTO declara un solo platillo, con la cantidad en la que va en el combo. */
const platillo = reactive({ dishId: '' as number | '', quantity: null as number | null })

const errors = reactive({ name: '', price: '', platillo: '' })

const availableDishes = ref<Dish[]>([])
const loadingDishes = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const esEdicion = computed(() => !!props.combo)

const titulo = computed(() => (esEdicion.value ? 'Editar Combo' : 'Nuevo Combo'))
const subtitulo = computed(() =>
  esEdicion.value
    ? 'Modifica el combo y el platillo que lo compone.'
    : 'Registra el combo y el platillo que lo compone.',
)
const textoBoton = computed(() => {
  if (successMsg.value) return '¡Guardado!'
  return esEdicion.value ? 'Guardar cambios' : 'Guardar combo'
})

const dishElegido = computed(() => availableDishes.value.find((d) => d.id === platillo.dishId))

/** Costo del platillo dentro del combo. */
const costo = computed(() => toNumber(dishElegido.value?.price) * toNumber(platillo.quantity))

function reiniciar() {
  const combo = props.combo

  form.name = combo?.name ?? ''
  form.price = combo ? toNumber(combo.price) : null
  platillo.dishId = combo?.dishes?.[0]?.dish?.id ?? ''
  platillo.quantity = combo?.dishes?.[0]?.quantity ?? null

  Object.assign(errors, { name: '', price: '', platillo: '' })
  errorMsg.value = ''
  successMsg.value = ''
}

watch(
  () => props.open,
  (abierto) => {
    if (abierto) reiniciar()
  },
)

// --- Platillos disponibles --------------------------------------------------
async function cargarPlatillos() {
  try {
    loadingDishes.value = true
    availableDishes.value = (await getDishes()).items ?? []
  } catch (err) {
    console.error('No se pudieron cargar los platillos:', err)
  } finally {
    loadingDishes.value = false
  }
}

onMounted(cargarPlatillos)

// --- Validación -------------------------------------------------------------
function errorDeNombre(nombre: string): string {
  if (!nombre) return 'El nombre del combo es obligatorio.'
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

  if (platillo.dishId && (!platillo.quantity || platillo.quantity <= 0)) {
    errors.platillo = 'Indica la cantidad.'
  } else {
    errors.platillo = ''
  }

  return !errors.name && !errors.price && !errors.platillo
}

// --- Guardar ----------------------------------------------------------------
/** Arma el platillo del combo con los datos delplatillo elegido más la cantidad. */
function armarPlatillo(): CreateCombo['dishes'] {
  const dish = dishElegido.value
  if (!dish || platillo.dishId === '') return []
  return [
    {
      dishId: dish.id,
      quantity: toNumber(platillo.quantity),
    },
  ]
}

async function guardar() {
  if (!validar()) return

  saving.value = true
  errorMsg.value = ''

  // El precio del combo es un número (ver CreateCombo.price).
  const precio = Number(form.price)

  const payload: CreateCombo = {
    name: form.name.trim(),
    price: precio,
    dishes: armarPlatillo(),
    products: [],
  }

  const editando = props.combo

  try {
    if (editando) await updateCombo(editando.id, payload)
    else await createCombo(payload)

    successMsg.value = editando
      ? '¡Combo actualizado correctamente!'
      : '¡Combo guardado exitosamente!'
    emit('saved')
    setTimeout(() => emit('close'), 1500)
  } catch (err) {
    errorMsg.value = mensajeDeError(
      err,
      editando
        ? 'No se pudo actualizar el combo. Intenta de nuevo.'
        : 'No se pudo guardar el combo. Intenta de nuevo.',
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
    :icon="Package"
    :loading="saving"
    :error="errorMsg"
    :success="successMsg"
    :submit-text="textoBoton"
    @close="emit('close')"
    @submit="guardar"
  >
    <template #submitIcon>
      <Package v-if="!saving && !successMsg" :size="18" />
    </template>

    <div class="mb-7 grid grid-cols-1 gap-5 md:grid-cols-2">
      <FormField
        label="Nombre del combo"
        :span="2"
        required
        :error="errors.name"
        :hint="`${form.name.length}/${LIMITE_NOMBRE} caracteres`"
      >
        <input
          v-model="form.name"
          type="text"
          :maxlength="LIMITE_NOMBRE"
          placeholder="Ej. Combo familiar"
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
          Platillo del combo
        </label>
        <span class="text-xs text-neutral-400">Opcional</span>
      </div>

      <div class="overflow-hidden rounded-2xl border border-neutral-200">
        <div class="grid items-start gap-3 px-4 py-3" style="grid-template-columns: 1fr 7rem 2.5rem">
          <div>
            <select
              v-model="platillo.dishId"
              class="field-control cursor-pointer"
              :class="errors.platillo ? 'field-control-error' : 'field-control-ok'"
            >
              <option value="" disabled>
                {{ loadingDishes ? 'Cargando...' : 'Seleccionar platillo...' }}
              </option>
              <option v-for="dish in availableDishes" :key="dish.id" :value="dish.id">
                {{ dish.name }}
              </option>
            </select>
            <p v-if="errors.platillo" class="mt-1 text-xs text-red-500">{{ errors.platillo }}</p>
          </div>

          <div>
            <input
              v-model="platillo.quantity"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0"
              class="field-control text-center"
              :class="errors.platillo ? 'field-control-error' : 'field-control-ok'"
            />
            <p v-if="costo > 0" class="mt-1 text-center text-xs tabular-nums text-neutral-400">
              {{ formatCurrency(costo) }}
            </p>
          </div>

          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Quitar"
            @click="platillo.dishId = ''; platillo.quantity = null"
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
        El costo del platillo se muestra como referencia para que veas el margen del combo.
      </p>
    </div>
  </BaseModal>
</template>
