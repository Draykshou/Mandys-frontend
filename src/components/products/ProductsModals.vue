<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import DeleteModal from '@/components/modals/DeleteModal.vue'
import { DollarSign, OctagonAlert } from 'lucide-vue-next';

const emit = defineEmits<{
  close: []
  insert: [string, boolean, number, string, File | null]
  update: [string, boolean, number, string, File | null]
  delete: [string]
}>()

const props = withDefaults(
  defineProps<{
    isInsert?: boolean
    isDelete?: boolean

    modalTitle?: string
    modalSubtitle?: string

    description?: string
    isSupply?: boolean
    salePrice?: number
    measureUnit?: string
    imageUrl?: string | null
  }>(),
  {
    isInsert: false,
    isDelete: false
  }
)

const isInsert = ref(props.isInsert ?? '')

const description = ref(props.description ?? '')
const isSupply = ref(props.isSupply ?? '')
const salePrice = ref<number | null>(props.salePrice ?? null)
const measureUnit = ref(props.measureUnit ?? '')
const imagePreview = ref<string | null>(props.imageUrl ?? null);


const reason = ref('')
const firstDeleteModel = ref(props.isDelete ?? '')
const reasonModalEnable = ref(false)

// Imagen
const fileInput = ref<HTMLInputElement | null>(null);
const selectedImage = ref<File | null>(null);


const handleImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  selectedImage.value = file;

  // Liberar URL anterior si era una vista previa local
  if (imagePreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value);
  }

  imagePreview.value = URL.createObjectURL(file);
}

const openFileSelector = () => {
  fileInput.value?.click();
}

const validate = computed(() => {
  return (
    description.value.trim() !== '' &&
    measureUnit.value !== '' &&
    (isSupply.value || (salePrice.value !== null && salePrice.value !== undefined && salePrice.value > 0))
  )
})

watch(isSupply, (newValue) => {
  if (newValue) {
    salePrice.value = 0
    measureUnit.value = ''
  } else {
    measureUnit.value = 'Unidades'
  }
}, { immediate: true })

const confirmDelete = () => {
  reasonModalEnable.value = false
  console.log('Motivo de eliminación:', reason.value)
  emit('delete', reason.value)
}

const changeDeleteModal = () => {
  reasonModalEnable.value = true
  firstDeleteModel.value = false
}

</script>

<template>
  <!-- Fondo -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);" @click.self="emit('close')">


    <div v-if="!isDelete" class="flex flex-col rounded-2xl shadow-2xl w-full max-w-2xl bg-neutral-50 overflow-hidden"
      style="max-height: 92vh;">

      <!-- Encabezado del modal -->
      <div class="border-b border-neutral-200 p-4">
        <h1 class="text-secondary-800 text-2xl font-bold">{{ props.modalTitle }}</h1>
        <p class="text-neutral-700">{{ props.modalSubtitle }}</p>
      </div>

      <!-- Componentes del modal -->

      <div class="pb-4">
        <!-- Campo de texto -->
        <div class="px-8 pt-4">
          <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
            Nombre del producto
            <span class="text-red-500">*</span>
          </label>
          <input v-model="description" type="text" maxlength="50" placeholder="Ej. Tacos de Rib Eye con Tuétano"
            class="w-full px-4 py-3 border rounded-xl text-sm bg-neutral-100 text-neutral-800 placeholder-neutral-300 font-medium transition-all focus:outline-none focus:ring-1" />
        </div>

        <!-- Unidad de medida -->
        <div class="px-8 pt-4">
          <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
            Unidad de medida
            <span class="text-red-500">*</span>
          </label>

          <select v-model="measureUnit" class="w-full max-w-60 px-4 py-3 border rounded-xl text-sm
                    bg-neutral-100 text-neutral-800 font-medium
                    transition-all focus:outline-none focus:ring-1
                    focus:ring-primary-700">
            <option disabled value="">
              Selecciona una unidad
            </option>

            <option v-if="isSupply" value="Kilogramos">Kilogramos</option>
            <option v-if="isSupply" value="Litros">Litros</option>
            <option value="Unidades">Unidades</option>
          </select>
        </div>

        <!-- campo booleano -->
        <div class="flex items-end justify-start px-8 pt-4 gap-4">

          <!-- Checkbox -->
          <label class="px-4 py-3 rounded-xl flex items-center gap-4 bg-neutral-100 cursor-pointer">
            <input v-model="isSupply" type="checkbox"
              class="h-5 w-5 rounded border-neutral-300 accent-primary-600 focus:ring-primary-700" />
            <span class="text-xs font-bold text-neutral-600 tracking-wider">
              ¿Este producto es un insumo?
            </span>
          </label>

          <!-- Precio de venta -->
          <div v-if="!isSupply">
            <div class="relative">
              <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Precio de venta<span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <DollarSign :size="16" class="text-neutral-800" />
                </div>
                <input v-model="salePrice" type="number" step="0.01" min="0" placeholder="0.00" :disabled="isSupply"
                  class="w-full max-w-60 pl-10 pr-4 py-3 border rounded-xl text-sm bg-neutral-100 text-neutral-800 font-medium transition-all focus:outline-none focus:ring-1" />
              </div>
            </div>
          </div>
        </div>

        <!-- Imagen -->
        <div class="flex flex-col px-8 py-4">
          <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
            Imagen<span class="text-red-500">*</span>
          </label>

          <div class="flex items-center gap-4">

            <!-- Input oculto -->
            <input ref="fileInput" type="file" accept="image/png, image/jpeg, image/webp" class="hidden"
              @change="handleImageChange" />

            <!-- Botón para seleccionar -->
            <button type="button" @click="openFileSelector" class="px-4 py-3 border rounded-xl text-sm
             bg-neutral-100 text-neutral-800 font-medium
             hover:bg-neutral-200 transition-all">
              {{ imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen' }}
            </button>

            <!-- Vista previa -->
            <div v-if="imagePreview" class="h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-neutral-300">
              <img :src="imagePreview" alt="Vista previa del producto" class="h-full w-full object-cover" />
            </div>

            <span v-else class="text-xs text-neutral-400">
              Ninguna imagen seleccionada
            </span>

          </div>
        </div>
      </div>

      <!-- Botones de cancelar y guardar-->

      <div class="flex justify-between py-4 px-10 bg-neutral-100 border-t border-neutral-200">
        <button
          class="bg-neutral-50 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-200 text-secondary-700 py-3 px-7 rounded-xl shadow-xl"
          @click="emit('close')">
          Cancelar
        </button>
        <button :disabled="!validate" class="bg-primary-600 hover:bg-primary-700 active:bg-primary-800
                  text-neutral-50 py-3 px-7 rounded-xl shadow-xl
                  disabled:bg-neutral-300
                  disabled:text-neutral-500
                  disabled:cursor-not-allowed
                  disabled:shadow-none" @click="isInsert
                    ? emit('insert', description, isSupply, salePrice as number, measureUnit, selectedImage)
                    : emit('update', description, isSupply, salePrice as number, measureUnit, selectedImage)">
          Guardar
        </button>
      </div>
    </div>

    <!-- Modal de eliminar -->

    <div v-if="firstDeleteModel"
      class="w-full max-w-120 flex flex-col rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden m-8">
      <div class="bg-red-500 text-neutral-50 text-2xl text-center font-bold p-2">
        Eliminar Producto
      </div>

      <div class="bg-neutral-50 flex flex-col items-center text-center px-8 pt-4">
        <OctagonAlert :size="80" class="text-red-500" />
        <h2 class="text-red-500 font-bold text-xl pt-4">ATENCION</h2>
        <p class="text-secondary-700">Estas tratando de eliminar el producto: <span
            class="font-bold text-secondary-800">{{ description }}</span>
          ¿Estas seguro que deseas realizar esta acción?</p>
      </div>

      <div class="bg-neutral-50 flex justify-between px-8 pt-4 pb-4">
        <button
          class="bg-neutral-50 hover:bg-neutral-200 border hover:border-primary-600 active:bg-neutral-300 border-neutral-200 text-primary-600 py-3 px-7 rounded-xl shadow-xl"
          @click="emit('close')">
          Cancelar
        </button>
        <button
          class="bg-red-500 hover:bg-red-600 border hover:border-secondary-600 active:bg-red-700 hover border-neutral-200 text-neutral-50 py-3 px-7 rounded-xl shadow-xl"
          @click="changeDeleteModal">
          Confirmar
        </button>
      </div>
    </div>

    <DeleteModal v-if="reasonModalEnable" @cancelar="emit('close')" @confirmar="confirmDelete" />
  </div>
</template>