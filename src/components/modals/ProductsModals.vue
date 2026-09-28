<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { DollarSign } from 'lucide-vue-next';
import { OctagonAlert } from 'lucide-vue-next';

const emit = defineEmits<{
  close: []
  insert: [string, boolean, number, string]
  update: [string, boolean, number, string]
  delete: []
}>()

const props = withDefaults(  
  defineProps<{
    isInsert?: boolean
    isDelete?: boolean

    modalTitle?: string
    modalSubtitle?: string

    description?: string
    isSupply?: boolean
    price?: number
    measureUnit?: string
    salePrice?: number
  }>(),
  {
    isInsert: false,
    isDelete: false
  }
)

const isInsert = ref(props.isInsert ?? '')

const description = ref(props.description?? '')
const isSupply = ref(props.isSupply ?? '')
const price = ref<number | null>(props.price ?? null)
const measureUnit = ref(props.measureUnit ?? '')
const salePrice = ref(props.salePrice ?? '')

const validate = computed(() => {
  return (
    description.value.trim() !== '' &&
    price.value !== null &&
    price.value !== undefined &&
    measureUnit.value !== '' &&
    (isSupply.value || (
      salePrice.value !== '' &&
      salePrice.value !== null &&
      salePrice.value !== undefined
    ))
  )
})

watch(isSupply, (newValue) => {
  if (newValue) {
    salePrice.value = ""
  }
})

</script>

<template>
    <!-- Fondo -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
      @click.self="emit('close')"
    >

      
      <div 
      v-if="!isDelete"
      class="flex flex-col rounded-2xl shadow-2xl w-full max-w-2xl bg-neutral-50 overflow-hidden" style="max-height: 92vh;">

        <!-- Encabezado del modal -->
        <div class="border-b border-neutral-200 p-4">
          <h1 class="text-secondary-800 text-2xl font-bold">{{ props.modalTitle }}</h1>
          <p class="text-neutral-700">{{ props.modalSubtitle }}</p>
        </div>

        <!-- Componentes del modal -->

        <div>
          <!-- Campo de texto -->
          <div class="px-8 pt-4">
            <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                  Nombre del platillo
                  <span class="text-red-500">*</span>
            </label>
            <input
              v-model="description"
              type="text"
              maxlength="50"
              placeholder="Ej. Tacos de Rib Eye con Tuétano"
              class="w-full px-4 py-3 border rounded-xl text-sm bg-neutral-100 text-neutral-800 placeholder-neutral-300 font-medium transition-all focus:outline-none focus:ring-1"
            />
          </div>

          <!-- Campo numerico -->
          <div class="px-8 pt-4">
            <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Precio por unidad
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
                class="w-full max-w-60 pl-10 pr-4 py-3 border rounded-xl text-sm bg-neutral-100 text-neutral-800 font-medium transition-all focus:outline-none focus:ring-1"
                />
            </div>
          </div>

          <div class="px-8 pt-4">
            <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
              Unidad de medida
              <span class="text-red-500">*</span>
            </label>

            <select
              v-model="measureUnit"
              class="w-full max-w-60 px-4 py-3 border rounded-xl text-sm
                    bg-neutral-100 text-neutral-800 font-medium
                    transition-all focus:outline-none focus:ring-1
                    focus:ring-primary-700"
            >
              <option disabled value="">
                Selecciona una unidad
              </option>

              <option value="kg">Kilogramos</option>
              <option value="g">Gramos</option>
              <option value="l">Litros</option>
              <option value="ml">Mililitros</option>
              <option value="pz">Piezas</option>
            </select>
          </div>
                
          <!-- campo booleano -->
          <div class="flex items-end justify-start mx-8 gap-4">
            <label class="max-w-100 px-8 py-4 my-8 rounded-xl flex items-center gap-4 bg-neutral-100 cursor-pointer">
              <input
                v-model="isSupply"
                type="checkbox"
                class="h-5 w-5 rounded border-neutral-300 accent-primary-600 focus:ring-primary-700"
              />
              <span class="text-xs font-bold text-neutral-600 tracking-wider">
                Este producto es un insumo?
              </span>
            </label>

            <div class="my-8">
              <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                Precio de venta
                <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <DollarSign :size="16" class="text-neutral-800" />
                </div>
                <input
                  v-model="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  :disabled="isSupply"
                  class="w-full max-w-60 pl-10 pr-4 py-3 border rounded-xl text-sm bg-neutral-100 text-neutral-800 font-medium transition-all focus:outline-none focus:ring-1"
                  />
              </div>
            </div>
          </div>
        </div>

        <!-- Botones de cancelar y guardar-->

        <div class="flex justify-between py-4 px-10 bg-neutral-100 border-t border-neutral-200">
          <button 
            class="bg-neutral-50 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-200 text-secondary-700 py-3 px-7 rounded-xl shadow-xl"
            @click="emit('close')"
            >
            Cancelar
          </button>
          <button 
            :disabled="!validate"
            class="bg-primary-600 hover:bg-primary-700 active:bg-primary-800
                  text-neutral-50 py-3 px-7 rounded-xl shadow-xl
                  disabled:bg-neutral-300
                  disabled:text-neutral-500
                  disabled:cursor-not-allowed
                  disabled:shadow-none"
            @click="isInsert
              ? emit('insert', description, isSupply, price as number, measureUnit)
              : emit('update', description, isSupply, price as number, measureUnit)"
          >
            Guardar
          </button>
        </div>
      </div>

      <!-- Modal de eliminar -->

      <div
      v-if="isDelete"
      class="w-full max-w-120 flex flex-col rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden m-8"
      >
        <div class="bg-red-500 text-neutral-50 text-2xl text-center font-bold p-2">
          Eliminar Producto
        </div>

        <div class="bg-neutral-50 flex flex-col items-center text-center px-8 pt-4">
          <OctagonAlert :size="80" class="text-red-500"/>
          <h2 class="text-red-500 font-bold text-xl pt-4">ATENCION</h2>
          <p class="text-secondary-700">Estas tratando de eliminar el producto: <span class="font-bold text-secondary-800">{{ description }}</span>
          ¿Estas seguro que deseas realizar esta acción?</p>
        </div>

        <div class="bg-neutral-50 flex justify-between px-8 pt-4 pb-4">
          <button 
            class="bg-neutral-50 hover:bg-neutral-200 border hover:border-primary-600 active:bg-neutral-300 border-neutral-200 text-primary-600 py-3 px-7 rounded-xl shadow-xl"
            @click="emit('close')"
            >
            Cancelar
          </button>
          <button 
            class="bg-red-500 hover:bg-red-600 border hover:border-secondary-600 active:bg-red-700 hover border-neutral-200 text-neutral-50 py-3 px-7 rounded-xl shadow-xl"
            @click="emit('delete')"
            >
            Confirmar
          </button>
        </div>

      </div>
    </div>
</template>