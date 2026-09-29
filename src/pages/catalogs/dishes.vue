<script setup lang="ts">
import { reactive, ref, onMounted, type Component } from 'vue'
import axios from 'axios'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import DishesModals from '@/components/modals/DishesModals.vue'
import { useToast } from '@/composables/useToast'

import type { CatalogColumn, CatalogRow} from '@/types/CatalogColumns/catalog'
import type { CreateDish, Dish, Dishes, UpdateDish } from '@/types/DishesDtos'

import { postDish, putDish, deleteDish, getDishes } from '@/service/DishesService'
import ActionModal from '@/components/ActionModal.vue'


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
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'price', label: 'Precio', type: 'currency' },
    { key: 'recipe', label: 'Recetas', type: 'button' },
  ],
}

const page = ref(1)
const totalPages = ref(1)

// Filtro
const filtro = reactive({
  busqueda: '',
  categoria: DishesColumn.categorias[0],
})


function cleanFilter() {
  filtro.busqueda = ''
  filtro.categoria = DishesColumn.categorias[0]
}

function search() {
 
}

// CUD
const modalInsertEnable = ref(false)
const modalUpdateEnable = ref(false)
const modalDeleteEnable = ref(false)
const modalActionEnable = ref(false)

const currentRow = ref<Dish | null>(null)

const loadRowInformation=(row:CatalogRow)=>{
    currentRow.value={
        id: Number(row.id),
        name: String(row.name),
        price: Number(row.price),
        recipe: row.recipe as Dish['recipe']
    }
}

const insertRow = async(name: string, price: number, recipe: CreateDish['recipe'])=>{
  const dish:CreateDish={
      name,
      price,
      recipe
  }
  try{
      await postDish(dish)
      modalInsertEnable.value = false
      mostrarToast('Platillo creado correctamente.','exito')
      await loadDishes()
  }catch(err){
      console.error('No se pudo crear el platillo:', err)
      mostrarToast(obtenerMensajeError(err,'No se pudo crear el platillo.'),'error')
  }
}

const updateRow = async(name: string, price: number, recipe: UpdateDish['recipe'])=>{
    if(!currentRow.value)return
    const dish:UpdateDish={
        name,
        price,
        recipe
    }
    try{
        await putDish(currentRow.value.id,dish)
        modalUpdateEnable.value = false
        mostrarToast('Platillo actualizado correctamente.','actualizar')
        await loadDishes()
    }catch(err){
        console.error('No se pudo actualizar el platillo:',err)
        mostrarToast(obtenerMensajeError(err,'No se pudo actualizar el platillo.'),'error')
    }
}

const openModalUpdate = (row: CatalogRow) => {
  loadRowInformation(row)
  modalUpdateEnable.value = true
}


const deleteRow = async () => {
  try {
    await deleteDish(currentRow.value?.id as number)
    modalDeleteEnable.value = false
    mostrarToast('Producto eliminado correctamente.','eliminar')
    await loadDishes()
    
  } catch (err) {
    console.error("No se pudo crear el producto:", err)
    mostrarToast(obtenerMensajeError(err,'No se pudo crear el platillo.'),'error')
  }
}

const openModalDelete = (row: CatalogRow) => {
  loadRowInformation(row)
  modalDeleteEnable.value = true
}

const seeRecipe = (row: CatalogRow) => {
  console.log("llega aquí", row)
  loadRowInformation(row)
  modalActionEnable.value = true
  console.log(modalActionEnable.value)
}

const changePage = async (page: number) => {
  await loadDishes(page)
}

const exportTable = () => {
  
}

const loadDishes = async (p = 1) => {
  try{
    dishes.value = await getDishes(p, 5, '', "name");
    page.value = dishes.value.page
    totalPages.value = dishes.value.totalPages
    console.log(dishes.value)
  }
  catch(err){
    console.error('No se pudieron cargar los dishos:', err)
  }
}

const obtenerMensajeError=(err:unknown,mensajeDefault:string)=>{
    if(axios.isAxiosError(err)){
        const mensaje=err.response?.data?.message
        if(typeof mensaje==='string'&&mensaje.trim()!==''){
            return mensaje
        }
    }
    return mensajeDefault
}

onMounted(loadDishes)

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
          @buscar="search"
          @limpiar="cleanFilter"
        />

        <CatalogTable
          :titulo="DishesColumn.titulo"
          :columns="DishesColumn.columns"
          :rows="dishes?.items ?? []"
          :total-registros="dishes?.totalCount ?? 0"
          :pagina="page"
          :total-paginas="totalPages"
          @editar="openModalUpdate"
          @eliminar="openModalDelete"
          @accion="seeRecipe"
          @exportar="exportTable"
          @cambiar-pagina="changePage"
        />

        <DishesModals
          v-if="modalInsertEnable"
          :is-insert="true"
          :modal-title="'Crear Platillo'"
          :modal-subtitle="'Ingrese los datos del platillo'"
          @close="modalInsertEnable = false"
          @insert="insertRow"
        />

        <DishesModals
          v-if="modalUpdateEnable"
          :modal-title="'Modificar Platillo'"
          :modal-subtitle="'cambie los datos del platillo'"
          @close="modalUpdateEnable = false"
          @update="updateRow"
          :dish="currentRow ?? undefined"
        />

        <DishesModals
          v-if="modalDeleteEnable"
          :is-delete="true"
          @close="modalDeleteEnable = false"
          @delete="deleteRow"
          :dish="currentRow ?? undefined"
        />

        <DishesModals
          v-if="modalActionEnable"
          :is-action="true"
          @close="modalActionEnable = false"
          :dish="currentRow ?? undefined"
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