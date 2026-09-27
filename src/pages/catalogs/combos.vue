<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import CatalogDeleteModal from '@/components/DeleteModal.vue'
import ComboFormModal from '@/components/ComboFormModal.vue'
import AppToast from '@/components/AppToast.vue'
import { useToast } from '@/composables/useToast'
import { mensajeDeError } from '@/utils/apiError'
import type { CatalogColumn, CatalogRow} from '@/types/CatalogColumns/catalog'

import type { Combo, Combos } from '@/types/CombosDtos'
import { deleteCombo, getCombos } from '@/service/CombosService'

interface CatalogoDef {
  titulo: string
  subtitulo: string
  textoBoton: string
  categorias: string[]
  columns: CatalogColumn[]
}

const Combos = ref<Combos | null>(null)

const CombosColumn: CatalogoDef = {
  titulo: 'Combos',
  subtitulo: 'Gestión de los combos del restaurante',
  textoBoton: 'Agregar Combo',
  categorias: ['Todos', 'Bebidas', 'Comida', 'Postres'],
  columns: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'price', label: 'Precio', type: 'currency' },
    { key: 'Dishes', label: 'Platillos', type: 'button' },
  ],
}

const pagina = ref(1)
const totalPaginas = ref(1)

const mostrarFormModal = ref(false)
const comboEnEdicion = ref<Combo | null>(null)

const mostrarEliminar = ref(false)
const filaEliminar = ref<Combo | null>(null)

const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

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

/** CatalogTable es genérico y entrega CatalogRow; en esta página siempre es un Combo. */
const aCombo = (row: CatalogRow) => row as unknown as Combo

function abrirNuevoCombo() {
  comboEnEdicion.value = null
  mostrarFormModal.value = true
}

function editarFila(row: CatalogRow) {
  comboEnEdicion.value = aCombo(row)
  mostrarFormModal.value = true
}

function comboGuardado() {
  const combo = comboEnEdicion.value
  cargarCombos()
  mostrarToast(combo ? `"${combo.name}" se actualizó` : 'Combo agregado')
}

function cerrarFormModal() {
  mostrarFormModal.value = false
  comboEnEdicion.value = null
}

function eliminarFila(row: CatalogRow) {
  filaEliminar.value = aCombo(row)
  mostrarEliminar.value = true
}

function cancelarEliminar() {
  mostrarEliminar.value = false
  filaEliminar.value = null
}

async function confirmarEliminar() {
  const combo = filaEliminar.value
  if (!combo) return

  mostrarEliminar.value = false
  filaEliminar.value = null

  try {
    await deleteCombo(String(combo.id))
    mostrarToast(`"${combo.name}" se eliminó correctamente`, 'eliminar')
  } catch (err) {
    mostrarToast(mensajeDeError(err, 'No se pudo eliminar el combo'), 'error')
  }

  await cargarCombos()
}

function manejarAccion(payload: { columnKey: string; row: CatalogRow }) {
  console.log('Acción', payload.columnKey, payload.row)
}

function exportar() {
  
}

const cargarCombos = async () => {
  try{
    Combos.value = await getCombos();
    pagina.value = Combos.value.page
    totalPaginas.value = Combos.value.totalPage
  }
  catch(err){
    console.error('No se pudieron cargar los combos:', err)
  }
}

onMounted(cargarCombos)
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
          @agregar="abrirNuevoCombo"
        />

        <ComboFormModal
          :open="mostrarFormModal"
          :combo="comboEnEdicion"
          @close="cerrarFormModal"
          @saved="comboGuardado"
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
