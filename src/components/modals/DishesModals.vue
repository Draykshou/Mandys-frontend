<script setup lang="ts">

import { ref,computed,onMounted } from 'vue'
import { DollarSign,OctagonAlert,Trash2, FileText } from 'lucide-vue-next'
import type { Dish,Recipe,CreateDish,UpdateDish } from '@/types/DishesDtos'
import type { Product } from '@/types/ProductsDtos'
import { getProducts } from '@/service/ProductsService'
import DeleteModal from '@/components/DeleteModal.vue'

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
const productoSeleccionado=ref<Product|null>(null)
const products=ref<Product[]>([])
const productSearch=ref('')
const quantity=ref<number|null>(null)

const reason = ref('')
const recipeEnable = ref(false)
const firstDeleteModel = ref(props.isDelete ?? '')
const reasonModalEnable = ref(false)

const validate = computed(() => {
  return (
    name.value.trim() !== '' &&
    price.value !== null &&
    price.value >= 0
  )
})

const filterProducts = computed ( ()=> {
    const texto=productSearch.value.trim().toLowerCase()
    if(!texto)return[]
    return products.value.filter(product => product.description.toLowerCase().includes(texto))
})

const loadProducts=async()=>{
    try{
        const response=await getProducts(1,50,"","",true)
        products.value=response.items
    }catch(err){
        console.error('No se pudieron cargar los productos:',err)
    }
}


const selectProduct=(product:Product)=>{
    productoSeleccionado.value=product
    productSearch.value=product.description
}

const addProducts=()=>{
    if(!productoSeleccionado.value)return
    if(quantity.value===null||quantity.value<=0)return
    const productoExistente=recipe.value.find(item=>item.product.id===productoSeleccionado.value!.id)
    if(productoExistente){
        productoExistente.quantity=quantity.value
    }else{
        recipe.value.push({
            product:productoSeleccionado.value,
            quantity:quantity.value
        })
    }
    productSearch.value=''
    productoSeleccionado.value=null
    quantity.value=null
}

const deleteProducts=(productId:number)=>{
    recipe.value = recipe.value.filter(item => item.product.id !== productId)
}

const changeDeleteModal = () => {
  reasonModalEnable.value = true
  firstDeleteModel.value = false
}

const save=()=>{
    if(price.value===null)return
    const recipeRequest=recipe.value.map(item=>({
        productId:item.product.id,
        quantity:item.quantity
    }))
    if(props.isInsert){
        emit('insert', name.value, price.value, recipeRequest)
    }else{
        emit('update', name.value, price.value, recipeRequest)
    }
}

const confirmDelete = () => {
  console.log('Motivo de eliminación:', reason.value)
  reasonModalEnable.value = false
  emit('delete', reason.value)
}

onMounted(loadProducts)

</script>

<template>

  <!-- Fondo -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
    @click.self="emit('close')"
  >

    <!-- Modal de insertar / editar -->
    <div
      v-if="!isDelete && !isAction" class="flex flex-col rounded-2xl shadow-2xl w-full max-w-xl bg-neutral-50 overflow-hidden" style="max-height: 92vh;">
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

        <!-- Precio -->
        <div class="px-8 pt-4">

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
              class="w-full max-w-60 pl-10 pr-4 py-3 border rounded-xl
                     text-sm bg-neutral-100 text-neutral-800
                     font-medium transition-all
                     focus:outline-none focus:ring-1"
            />
          </div>
        </div>

        <!-- Receta -->
        <div class="px-8 pt-6 pb-8 flex flex-col items-center">
          <label class="block text-xs text-center font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Pulsa el boton para ver o editar la receta la receta</label>
          <button
          type="button"
          class="bg-primary-600 hover:bg-primary-700
                 active:bg-primary-800 text-neutral-50
                 py-3 px-7 rounded-xl shadow-xl
                 disabled:bg-neutral-300
                 disabled:text-neutral-500
                 disabled:cursor-not-allowed
                 disabled:shadow-none"
          @click="recipeEnable = !recipeEnable">
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

    <!-- Modal de tabla -->
    <div v-if="recipeEnable || isAction" class="flex flex-col w-full h-full max-h-150 max-w-2xl rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden ml-8">
      <div class="border-b border-neutral-200 p-4 shrink-0">
          <h2 class="text-secondary-800 text-2xl font-bold">Receta</h2>
          <p class="text-neutral-700">Productos utilizados en el platillo</p>
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
                              <th class="w-16 px-4 py-3"></th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="item in recipe" :key="item.product.id" class="border-t border-neutral-200">
                              <td class="px-4 py-3">{{item.product.description}}</td>
                              <td class="px-4 py-3 text-center">{{item.quantity}}</td>
                              <td class="px-4 py-3">{{item.product.measureUnit}}</td>
                              <td class="px-4 py-3 text-center">
                                  <button v-if="!isAction" 
                                    type="button" 
                                    class="text-red-500 hover:text-red-700" 
                                    @click="deleteProducts(item.product.id)">
                                      <Trash2 :size="18"/>
                                  </button>
                              </td>
                          </tr>
                          <tr v-if="recipe.length===0">
                              <td colspan="4" class="px-4 py-8 text-center text-neutral-500">No hay productos en la receta.</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      <div class="p-6 pt-0 shrink-0">
          <div class="space-y-3">
              <div class="flex gap-3">
                  <div class="flex-1 relative">
                      <input 
                        v-if="!isAction"
                        v-model="productSearch" 
                        type="text" placeholder="Buscar producto..." 
                        class="w-full px-4 py-3 border rounded-xl"/>
                      <div v-if="filterProducts.length>0" class="absolute z-20 w-full bottom-full mb-1 bg-white border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                          <button 
                            v-for="product in filterProducts" 
                            :key="product.id" 
                            type="button" 
                            class="w-full text-left px-4 py-2 hover:bg-neutral-100" 
                            @click="selectProduct(product)">
                            {{product.description}}
                          </button>
                      </div>
                  </div>
                  <input v-if="!isAction" v-model="quantity" type="number" min="1" step="1" placeholder="Cantidad" class="w-32 px-4 py-3 border rounded-xl"/>
              </div>
              <div class="flex justify-center">
                <button 
                  v-if="!isAction"
                  type="button" 
                  class="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white py-3 rounded-xl disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed" 
                  :disabled="!productoSeleccionado||quantity===null||quantity<=0" 
                  @click="addProducts">
                  Agregar producto
                </button>
                <button
                  v-if="isAction"
                  class="w-full max-w-50 bg-primary-600 hover:bg-primary-500 active:bg-primary-400 text-white py-3 rounded-xl disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed
                  flex flex-row gap-2 justify-center"
                >
                  <FileText :size="24" class=" text-neutral-50"/>
                  Exportar PDF
                </button>
              </div>
          </div>
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
