<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import DeleteModal from '@/components/DeleteModal.vue'
import DishFormModal from '@/components/DishFormModal.vue'
import { useToast } from '@/composables/useToast'
import type { CatalogColumn, CatalogRow} from '@/types/CatalogColumns/catalog'

import type { Dish, Dishes } from '@/types/DishesDtos'
import { deleteDish, getDishes } from '@/service/DishesService'
import { mensajeDeError } from '@/utils/apiError'

const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

const mostrarFormModal = ref(false)
const dishEnEdicion = ref<Dish | null>(null)

const mostrarEliminar = ref(false)
const dishAEliminar = ref<Dish | null>(null)

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

// Botones
function buscar() {
 
}

function abrirNuevoPlatillo() {
  dishEnEdicion.value = null
  mostrarFormModal.value = true
}

/** CatalogTable es genérico y entrega CatalogRow; en esta página siempre es un Dish. */
const aDish = (row: CatalogRow) => row as unknown as Dish

function editarFila(row: CatalogRow) {
  dishEnEdicion.value = aDish(row)
  mostrarFormModal.value = true
}

function platilloGuardado() {
  const dish = dishEnEdicion.value
  cargarPlatillos()
  mostrarToast(
    dish ? `"${dish.name}" se actualizó` : 'Platillo agregado',
  )
}

function cerrarFormModal() {
  mostrarFormModal.value = false
  dishEnEdicion.value = null
}

function eliminarFila(row: CatalogRow) {
  dishAEliminar.value = aDish(row)
  mostrarEliminar.value = true
}

async function confirmarEliminar() {
  const dish = dishAEliminar.value
  if (!dish) return

  mostrarEliminar.value = false
  dishAEliminar.value = null

  try {
    await deleteDish(String(dish.id))
    mostrarToast(`"${dish.name}" se eliminó correctamente`, 'eliminar')
  } catch (err) {
    mostrarToast(mensajeDeError(err, 'No se pudo eliminar el platillo'), 'error')
  }

  await cargarPlatillos()
}

function manejarAccion(payload: { columnKey: string; row: CatalogRow }) {
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
          @agregar="abrirNuevoPlatillo"
        />

        <DishFormModal
          :open="mostrarFormModal"
          :dish="dishEnEdicion"
          @close="cerrarFormModal"
          @saved="platilloGuardado"
        />

        <DeleteModal
          :visible="mostrarEliminar"
          :row="dishAEliminar"
          @cancelar="mostrarEliminar = false"
          @confirmar="confirmarEliminar"
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
          @editar="editarFila"
          @eliminar="eliminarFila"
          @accion="manejarAccion"
          @exportar="exportar"
          @cambiar-pagina="(p) => (pagina = p)"
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
