<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import CatalogDeleteModal from '@/components/DeleteModal.vue'
import AppToast from '@/components/AppToast.vue'
import type { CatalogColumn, CatalogRow} from '@/types/CatalogColumns/catalog'

import type { Combos } from '@/types/combosDtos'
import { getCombos } from '@/service/CombosService'

interface CatalogoDef {
  titulo: string
  subtitulo: string
  textoBoton: string
  categorias: string[]
  columns: CatalogColumn[]
}

const Combos = ref<Combos | null>(null)

const CombosColumn: CatalogoDef = {
  titulo: 'Platillos',
  subtitulo: 'Gestión de los platillos del restaurante',
  textoBoton: 'Agregar Platillo',
  categorias: ['Todos', 'Bebidas', 'Comida', 'Postres'],
  columns: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'price', label: 'Precio', type: 'text' },
    { key: 'Dishes', label: 'Productos', type: 'button' },
  ],
}

const pagina = ref(1)
const totalPaginas = ref(1)

const mostrarEliminar = ref(false)
const filaEliminar = ref<CatalogRow | null>(null)
const mostrarToast = ref(false)
const mensajeToast = ref('')

// Filtro
const filtro = reactive({
  busqueda: '',
  categoria: CombosColumn.categorias[0],
})


function limpiarFiltro() {
  filtro.busqueda = ''
  filtro.categoria = CombosColumn.categorias[0]
}

// Botones
function buscar() {
 
}

function mostrarMensaje(mensaje: string) {
  mensajeToast.value = mensaje
  mostrarToast.value = true

  setTimeout(() => {
    mostrarToast.value = false
  }, 3000)
}

function editarFila(row: CatalogRow) {
  console.log('editar', row)
}

function eliminarFila(row: CatalogRow) {
  filaEliminar.value = row
  mostrarEliminar.value = true
}

function cancelarEliminar() {
  mostrarEliminar.value = false
  filaEliminar.value = null
}

async function confirmarEliminar(payload: {
  row: CatalogRow
  motivo: string
}) {
  try {
    console.log('Eliminar:', payload.row)
    console.log('Motivo:', payload.motivo)

    mostrarMensaje('Platillo eliminado correctamente')

    mostrarEliminar.value = false
    filaEliminar.value = null

  } catch (error) {
    console.error('Error al eliminar:', error)

    mostrarMensaje('No se pudo eliminar el platillo')
  }
}

function manejarAccion(payload: { columnKey: string; row: CatalogRow }) {
  console.log('Acción', payload.columnKey, payload.row)
}

function exportar() {
  
}

onMounted(async () => {
  try{
    Combos.value = await getCombos();
    pagina.value = Combos.value.page
    totalPaginas.value = Combos.value.totalPage

    console.log(Combos.value)
  }
  catch(err){
    console.error('Error al iniciar sesión:', err)
  }
})
</script>

<template>
  <AppHeader/>
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <AppSidebar/>

    <div class="flex flex-1 flex-col overflow-hidden">

      <main class="flex-1 overflow-y-auto px-8 py-8">
        <CatalogHeader
          :titulo="CombosColumn.titulo"
          :subtitulo="CombosColumn.subtitulo"
          :texto-boton="CombosColumn.textoBoton"
          @agregar="() => console.log('Agregar en', CombosColumn)"
        />

        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="CombosColumn.categorias"
          @buscar="buscar"
          @limpiar="limpiarFiltro"
        />

        <CatalogTable
          :titulo="CombosColumn.titulo"
          :columns="CombosColumn.columns"
          :rows="Combos?.items ?? []"
          :total-registros="Combos?.totalCount ?? 0"
          :pagina="pagina"
          :total-paginas="totalPaginas"
          @editar="editarFila"
          @eliminar="eliminarFila"
          @accion="manejarAccion"
          @exportar="exportar"
          @cambiar-pagina="(p) => (pagina = p)"
        />

        <CatalogDeleteModal
        :visible="mostrarEliminar"
        :row="filaEliminar"
        :descripcion="filaEliminar?.name"
        @cancelar="cancelarEliminar"
        @confirmar="confirmarEliminar"
        />

        <AppToast
        :visible="mostrarToast"
        :mensaje="mensajeToast"
        @cerrar="mostrarToast = false"
        />
      </main>
    </div>
  </div>
</template>
