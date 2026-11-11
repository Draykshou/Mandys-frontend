<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { DollarSign, OctagonAlert, FileText, X } from 'lucide-vue-next'
import type { Combo, CreateCombo, UpdateCombo } from '@/types/CombosDtos'
import DeleteModal from '@/components/modals/DeleteModal.vue'
import CombosContentModal from '@/components/modals/CombosContentModal.vue'
import { precioTotal, type ComboItem } from '@/utils/comboPricing'

const emit = defineEmits<{
  close: []
  insert: [string, number, CreateCombo['dishes'], CreateCombo['products']]
  update: [string, number, UpdateCombo['dishes'], UpdateCombo['products']]
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
    combo?: Combo
  }>(),
  {
    isInsert: false,
    isDelete: false,
    isAction: false
  }
)

const name = ref(props.combo?.name ?? '')
const price = ref<number | null>(props.combo?.price ?? null)

const comboItems = ref<ComboItem[]>([])

const firstDeleteModel = ref(props.isDelete ?? '')
const reasonModalEnable = ref(false)
const contentEnable = ref(false)

const validate = computed(() => {
  return (
    name.value.trim() !== '' &&
    price.value !== null &&
    price.value >= 0 &&
    comboItems.value.length > 0
  )
})

// Precio de elaboración: suma de precio × cantidad de cada elemento del combo (solo informativo).
const precioElaboracion = computed(() => precioTotal(comboItems.value))

// El editor devuelve el contenido confirmado: se aplica y se vuelve al primer modal.
const aplicarContenido = (nuevos: ComboItem[]) => {
  comboItems.value = nuevos
  contentEnable.value = false
}

// Con el editor abierto, un clic en el fondo no cierra todo (se perderían los cambios).
const cerrarPorFondo = () => {
  if (contentEnable.value) return
  emit('close')
}

const save = () => {
  if (price.value === null) return

  const dishesRequest = comboItems.value
    .filter(item => item.type === 'dish')
    .map(item => ({
      dishId: item.id,
      quantity: item.quantity
    }))

  const productsRequest = comboItems.value
    .filter(item => item.type === 'product')
    .map(item => ({
      productId: item.id,
      quantity: item.quantity
    }))

  if (props.isInsert) {
    emit(
      'insert',
      name.value,
      price.value,
      dishesRequest,
      productsRequest
    )
  } else {
    emit(
      'update',
      name.value,
      price.value,
      dishesRequest,
      productsRequest
    )
  }
}

const confirmDelete = (reason: string) => {
  console.log('Deletion reason:', reason)
  reasonModalEnable.value = false
  emit('delete', reason)
}

const loadComboItems = () => {
  if (!props.combo) return

  comboItems.value = [
    ...props.combo.dishes.map(item => ({
      type: 'dish' as const,
      id: item.dish.id,
      name: item.dish.name,
      quantity: item.quantity,
      dish: item.dish
    })),
    ...props.combo.products
      .filter(item => !item.product.isSupply)
      .map(item => ({
        type: 'product' as const,
        id: item.product.id,
        name: item.product.description,
        quantity: item.quantity,
        product: item.product
      }))
  ]
}

const changeDeleteModal = () => {
  reasonModalEnable.value = true
  firstDeleteModel.value = false
}

const exportarPdf = async () => {
  const { jsPDF } = await import('jspdf')
  const { autoTable } = await import('jspdf-autotable')
  const { PDF_HEADER_FILL, pintarLogoMandys } = await import('@/utils/pdfBranding')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  // Logo de Mandy's en el header superior derecho.
  await pintarLogoMandys(doc)

  doc.setFontSize(14)
  doc.text(`Contenido del combo: ${name.value || 'Combo'}`, 40, 40)
  doc.setFontSize(10)
  doc.setTextColor(110, 110, 110)
  doc.text(`Precio: $${Number(price.value ?? 0).toFixed(2)}`, 40, 58)
  doc.text(`Exportado el ${new Date().toLocaleDateString('es-MX')}`, 40, 72)

  autoTable(doc, {
    startY: 86,
    head: [['Elemento', 'Tipo', 'Cantidad']],
    body: comboItems.value.map((item) => [
      item.name,
      item.type === 'dish' ? 'Platillo' : 'Producto',
      String(item.quantity),
    ]),
    styles: { fontSize: 9, cellPadding: 6, textColor: [30, 30, 30] },
    headStyles: { fillColor: PDF_HEADER_FILL, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 40, right: 40 },
  })

  const base = (name.value || 'combo')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `${base || 'combo'}.pdf`
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
}


onMounted(() => {
  loadComboItems()
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
    @click.self="cerrarPorFondo"
  >
    <!-- Modal principal -->
    <div
      v-if="!isDelete && !isAction"
      v-show="!contentEnable"
      class="flex flex-col rounded-2xl shadow-2xl w-full max-w-xl bg-neutral-50 overflow-hidden"
      style="max-height: 92vh;"
    >
      <div class="border-b border-neutral-200 p-4">
        <h1 class="text-secondary-800 text-2xl font-bold">{{ props.modalTitle }}</h1>
        <p class="text-neutral-700">{{ props.modalSubtitle }}</p>
      </div>

      <div>
        <div class="px-8 pt-4">
          <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
            Nombre del combo
            <span class="text-red-500">*</span>
          </label>
          <input
            v-model="name"
            type="text"
            maxlength="50"
            placeholder="Ej. Combo familiar"
            class="w-full px-4 py-3 border rounded-xl text-sm bg-neutral-100 text-neutral-800 placeholder-neutral-300 font-medium transition-all focus:outline-none focus:ring-1"
          />
        </div>

        <div class="flex flex-wrap gap-4 px-8 pt-4">
          <div class="min-w-44 max-w-60 flex-1">
            <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
              Precio
              <span class="text-red-500">*</span>
            </label>

            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <DollarSign :size="16" class="text-neutral-800" />
              </div>

              <input
                v-model="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full pl-10 pr-4 py-3 border rounded-xl text-sm bg-neutral-100 text-neutral-800 font-medium transition-all focus:outline-none focus:ring-1"
              />
            </div>
          </div>

          <!-- Solo informativo: se calcula con el contenido -->
          <div class="min-w-44 max-w-60 flex-1">
            <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
              Precio de elaboración
            </label>

            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <DollarSign :size="16" class="text-neutral-800" />
              </div>

              <input
                type="text"
                readonly
                tabindex="-1"
                :value="precioElaboracion.toFixed(2)"
                class="w-full pl-10 pr-4 py-3 border rounded-xl text-sm bg-neutral-200 text-neutral-700 font-medium cursor-default focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div class="px-8 pt-6 pb-8 flex flex-col items-center">
          <label class="block text-xs text-center font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
            Pulsa el botón para ver o editar el contenido del combo
          </label>

          <button
            type="button"
            class="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-neutral-50 py-3 px-7 rounded-xl shadow-xl"
            @click="contentEnable = true"
          >
            Contenido
          </button>
        </div>
      </div>

      <div class="flex justify-between py-4 px-10 bg-neutral-100 border-t border-neutral-200">
        <button
          type="button"
          class="bg-neutral-50 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-200 text-secondary-700 py-3 px-7 rounded-xl shadow-xl"
          @click="emit('close')"
        >
          Cancelar
        </button>

        <button
          type="button"
          :disabled="!validate"
          class="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-neutral-50 py-3 px-7 rounded-xl shadow-xl disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:shadow-none"
          @click="save"
        >
          Guardar
        </button>
      </div>
    </div>

    <!-- Editor de contenido (agregar / quitar platillos y productos) -->
    <CombosContentModal
      v-if="contentEnable && !isAction"
      :items="comboItems"
      @close="contentEnable = false"
      @confirm="aplicarContenido"
    />

    <!-- Ver contenido (solo lectura) -->
    <div
      v-if="isAction"
      class="flex flex-col w-full max-w-2xl h-full max-h-170 rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden ml-6"
    >
      <div class="flex items-start justify-between border-b border-neutral-200 p-4 shrink-0">
        <div>
          <h2 class="text-secondary-800 text-2xl font-bold">
            Contenido del combo
          </h2>

          <p class="text-neutral-700">
            Platillos y productos incluidos en el combo
          </p>
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
        <div class="border border-neutral-200 rounded-xl overflow-hidden">
          <div class="max-h-80 overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-neutral-100">
                <tr>
                  <th class="text-left px-4 py-3">
                    Elemento
                  </th>

                  <th class="text-center px-4 py-3">
                    Cantidad
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="item in comboItems"
                  :key="`${item.type}-${item.id}`"
                  class="border-t border-neutral-200"
                >
                  <td class="px-4 py-3"> {{ item.name }} </td>
                  <td class="px-4 py-3 text-center"> {{ item.quantity }} </td>
                </tr>

                <tr v-if="comboItems.length === 0">
                  <td
                    colspan="2"
                    class="px-4 py-8 text-center text-neutral-500"
                  >
                    No hay elementos en el combo.
                  </td>
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

    <!-- Modal de eliminación -->
    <div
      v-if="firstDeleteModel"
      class="w-full max-w-120 flex flex-col rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden m-8"
    >
      <div class="bg-red-500 text-neutral-50 text-2xl text-center font-bold p-2">
        Eliminar Combo
      </div>

      <div class="bg-neutral-50 flex flex-col items-center text-center px-8 pt-4">
        <OctagonAlert :size="80" class="text-red-500" />

        <h2 class="text-red-500 font-bold text-xl pt-4">
          ATENCIÓN
        </h2>

        <p class="text-secondary-700">
          Estás tratando de eliminar el combo:
          <span class="font-bold text-secondary-800">{{ name }}</span>
          <br />
          ¿Estás seguro que deseas realizar esta acción?
        </p>
      </div>

      <div class="bg-neutral-50 flex justify-between px-8 pt-4 pb-4">
        <button
          type="button"
          class="bg-neutral-50 hover:bg-neutral-200 border hover:border-primary-600 active:bg-neutral-300 border-neutral-200 text-primary-600 py-3 px-7 rounded-xl shadow-xl"
          @click="emit('close')"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="bg-red-500 hover:bg-red-600 active:bg-red-700 border-neutral-200 text-neutral-50 py-3 px-7 rounded-xl shadow-xl"
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