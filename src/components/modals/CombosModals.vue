```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { DollarSign, OctagonAlert, Trash2 } from 'lucide-vue-next'
import type { Combo, CreateCombo, UpdateCombo } from '@/types/CombosDtos'
import type { Dish } from '@/types/DishesDtos'
import type { Product } from '@/types/ProductsDtos'
import { getProducts } from '@/service/ProductsService'
import { getDishes } from '@/service/DishesService'
import DeleteModal from '@/components/DeleteModal.vue'

interface ComboItem {
  type: 'dish' | 'product'
  id: number
  name: string
  quantity: number
  dish?: Dish
  product?: Product
}

const emit = defineEmits<{
  close: []
  insert: [string, number, CreateCombo['dishes'], CreateCombo['products']]
  update: [string, number, UpdateCombo['dishes'], UpdateCombo['products']]
  delete: [string]
}>()

const props = withDefaults(
  defineProps<{
    isInsert?: boolean
    isDelete?: boolean
    modalTitle?: string
    modalSubtitle?: string
    combo?: Combo
  }>(),
  {
    isInsert: false,
    isDelete: false
  }
)

const name = ref(props.combo?.name ?? '')
const price = ref<number | null>(props.combo?.price ?? null)

const availableDishes = ref<Dish[]>([])
const availableProducts = ref<Product[]>([])
const comboItems = ref<ComboItem[]>([])

const search = ref('')
const selectedItem = ref<ComboItem | null>(null)
const quantity = ref<number | null>(null)

const reasonModalEnable = ref(false)
const contentEnable = ref(false)

const validate = computed(() => {
  return (
    name.value.trim() !== '' &&
    price.value !== null &&
    price.value >= 0
  )
})

const filteredItems = computed(() => {
  const texto = search.value.trim().toLowerCase()

  if (!texto) return []

  const dishes = availableDishes.value
    .filter(dish => dish.name.toLowerCase().includes(texto))
    .map(dish => ({
      type: 'dish' as const,
      id: dish.id,
      name: dish.name,
      quantity: 1,
      dish
    }))

  const products = availableProducts.value
    .filter(product => product.description.toLowerCase().includes(texto))
    .map(product => ({
      type: 'product' as const,
      id: product.id,
      name: product.description,
      quantity: 1,
      product
    }))

  return [...dishes, ...products]
})

const loadDishes = async () => {
  try {
    const response = await getDishes()
    availableDishes.value = response.items
  } catch (err) {
    console.error('No se pudieron cargar los platillos:', err)
  }
}

const loadProducts = async () => {
  try {
    const response = await getProducts(1, 50, "", "description", false)

    availableProducts.value = response.items.filter(
      product => !product.isSupply
    )
  } catch (err) {
    console.error('No se pudieron cargar los productos:', err)
  }
}

const selectItem = (item: ComboItem) => {
  selectedItem.value = item
  search.value = item.name
}

const addItem = () => {
  if (!selectedItem.value) return
  if (quantity.value === null || quantity.value <= 0) return

  const itemExistente = comboItems.value.find(
    item =>
      item.type === selectedItem.value!.type &&
      item.id === selectedItem.value!.id
  )

  if (itemExistente) {
    itemExistente.quantity = quantity.value
  } else {
    comboItems.value.push({
      ...selectedItem.value,
      quantity: quantity.value
    })
  }

  search.value = ''
  selectedItem.value = null
  quantity.value = null
}

const deleteItem = (item: ComboItem) => {
  comboItems.value = comboItems.value.filter(
    current =>
      !(current.type === item.type && current.id === item.id)
  )
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

const confirmDelete = (motivo: string) => {
  console.log('Motivo de eliminación:', motivo)
  reasonModalEnable.value = false
  emit('delete', motivo)
}

const loadComboItems = () => {
  if (!props.combo) return

  comboItems.value = [
    ...props.combo.dishes.map(dish => ({
      type: 'dish' as const,
      id: dish.id,
      name: dish.name,
      quantity: 1,
      dish
    })),
    ...props.combo.products
      .filter(product => !product.isSupply)
      .map(product => ({
        type: 'product' as const,
        id: product.id,
        name: product.description,
        quantity: 1,
        product
      }))
  ]
}

onMounted(() => {
  loadDishes()
  loadProducts()
  loadComboItems()
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
    @click.self="emit('close')"
  >
    <!-- Modal principal -->
    <div
      v-if="!isDelete"
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

        <div class="px-8 pt-4">
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
              class="w-full max-w-60 pl-10 pr-4 py-3 border rounded-xl text-sm bg-neutral-100 text-neutral-800 font-medium transition-all focus:outline-none focus:ring-1"
            />
          </div>
        </div>

        <div class="px-8 pt-6 pb-8 flex flex-col items-center">
          <label class="block text-xs text-center font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
            Pulsa el botón para ver o editar el contenido del combo
          </label>

          <button
            type="button"
            class="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-neutral-50 py-3 px-7 rounded-xl shadow-xl"
            @click="contentEnable = !contentEnable"
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

    <!-- Modal de contenido -->
    <div
      v-if="!isDelete && contentEnable"
      class="flex flex-col w-full max-w-2xl h-full max-h-170 rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden ml-6"
    >
      <div class="border-b border-neutral-200 p-4 shrink-0">
        <h2 class="text-secondary-800 text-2xl font-bold">
          Contenido del combo
        </h2>

        <p class="text-neutral-700">
          Platillos y productos incluidos en el combo
        </p>
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

                  <th class="w-16 px-4 py-3"></th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="item in comboItems"
                  :key="`${item.type}-${item.id}`"
                  class="border-t border-neutral-200"
                >
                  <td class="px-4 py-3">
                    {{ item.name }}
                  </td>

                  <td class="px-4 py-3 text-center">
                    {{ item.quantity }}
                  </td>

                  <td class="px-4 py-3 text-center">
                    <button
                      type="button"
                      class="text-red-500 hover:text-red-700"
                      @click="deleteItem(item)"
                    >
                      <Trash2 :size="18" />
                    </button>
                  </td>
                </tr>

                <tr v-if="comboItems.length === 0">
                  <td
                    colspan="3"
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

      <div class="p-6 pt-0 shrink-0">
        <div class="space-y-3">
          <div class="flex gap-3">
            <div class="flex-1 relative">
              <input
                v-model="search"
                type="text"
                placeholder="Buscar platillo o producto..."
                class="w-full px-4 py-3 border rounded-xl"
              />

              <div
                v-if="filteredItems.length > 0"
                class="absolute z-20 w-full bottom-full mb-1 bg-white border rounded-xl shadow-lg max-h-40 overflow-y-auto"
              >
                <button
                  v-for="item in filteredItems"
                  :key="`${item.type}-${item.id}`"
                  type="button"
                  class="w-full text-left px-4 py-2 hover:bg-neutral-100"
                  @click="selectItem(item)"
                >
                  {{ item.name }}
                </button>
              </div>
            </div>

            <input
              v-model="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Cantidad"
              class="w-32 px-4 py-3 border rounded-xl"
            />
          </div>

          <button
            type="button"
            class="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white py-3 rounded-xl disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed"
            :disabled="!selectedItem || quantity === null || quantity <= 0"
            @click="addItem"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de eliminación -->
    <div
      v-if="isDelete && !reasonModalEnable"
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
          @click="reasonModalEnable = true"
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
```
