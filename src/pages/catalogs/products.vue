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
import ProductsModals from '@/components/modals/ProductsModals.vue'

import type { Product, CreateProduct, UpdateProduct, Products } from '@/types/ProductsDtos'
import { deleteProduct, getProducts, postProduct, putProduct } from '@/service/ProductsService'

const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

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

function buscar() {
 
}

const modalInsertEnable = ref(false)

const modalUpdateEnable = ref(false)
const currentRow = ref<Product | null>(null)

const modalDeleteEnable = ref(false)

// CUD
const insertRow = async (description: string, isSupply: boolean, price: number, measureUnit: string) => {
  const product : CreateProduct = {
    description: description,
    isSupply: isSupply,
    price: price,
    measureUnit: measureUnit
  }
  console.log("insert call")

  try {
    const response = await postProduct(product)
    console.log(response)
  } catch (err) {
    console.error("No se pudo crear el producto:", err)
  }
}

const loadRowInformation = (row: CatalogRow) => {
  currentRow.value = {
    id: String(row.id),
    description: String(row.description),
    isSupply: Boolean(row.isSupply),
    price: Number(row.price),
    measureUnit: String(row.measureUnit),
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


const updateRow = async (description: string, isSupply: boolean, price: number, measureUnit: string) => {
  const product : UpdateProduct = {
    description: description,
    isSupply: isSupply,
    price: price,
    measureUnit: measureUnit
  }
  console.log("update call")
  try {
    const response = await putProduct(currentRow.value?.id as string, product)
    console.log(response)
    window.location.reload()
  } catch (err) {
    console.error("No se pudo actualizar el producto:", err)
  }
}

const deleteRow = async () => {
  try {
    const response = await deleteProduct(currentRow.value?.id as string)
    console.log(response)
    window.location.reload()
  } catch (err) {
    console.error("No se pudo crear el producto:", err)
  }
}

const exportTable = () => {
  
}

const cargarProductos = async () => {
  try{
    products.value = await getProducts();
    pagina.value = products.value.page
    totalPaginas.value = products.value.totalPage
    console.log(products.value)
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
          @agregar="modalInsertEnable = true"
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
          @editar="openModalUpdate"
          @eliminar="openModalDelete"
          @exportar="exportTable"
          @cambiar-pagina="(p) => (pagina = p)"
        />

        <ProductsModals
          v-if="modalInsertEnable === true"
          :is-insert="true"
          :modal-title="'Crear producto'"
          :modal-subtitle="'Ingrese los datos del producto'"
          @close="modalInsertEnable = false"
          @insert="insertRow"
        />

        <ProductsModals
          v-if="modalUpdateEnable === true"
          :modal-title="'Modificar producto'"
          :modal-subtitle="'cambie los datos del producto'"
          @close="modalUpdateEnable = false"
          @update="updateRow"
          :description="currentRow?.description"
          :is-supply="currentRow?.isSupply"
          :price="currentRow?.price"
          :measure-unit="currentRow?.measureUnit"
        />

        <ProductsModals
          v-if="modalDeleteEnable === true"
          :is-delete="true"
          @close="modalDeleteEnable = false"
          @delete="deleteRow"
          :description="currentRow?.description"
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
