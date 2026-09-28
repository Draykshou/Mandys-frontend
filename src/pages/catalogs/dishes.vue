<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import { useToast } from '@/composables/useToast'
import type { CatalogColumn, CatalogRow} from '@/types/CatalogColumns/catalog'
import DishesModals from '@/components/modals/DishesModals.vue'

import type { CreateDish, Dish, Dishes, UpdateDish } from '@/types/DishesDtos'
import { postDish, putDish, deleteDish, getDishes } from '@/service/DishesService'
import type { Recipe } from '@/types/CombosDtos'

const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

interface CatalogoDef {
  titulo: string
  subtitulo: string
  textoBoton: string
  categorias: string[]
  columns: CatalogColumn[]
}

const dishes = ref<Dishes | null>(null)

const DishesColumn: CatalogoDef = {
  titulo: 'Platillos',
  subtitulo: 'Gestión de los platillos del restaurante',
  textoBoton: 'Agregar Platillo',
  categorias: ['Todos', 'Bebidas', 'Comida', 'Postres'],
  columns: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'price', label: 'Precio', type: 'currency' },
    { key: 'recipe', label: 'Recetas', type: 'button' },
  ],
}

const pagina = ref(1)
const totalPaginas = ref(1)

// Filtro
const filtro = reactive({
  busqueda: '',
  categoria: DishesColumn.categorias[0],
})


function limpiarFiltro() {
  filtro.busqueda = ''
  filtro.categoria = DishesColumn.categorias[0]
}

function buscar() {
 
}

// CUD
const modalInsertEnable = ref(false)

const currentRow = ref<Dish | null>(null)
const modalUpdateEnable = ref(false)
const modalDeleteEnable = ref(false)

const insertRow = async (name: string, price: number) => {
  const dish: CreateDish = {
    name: name,
    price: price,
    recipe: [{
      productId: 4,
      quantity: 3
    }]
  }

  try {
    const response = await postDish(dish)
    console.log(response)
  } catch (err) {
    console.error("No se pudo crear el disho:", err)
  }
}

const loadRowInformation = (row: CatalogRow) => {
  currentRow.value = {
    id: String(row.id),
    name: String(row.name),
    price: Number(row.price),
    recipe: row.recipe as Dish['recipe']

  }
}

const openModalUpdate = (row: CatalogRow) => {
  loadRowInformation(row)
  modalUpdateEnable.value = true
}

const openModalDelete = (row: CatalogRow) => {
  loadRowInformation(row)
  modalDeleteEnable.value = true
}


const updateRow = async (name: string, price: number) => {
   if (!currentRow.value) {
    return
  }
  const dish: UpdateDish = {
    name: name,
    price: price,
    recipe: [{
      productId: 4,
      quantity: 3
    }]
  }
  console.log("update call", dish)
  try {
    const response = await putDish(currentRow.value?.id as string, dish)
    console.log(response)
    window.location.reload()
  } catch (err) {
    console.error("No se pudo actualizar el disho:", err)
  }
}

const deleteRow = async () => {
  try {
    const response = await deleteDish(currentRow.value?.id as string)
    console.log(response)
    window.location.reload()
  } catch (err) {
    console.error("No se pudo crear el disho:", err)
  }
}

const exportTable = () => {
  
}

const cargarProductos = async () => {
  try{
    dishes.value = await getDishes();
    pagina.value = dishes.value.page
    totalPaginas.value = dishes.value.totalPage
    console.log(dishes.value)
  }
  catch(err){
    console.error('No se pudieron cargar los dishos:', err)
  }
}

onMounted(cargarProductos)

</script>

<template>
  <AppHeader/>
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <AppSidebar/>

    <div class="flex flex-1 flex-col overflow-hidden">

      <main class="flex-1 overflow-y-auto px-8 py-8">
        <CatalogHeader
          :titulo="DishesColumn.titulo"
          :subtitulo="DishesColumn.subtitulo"
          :texto-boton="DishesColumn.textoBoton"
          @agregar="modalInsertEnable = true"
        />

        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="DishesColumn.categorias"
          @buscar="buscar"
          @limpiar="limpiarFiltro"
        />

        <CatalogTable
          :titulo="DishesColumn.titulo"
          :columns="DishesColumn.columns"
          :rows="dishes?.items ?? []"
          :total-registros="dishes?.totalCount ?? 0"
          :pagina="pagina"
          :total-paginas="totalPaginas"
          @editar="openModalUpdate"
          @eliminar="openModalDelete"
          @exportar="exportTable"
          @cambiar-pagina="(p) => (pagina = p)"
        />

        <dishesModals
          v-if="modalInsertEnable === true"
          :is-insert="true"
          :modal-title="'Crear Platillo'"
          :modal-subtitle="'Ingrese los datos del platillo'"
          @close="modalInsertEnable = false"
          @insert="insertRow"
        />

        <dishesModals
          v-if="modalUpdateEnable === true"
          :modal-title="'Modificar Platillo'"
          :modal-subtitle="'cambie los datos del platillo'"
          @close="modalUpdateEnable = false"
          @update="updateRow"
          :name="currentRow?.name ?? ''"
          :price="currentRow?.price ?? 0"
        />

        <dishesModals
          v-if="modalDeleteEnable === true"
          :is-delete="true"
          @close="modalDeleteEnable = false"
          @delete="deleteRow"
          :name="currentRow?.name ?? ''"
        />

        <AppToast
          :visible="toast.visible"
          :mensaje="toast.mensaje"
          :tipo="toast.tipo"
          :duracion="toast.duracion"
          @cerrar="cerrarToast"
        />
      </main>
    </div>
  </div>
</template>