<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
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

function editarFila(row: CatalogRow) {
  console.log('editar', row)
}

function eliminarFila(row: CatalogRow) {
  console.log('Eliminar', row)
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
      </main>
    </div>
  </div>
</template>
