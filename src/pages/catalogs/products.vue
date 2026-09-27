<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import type { CatalogColumn, CatalogRow} from '@/types/CatalogColumns/catalog'

import type { Products } from '@/types/ProductsDtos'
import { getProducts } from '@/service/ProductsService'

interface CatalogoDef {
  titulo: string
  subtitulo: string
  textoBoton: string
  categorias: string[]
  columns: CatalogColumn[]
}

const products = ref<Products | null>(null)

const productsColumn: CatalogoDef = {
  titulo: 'Productos',
  subtitulo: 'Control y administración del inventario de productos de la sucursal.',
  textoBoton: 'Agregar Producto',
  categorias: ['Todos', 'Bebidas', 'Comida', 'Postres'],
  columns: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text' },
    { key: 'isSupply', label: 'Insumo', type: 'boolean' },
    { key: 'price', label: 'Precio', type: 'text' },
    { key: 'measureUnit', label: 'Unidad de medida', type: 'text' },
  ],
}

const pagina = ref(1)
const totalPaginas = ref(1)

// Filtro
const filtro = reactive({
  busqueda: '',
  categoria: productsColumn.categorias[0],
})


function limpiarFiltro() {
  filtro.busqueda = ''
  filtro.categoria = productsColumn.categorias[0]
}

// Botones
function buscar() {
 
}

function editarFila(row: CatalogRow) {
  editeEnable.value = true
}

function eliminarFila(row: CatalogRow) {
  console.log('Eliminar', row)
}

function manejarAccion(payload: { columnKey: string; row: CatalogRow }) {
  console.log('Acción', payload.columnKey, payload.row)
}

function exportar() {
  
}

function cerrarModal() {
  editeEnable.value = false
}

// modales

const insertEnable = ref(false)
const editeEnable = ref(false)
const deliteEnable = ref(false)

onMounted(async () => {
  try{
    products.value = await getProducts();
    pagina.value = products.value.page
    totalPaginas.value = products.value.totalPage
    console.log(products.value)
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
          :titulo="productsColumn.titulo"
          :subtitulo="productsColumn.subtitulo"
          :texto-boton="productsColumn.textoBoton"
          @agregar="() => console.log('Agregar en', productsColumn)"
        />

        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="productsColumn.categorias"
          @buscar="buscar"
          @limpiar="limpiarFiltro"
        />

        <CatalogTable
          :titulo="productsColumn.titulo"
          :columns="productsColumn.columns"
          :rows="products?.items ?? []"
          :total-registros="products?.totalCount ?? 0"
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

  <div v-if="editeEnable">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="cerrarModal"
    >
      <div class="w-full max-w-lg rounded-xl bg-neutral-100 shadow-xl">
        <div class="mb-6 flex flex-col w-full py-6 px-6 border-b border-neutral-300">
          <h2 class="text-title text-secondary-800">
            Modificar Producto
          </h2>
          <p>Actualiza los datos del producto seleccionado para venta directa o consumo interno.</p>
        </div>
        <div>
          
        </div>
      </div>
    </div>
  </div>
</template>
