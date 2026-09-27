<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import DeleteModal from '@/components/DeleteModal.vue'
import ProductFormModal from '@/components/ProductFormModal.vue'
import { useToast } from '@/composables/useToast'
import { mensajeDeError } from '@/utils/apiError'
import type { CatalogColumn, CatalogRow} from '@/types/CatalogColumns/catalog'

import type { Product, Products } from '@/types/ProductsDtos'
import { deleteProduct, getProducts } from '@/service/ProductsService'

const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

const mostrarFormModal = ref(false)
const productEnEdicion = ref<Product | null>(null)

const mostrarEliminar = ref(false)
const productAEliminar = ref<Product | null>(null)

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
    { key: 'price', label: 'Precio', type: 'currency' },
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

/** CatalogTable es genérico y entrega CatalogRow; en esta página siempre es un Product. */
const aProduct = (row: CatalogRow) => row as unknown as Product

function abrirNuevoProducto() {
  productEnEdicion.value = null
  mostrarFormModal.value = true
}

function editarFila(row: CatalogRow) {
  productEnEdicion.value = aProduct(row)
  mostrarFormModal.value = true
}

function productoGuardado() {
  const product = productEnEdicion.value
  cargarProductos()
  mostrarToast(product ? `"${product.description}" se actualizó` : 'Producto agregado')
}

function cerrarFormModal() {
  mostrarFormModal.value = false
  productEnEdicion.value = null
}

function eliminarFila(row: CatalogRow) {
  productAEliminar.value = aProduct(row)
  mostrarEliminar.value = true
}

async function confirmarEliminar() {
  const product = productAEliminar.value
  if (!product) return

  mostrarEliminar.value = false
  productAEliminar.value = null

  try {
    await deleteProduct(String(product.id))
    mostrarToast(`"${product.description}" se eliminó correctamente`, 'eliminar')
  } catch (err) {
    mostrarToast(mensajeDeError(err, 'No se pudo eliminar el producto'), 'error')
  }

  await cargarProductos()
}

function manejarAccion(payload: { columnKey: string; row: CatalogRow }) {
  console.log('Acción', payload.columnKey, payload.row)
}

function exportar() {
   
}

const cargarProductos = async () => {
  try{
    products.value = await getProducts();
    pagina.value = products.value.page
    totalPaginas.value = products.value.totalPage
  }
  catch(err){
    console.error('No se pudieron cargar los productos:', err)
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
          :titulo="productsColumn.titulo"
          :subtitulo="productsColumn.subtitulo"
          :texto-boton="productsColumn.textoBoton"
          @agregar="abrirNuevoProducto"
        />

        <ProductFormModal
          :open="mostrarFormModal"
          :product="productEnEdicion"
          @close="cerrarFormModal"
          @saved="productoGuardado"
        />

        <DeleteModal
          :visible="mostrarEliminar"
          :row="productAEliminar"
          @cancelar="mostrarEliminar = false"
          @confirmar="confirmarEliminar"
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
