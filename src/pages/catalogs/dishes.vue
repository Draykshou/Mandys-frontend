<script setup lang="ts">
import { reactive, ref, onMounted, type Component } from 'vue'
import axios from 'axios'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import { useToast } from '@/composables/useToast'
import type { ToastTipo } from '@/types/Toast'
import type { CatalogColumn, CatalogRow} from '@/types/CatalogColumns/catalog'
import DishesModals from '@/components/modals/DishesModals.vue'
import { CheckCircle, Trash2, AlertCircle } from 'lucide-vue-next'
import type { CreateDish, Dish, Dishes, UpdateDish } from '@/types/DishesDtos'
import { postDish, putDish, deleteDish, getDishes } from '@/service/DishesService'


const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

const ESTILOS:Record<ToastTipo,{icono:Component;caja:string;barra:string}>={
    exito:{
        icono:CheckCircle,
        caja:'border-green-200 bg-green-50 text-green-900',
        barra:'bg-green-500',
    },
    eliminar:{
        icono:Trash2,
        caja:'border-red-200 bg-red-50 text-red-900',
        barra:'bg-red-500',
    },
    error:{
        icono:AlertCircle,
        caja:'border-red-200 bg-red-50 text-red-900',
        barra:'bg-red-500',
    },
}

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
        await cargarDishes()
    }catch(err){
        console.error('No se pudo crear el platillo:', err)
        mostrarToast(obtenerMensajeError(err,'No se pudo crear el platillo.'),'error')
    }
}

const loadRowInformation=(row:CatalogRow)=>{
    currentRow.value={
        id: Number(row.id),
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
        mostrarToast('Platillo actualizado correctamente.','exito')
        await cargarDishes()
    }catch(err){
        console.error('No se pudo actualizar el platillo:',err)
        mostrarToast(obtenerMensajeError(err,'No se pudo actualizar el platillo.'),'error')
    }
}

const deleteRow = async (reason: string) => {
    if(!currentRow.value) return
    console.log('Motivo de eliminación:', reason)
    try{
        await deleteDish(currentRow.value.id)
        modalDeleteEnable.value=false
        mostrarToast('Platillo eliminado correctamente.','exito')
        await cargarDishes()
    }catch(err){
        console.error('No se pudo eliminar el platillo:',err)
        mostrarToast(obtenerMensajeError(err,'No se pudo eliminar el platillo.'),'error')
    }
}

const exportTable = () => {
  
}

const cargarDishes = async () => {
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

const obtenerMensajeError=(err:unknown,mensajeDefault:string)=>{
    if(axios.isAxiosError(err)){
        const mensaje=err.response?.data?.message
        if(typeof mensaje==='string'&&mensaje.trim()!==''){
            return mensaje
        }
    }
    return mensajeDefault
}

onMounted(cargarDishes)

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
          v-if="modalInsertEnable"
          :is-insert="true"
          :modal-title="'Crear Platillo'"
          :modal-subtitle="'Ingrese los datos del platillo'"
          @close="modalInsertEnable = false"
          @insert="insertRow"
        />

        <dishesModals
          v-if="modalUpdateEnable"
          :modal-title="'Modificar Platillo'"
          :modal-subtitle="'cambie los datos del platillo'"
          @close="modalUpdateEnable = false"
          @update="updateRow"
          :dish="currentRow ?? undefined"
        />

        <dishesModals
          v-if="modalDeleteEnable"
          :is-delete="true"
          @close="modalDeleteEnable = false"
          @delete="deleteRow"
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