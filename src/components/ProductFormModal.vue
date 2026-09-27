<script setup lang="ts">
/**
 * Alta y edición de productos e insumos.
 * Sin `product` es un alta (POST /products). Con `product` es una edición
 * (PUT /products/{id}) y el formulario arranca con los datos del producto.
 *
 * Estructura de BaseModal y FormField; aquí solo vive el negocio.
 */
import { computed, reactive, ref, watch } from 'vue'
import { DollarSign, Package } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormField from '@/components/ui/FormField.vue'
import { createProduct, updateProduct } from '@/service/ProductsService'
import { mensajeDeError } from '@/utils/apiError'
import { toNumber } from '@/utils/format'
import type { CreateProduct, Product } from '@/types/ProductsDtos'

const LIMITE_DESCRIPCION = 80

/** Las unidades más comunes en un restaurante. */
const UNIDADES = ['kg', 'g', 'lt', 'ml', 'pza', 'caja', 'paquete']

const props = defineProps<{
  open: boolean
  /** Si viene, el modal edita ese producto en vez de crear uno nuevo. */
  product?: Product | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

// --- Estado -----------------------------------------------------------------
const form = reactive({
  description: '',
  isSupply: true,
  price: null as number | null,
  measureUnit: 'kg',
})

const errors = reactive({ description: '', price: '' })

const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const esEdicion = computed(() => !!props.product)

const titulo = computed(() => (esEdicion.value ? 'Editar Producto' : 'Nuevo Producto'))
const subtitulo = computed(() =>
  esEdicion.value
    ? 'Modifica los datos del producto seleccionado.'
    : 'Registra un producto de venta o un insumo de la receta.',
)
const textoBoton = computed(() => {
  if (successMsg.value) return '¡Guardado!'
  return esEdicion.value ? 'Guardar cambios' : 'Guardar producto'
})

/** Al abrir, el formulario queda limpio o con los datos del producto a editar. */
function reiniciar() {
  const product = props.product

  form.description = product?.description ?? ''
  form.isSupply = product?.isSupply ?? true
  form.price = product ? toNumber(product.price) : null
  form.measureUnit = product?.measureUnit ?? 'kg'
  Object.assign(errors, { description: '', price: '' })
  errorMsg.value = ''
  successMsg.value = ''
}

watch(
  () => props.open,
  (abierto) => {
    if (abierto) reiniciar()
  },
)

// --- Validación -------------------------------------------------------------
function errorDeDescripcion(texto: string): string {
  if (!texto) return 'La descripción es obligatoria.'
  if (texto.length > LIMITE_DESCRIPCION) return `Máximo ${LIMITE_DESCRIPCION} caracteres.`
  return ''
}

function errorDePrecio(valor: number | null): string {
  if (valor === null || Number.isNaN(valor)) return 'El precio es obligatorio.'
  if (valor < 0) return 'El precio no puede ser negativo.'
  return ''
}

function validar(): boolean {
  errors.description = errorDeDescripcion(form.description.trim())
  errors.price = errorDePrecio(form.price)
  return !errors.description && !errors.price
}

// --- Guardar ----------------------------------------------------------------
async function guardar() {
  if (!validar()) return

  saving.value = true
  errorMsg.value = ''

  // El DTO tipa price como string, por eso el precio va convertido a texto.
  const payload: CreateProduct = {
    description: form.description.trim(),
    isSupply: form.isSupply,
    price: String(form.price),
    measureUnit: form.measureUnit,
  }

  const editando = props.product

  try {
    if (editando) await updateProduct(editando.id, payload)
    else await createProduct(payload)

    successMsg.value = editando
      ? '¡Producto actualizado correctamente!'
      : '¡Producto guardado exitosamente!'
    emit('saved')
    setTimeout(() => emit('close'), 1500)
  } catch (err) {
    errorMsg.value = mensajeDeError(
      err,
      editando
        ? 'No se pudo actualizar el producto. Intenta de nuevo.'
        : 'No se pudo guardar el producto. Intenta de nuevo.',
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

    <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
      <FormField
        label="Descripción"
        :span="2"
        required
        :error="errors.description"
        :hint="`${form.description.length}/${LIMITE_DESCRIPCION} caracteres`"
      >
        <input
          v-model="form.description"
          type="text"
          :maxlength="LIMITE_DESCRIPCION"
          placeholder="Ej. Carne de res deshebrada"
          class="field-control"
          :class="errors.description ? 'field-control-error' : 'field-control-ok'"
        />
      </FormField>

      <FormField label="Precio (MXN)" required :error="errors.price">
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

      <FormField label="Unidad de medida" required>
        <select
          v-model="form.measureUnit"
          class="field-control cursor-pointer field-control-ok"
        >
          <option v-for="unidad in UNIDADES" :key="unidad" :value="unidad">{{ unidad }}</option>
        </select>
      </FormField>

      <FormField
        label="¿Se usa como insumo?"
        :span="2"
        hint="Si está activo, puede agregarse a la receta de un platillo."
      >
        <select v-model="form.isSupply" class="field-control cursor-pointer field-control-ok">
          <option :value="true">Sí, es un insumo</option>
          <option :value="false">No, es un producto de venta</option>
        </select>
      </FormField>
    </div>
  </BaseModal>
</template>
