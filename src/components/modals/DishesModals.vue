<script setup lang="ts">

import { ref, computed } from 'vue'
import { DollarSign, OctagonAlert, FileText, X } from 'lucide-vue-next'
import type { Dish , Recipe, CreateDish, UpdateDish } from '@/types/DishesDtos'
import DeleteModal from '@/components/modals/DeleteModal.vue'
import DishesRecipeModal from '@/components/modals/DishesRecipeModal.vue'
import { costoTotal } from '@/utils/recipeCost'

const emit = defineEmits<{
  close: []
  insert: [string, number, CreateDish['recipe']]
  update: [string, number, UpdateDish['recipe']]
  delete: [string]
  action: []
}>()

const props = withDefaults(
  defineProps<{
    isInsert?: boolean
    isDelete?: boolean
    isAction?: boolean

    modalTitle?: string
    modalSubtitle?: string

    dish?: Dish
  }>(),
  {
    isInsert: false,
    isDelete: false,
    isAction: false
  }
)

const name=ref(props.dish?.name??'')
const price=ref<number|null>(props.dish?.price??null)
const recipe=ref<Recipe[]>(props.dish?.recipe?[...props.dish.recipe]:[])


const reason = ref('')
const recipeEnable = ref(false)
const firstDeleteModel = ref(props.isDelete ?? '')
const reasonModalEnable = ref(false)

const validate = computed(() => {
  return (
    name.value.trim() !== '' &&
    price.value !== null &&
    price.value >= 0 &&
    recipe.value.length !== 0 &&
    price.value > precioFabricacion.value
  )
})

// Precio de fabricación: suma del costo de cada insumo de la receta (solo informativo).
const precioFabricacion = computed(() => costoTotal(recipe.value))

// El editor devuelve la receta confirmada: se aplica y se vuelve al primer modal.
const aplicarReceta = (nueva: Recipe[]) => {
  recipe.value = nueva
  recipeEnable.value = false
}

// Con el editor de receta abierto, un clic en el fondo no cierra todo (se perderían los cambios).
const cerrarPorFondo = () => {
  if (recipeEnable.value) return
  emit('close')
}

const changeDeleteModal = () => {
  reasonModalEnable.value = true
  firstDeleteModel.value = false
}

type Unidad = Storage['product']['measureUnit']
const CONVERSIONES: Record<Unidad, { etiqueta: string; factor: number }> = {
  Unidades: { etiqueta: 'u', factor: 1 },
  Kilogramos: { etiqueta: 'g', factor: 1000 },
  Litros: { etiqueta: 'ml', factor: 1000 },
}

const save=()=>{
    if(price.value===null)return
    const recipeRequest=recipe.value.map(item=>({
        productId:item.product.id,
        quantity:item.quantity
    }))
    if(props.isInsert){
        console.log('Insertando platillo:', name.value, price.value, recipeRequest, precioFabricacion.value)
        emit('insert', name.value, price.value, recipeRequest)
    }else{
        console.log('Actualizando:', name.value, price.value, recipeRequest, precioFabricacion.value)
        emit('update', name.value, price.value, recipeRequest)
    }
}

const confirmDelete = () => {
  console.log('Motivo de eliminación:', reason.value)
  reasonModalEnable.value = false
  emit('delete', reason.value)
}

const exportarPdf = async () => {
  const { jsPDF } = await import('jspdf')
  const { autoTable } = await import('jspdf-autotable')
  const { PDF_HEADER_FILL, pintarLogoMandys } = await import('@/utils/pdfBranding')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  // Logo de Mandy's en el header superior derecho.
  await pintarLogoMandys(doc)

  doc.setFontSize(14)
  doc.text(`Receta: ${name.value || 'Platillo'}`, 40, 40)
  doc.setFontSize(10)
  doc.setTextColor(110, 110, 110)
  doc.text(`Precio: $${Number(price.value ?? 0).toFixed(2)}`, 40, 58)
  doc.text(`Exportado el ${new Date().toLocaleDateString('es-MX')}`, 40, 72)

  autoTable(doc, {
    startY: 86,
    head: [['Producto', 'Cantidad', 'Unidad de medida']],
    body: recipe.value.map((item) => [
      item.product.description,
      String(item.quantity),
      item.product.measureUnit,
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: [30, 30, 30] },
    headStyles: { fillColor: PDF_HEADER_FILL, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 40, right: 40 },
  })

  const base = (name.value || 'platillo')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `${base || 'platillo'}.pdf`
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
</script>

<template>

  <!-- Fondo -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
    @click.self="cerrarPorFondo"
  >

    <!-- Modal de insertar / editar -->
    <div
      v-if="!isDelete && !isAction"
      v-show="!recipeEnable"
      class="flex flex-col rounded-2xl shadow-2xl w-full max-w-xl bg-neutral-50 overflow-hidden" style="max-height: 92vh;">
      <!-- Encabezado del modal-->
      <div class="border-b border-neutral-200 p-4">
        <h1 class="text-secondary-800 text-2xl font-bold">
          {{ props.modalTitle }}
        </h1>
        <p class="text-neutral-700">
          {{ props.modalSubtitle }}
        </p>
      </div>

      <!-- Contenido -->
      <div>
        <!-- Nombre del platillo -->
        <div class="px-8 pt-4">

          <label
            class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5"
          >
            Nombre del platillo
            <span class="text-red-500">*</span>
          </label>

          <input
            v-model="name"
            type="text"
            maxlength="50"
            placeholder="Ej. Tacos de Rib Eye con Tuétano"
            class="w-full px-4 py-3 border rounded-xl text-sm
                   bg-neutral-100 text-neutral-800
                   placeholder-neutral-300 font-medium
                   transition-all focus:outline-none focus:ring-1"
          />

        </div>

        <!-- Precio y precio de fabricación -->
        <div class="flex flex-wrap gap-4 px-8 pt-4">

          <div class="min-w-44 max-w-60 flex-1">
            <label
              class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5"
            >
              Precio
              <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"
              >
                <DollarSign
                  :size="16"
                  class="text-neutral-800"
                />
              </div>
              <input
                v-model="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full pl-10 pr-4 py-3 border rounded-xl
                       text-sm bg-neutral-100 text-neutral-800
                       font-medium transition-all
                       focus:outline-none focus:ring-1"
              />
            </div>
          </div>

          <!-- Solo informativo: se calcula con la receta -->
          <div class="min-w-44 max-w-60 flex-1">
            <label
              class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5"
            >
              Precio de elaboración
            </label>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"
              >
                <DollarSign
                  :size="16"
                  class="text-neutral-800"
                />
              </div>
              <input
                type="text"
                readonly
                tabindex="-1"
                :value="precioFabricacion.toFixed(2)"
                class="w-full pl-10 pr-4 py-3 border rounded-xl
                       text-sm bg-neutral-200 text-neutral-700
                       font-medium cursor-default
                       focus:outline-none"
              />
            </div>
          </div>

        </div>

        <!-- Receta -->
        <div class="px-8 pt-6 pb-8 flex flex-col items-center">
          <label class="block text-xs text-center font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Pulsa el boton para ver o editar la receta</label>
          <button
          type="button"
          class="bg-primary-600 hover:bg-primary-700
                 active:bg-primary-800 text-neutral-50
                 py-3 px-7 rounded-xl shadow-xl
                 disabled:bg-neutral-300
                 disabled:text-neutral-500
                 disabled:cursor-not-allowed
                 disabled:shadow-none"
          @click="recipeEnable = true">
            Receta
          </button>
        </div>
      </div>

      <!-- Botones -->
      <div
        class="flex justify-between py-4 px-10
               bg-neutral-100 border-t border-neutral-200"
      >
        <button
          type="button"
          class="bg-neutral-50 hover:bg-neutral-200
                 active:bg-neutral-300 border border-neutral-200
                 text-secondary-700 py-3 px-7 rounded-xl shadow-xl"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="!validate"
          class="bg-primary-600 hover:bg-primary-700
                 active:bg-primary-800 text-neutral-50
                 py-3 px-7 rounded-xl shadow-xl
                 disabled:bg-neutral-300
                 disabled:text-neutral-500
                 disabled:cursor-not-allowed
                 disabled:shadow-none"
          @click="save"
          >
          Guardar
        </button>
      </div>
    </div>

    <!-- Editor de receta (agregar / quitar productos) -->
    <DishesRecipeModal
      v-if="recipeEnable && !isAction"
      :recipe="recipe"
      @close="recipeEnable = false"
      @confirm="aplicarReceta"
    />

    <!-- Ver receta (solo lectura) -->
    <div v-if="isAction" class="flex flex-col w-full h-full max-h-150 max-w-2xl rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden ml-8">
      <div class="flex items-start justify-between border-b border-neutral-200 p-4 shrink-0">
        <div>
          <h2 class="text-secondary-800 text-2xl font-bold">Receta</h2>
          <p class="text-neutral-700">Productos utilizados en el platillo</p>
        </div>

        <button
          type="button"
          aria-label="Cerrar modal"
          class="ml-4 shrink-0 rounded-lg p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-secondary-800"
          @click="emit('close')"
        >
          <X :size="22" />
        </button>
      </div>
      <div class="p-6 flex-1 min-h-0">
        <div class="border border-neutral-200 rounded-xl overflow-hidden h-full">
          <div class="h-full overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-neutral-100">
                <tr>
                  <th class="text-left px-4 py-3">Producto</th>
                  <th class="text-center px-4 py-3">Cantidad</th>
                  <th class="text-left px-4 py-3">Unidad de medida</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in recipe" :key="item.product.id" class="border-t border-neutral-200">
                  <td class="px-4 py-3">{{item.product.description}}</td>
                  <td class="px-4 py-3 text-center">{{item.quantity}}</td>
                  <td class="px-4 py-3">{{item.product.measureUnit}}</td>
                </tr>
                <tr v-if="recipe.length===0">
                  <td colspan="3" class="px-4 py-8 text-center text-neutral-500">No hay productos en la receta.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="p-6 pt-0 shrink-0 flex justify-center">
        <button
          type="button"
          class="w-full max-w-50 bg-primary-600 hover:bg-primary-500 active:bg-primary-400 text-white py-3 rounded-xl disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed
          flex flex-row gap-2 justify-center"
          @click="exportarPdf"
        >
          <FileText :size="24" class=" text-neutral-50"/>
          Exportar PDF
        </button>
      </div>
    </div>

    <!-- Modal de eliminar -->
    <div
      v-if="firstDeleteModel"
      class="w-full max-w-120 flex flex-col rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden m-8"
    >

      <!-- Encabezado -->
      <div class="bg-red-500 text-neutral-50 text-2xl text-center font-bold p-2">
        Eliminar Platillo
      </div>

      <!-- Contenido -->
      <div class="bg-neutral-50 flex flex-col items-center text-center px-8 pt-4">
        <OctagonAlert :size="80" class="text-red-500"/>
        <h2 class="text-red-500 font-bold text-xl pt-4">
          ATENCIÓN
        </h2>
        <p class="text-secondary-700">
          Estás tratando de eliminar el platillo:
          <span class="font-bold text-secondary-800">
            {{ name }}
          </span>
          <br />
          ¿Estás seguro que deseas realizar esta acción?
        </p>
      </div>
      <!-- Botones -->
      <div
        class="bg-neutral-50 flex justify-between px-8 pt-4 pb-4">
        <button
          type="button"
          class="bg-neutral-50 hover:bg-neutral-200
                 border hover:border-primary-600
                 active:bg-neutral-300 border-neutral-200
                 text-primary-600 py-3 px-7
                 rounded-xl shadow-xl"
          @click="emit('close')"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="bg-red-500 hover:bg-red-600
                 active:bg-red-700 border-neutral-200
                 text-neutral-50 py-3 px-7
                 rounded-xl shadow-xl"
          @click="changeDeleteModal"
        >
          Confirmar
        </button>
      </div>
    </div>

    <DeleteModal
      v-if="reasonModalEnable"
      @cancelar="emit('close')"
      @confirmar="confirmDelete"
    />
  </div>
</template>