<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import CreateDishModal from '@/components/CreateDishModal.vue'
import type { CatalogColumn, CatalogRow} from '@/types/CatalogColumns/catalog'

import type { CreateDish, Dishes } from '@/types/DishesDtos'
import { getDishes, createDish } from '@/service/DishesService'

const showCreateModal = ref(false)

interface CatalogoDef {
  titulo: string
  subtitulo: string
  textoBoton: string
  categorias: string[]
  columns: CatalogColumn[]
}

const Dishes = ref<Dishes | null>(null)

const DishesColumn: CatalogoDef = {
  titulo: 'Platillos',
  subtitulo: 'Gestión de los platillos del restaurante',
  textoBoton: 'Agregar Platillo',
  categorias: ['Todos', 'Bebidas', 'Comida', 'Postres'],
  columns: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'price', label: 'Precio', type: 'text' },
    { key: 'Recipe', label: 'Recetas', type: 'button' },
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

// Botones
function buscar() {
 
}

const insertRow = async (payload: CreateDish) => {
  try {
    await createDish(payload)
    setTimeout(() => {}, 1800)
  } catch (err: any) {
    const serverMsg = err?.response?.data?.message
    console.log("Error de inserción: " + serverMsg.value)
  }
}

function updateRow(row: CatalogRow) {
  console.log('editar', row)
}

function deleteRow(row: CatalogRow) {
  console.log('Eliminar', row)
}

function handleAction(payload: { columnKey: string; row: CatalogRow }) {
  console.log('Acción', payload.columnKey, payload.row)
}

function exportar() {

}

const cargarPlatillos = async () => {
  try {
    Dishes.value = await getDishes()
    pagina.value = Dishes.value.page
    totalPaginas.value = Dishes.value.totalPage
  } catch (err) {
    console.error('Error al cargar platillos:', err)
  }
}

onMounted(cargarPlatillos)
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
          @agregar="showCreateModal = true"
        />

        <CreateDishModal
          v-if="showCreateModal"
          :is-insert="false"
          :titulo="'Agregar Producto'"
          :subtitulo="'Ingresa la información que se te pide'"
          @close="showCreateModal = false"
          @insert="insertRow"
          @update="updateRow"
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
          :rows="Dishes?.items ?? []"
          :total-registros="Dishes?.totalCount ?? 0"
          :pagina="pagina"
          :total-paginas="totalPaginas"
          @editar="updateRow"
          @eliminar="deleteRow"
          @accion="handleAction"
          @exportar="exportar"
          @cambiar-pagina="(p) => (pagina = p)"
        />
      </main>
    </div>
  </div>
</template>
