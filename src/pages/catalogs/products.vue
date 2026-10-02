<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import { useToast } from '@/composables/useToast'
import { useExportCatalog } from '@/composables/useExportCatalog'
import type { CatalogColumn, CatalogRow} from '@/types/CatalogColumns/catalog'
import ProductsModals from '@/components/modals/ProductsModals.vue'
import useAuth from '@/composables/useAuth'

import type { Product, CreateProduct, UpdateProduct, Products } from '@/types/ProductsDtos'
import { deleteProduct, getProducts, postProduct, putProduct } from '@/service/ProductsService'
import axios from 'axios'

const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

const { state: auth} = useAuth()

const rolUsuario = computed(() => auth.value.user?.role ?? '')

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
  categorias: ['Todos', 'Alfabetico A-Z', 'Alfabetico Z-A', 'Mayor precio', 'Menor precio', 'Es Insumo', 'No es Insumo'],
  columns: [
    { key: 'description', label: 'Descripción', type: 'text' },
    { key: 'isSupply', label: 'Insumo', type: 'boolean' },
    { key: 'costPrice', label: 'Precio de compra', type: 'currency' },
    { key: 'salePrice', label: 'Precio de venta', type: 'currency' },
    { key: 'measureUnit', label: 'Unidad de medida', type: 'text' },
  ],
}

const page = ref(1)
const totalPages = ref(1)

// Filtro
const filtro = reactive({
  busqueda: '',
  categoria: productsColumn.categorias[0],
})


function limpiarFiltro() {
  filtro.busqueda = ''
  filtro.categoria = productsColumn.categorias[0]
}

const search = async () => {
  await loadProducts(1)
}

const getProductFilters = () => {
  let orderBy = ''
  let isSupply: boolean | null = null

  switch (filtro.categoria) {
    case 'Alfabetico A-Z':
      orderBy = 'description'
      break

    case 'Alfabetico Z-A':
      orderBy = '-description'
      break

    case 'Mayor precio':
      orderBy = '-salePrice'
      break

    case 'Menor precio':
      orderBy = 'salePrice'
      break

    case 'Es Insumo':
      isSupply = true
      break
    case 'No es Insumo':
      isSupply = false
      break
    default:
      orderBy = 'description'
      break
  }

  return {
    orderBy,
    isSupply
  }
}

const modalInsertEnable = ref(false)

const modalUpdateEnable = ref(false)
const currentRow = ref<Product | null>(null)

const modalDeleteEnable = ref(false)

// CUD
const insertRow = async (description: string, isSupply: boolean, salePrice: number, measureUnit: string) => {
  const product : CreateProduct = {
    description: description,
    isSupply: isSupply,
    salePrice: salePrice,
    measureUnit: measureUnit
  }
  console.log("insert call")

  try {
    await postProduct(product)
    modalInsertEnable.value = false
    mostrarToast('Producto agregado correctamente.','exito')
    await loadProducts()
  } catch (err) {
    console.error("No se pudo crear el producto:", err)
    mostrarToast(obtenerMensajeError(err,'No se pudo crear el Producto.'),'error')
  }
}

const loadRowInformation = (row: CatalogRow) => {
  currentRow.value = {
    id: Number(row.id),
    description: String(row.description),
    isSupply: Boolean(row.isSupply),
    costPrice: Number(row.costprice),
    salePrice: Number(row.salePrice),
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


const updateRow = async (description: string, isSupply: boolean, salePrice: number, measureUnit: string) => {
  const product : UpdateProduct = {
    description: description,
    isSupply: isSupply,
    salePrice: salePrice,
    measureUnit: measureUnit
  }
  console.log("update call")
  try {
    await putProduct(currentRow.value?.id as number, product)
    modalUpdateEnable.value = false
    mostrarToast('Producto actualizado correctamente.','actualizar')
    await loadProducts()
    
  } catch (err) {
    console.error("No se pudo actualizar el producto:", err)
    mostrarToast(obtenerMensajeError(err,'No se pudo actualizar el Producto.'),'error')
  }
}

const deleteRow = async () => {
  try {
    await deleteProduct(currentRow.value?.id as number)
    modalDeleteEnable.value = false
    mostrarToast('Producto eliminado correctamente.','eliminar')
    await loadProducts()
    
  } catch (err) {
    console.error("No se pudo crear el producto:", err)
    modalDeleteEnable.value = false
    mostrarToast(obtenerMensajeError(err,'No se pudo eliminar el Producto.'),'error')
  }
}

const changePage = async (page: number) => {
  await loadProducts(page)
}

/** Tamaño de página para traer el catálogo completo antes de generar el archivo. */
const PAGE_SIZE_EXPORT = 100

/**
 * Productos es el único catálogo cuya vista sí pagina en servidor, así que
 * recorre todas las páginas con `getProducts` para que el archivo no se corte
 * en la primera. Se repiten el orden y el filtro de insumo que usa la tabla.
 */
const cargarCatalogo = async () => {
  const primera = await getProducts(1, PAGE_SIZE_EXPORT, '', 'description', null)
  const items = [...primera.items]
  for (let pagina = 2; pagina <= primera.totalPages; pagina++) {
    const siguiente = await getProducts(pagina, PAGE_SIZE_EXPORT, '', 'description', null)
    // Si una página viene vacía no hay nada más que traer; seguir insistiendo
    // solo gastaría requests.
    if (siguiente.items.length === 0) break
    items.push(...siguiente.items)
  }
  return items
}

const { exportando, exportar } = useExportCatalog()

const exportTable = () => {
  void exportar(
    'excel',
    {
      columns: productsColumn.columns,
      titulo: productsColumn.titulo,
    },
    cargarCatalogo,
  )
}

const loadProducts = async (p = 1) => {
  try{
    const { orderBy, isSupply } = getProductFilters()
    
    products.value = await getProducts(p, 20, filtro.busqueda, orderBy, isSupply)
    page.value = products.value.page
    totalPages.value = products.value.totalPages
  }
  catch(err){
    console.error('No se pudieron cargar los productos:', err)
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

onMounted(loadProducts)

</script>

<template>
  <AppHeader/>
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <AppSidebar/>

    <div class="flex flex-1 flex-col overflow-hidden">

      <main class="flex-1 overflow-y-auto px-8 py-8">
        <CatalogHeader
          :can-insert="rolUsuario === 'Gerente de Operaciones' ? false : true"
          :titulo="productsColumn.titulo"
          :subtitulo="productsColumn.subtitulo"
          :texto-boton="productsColumn.textoBoton"
          @agregar="modalInsertEnable = true"
        />

        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="productsColumn.categorias"
          @buscar="search"
          @limpiar="limpiarFiltro"
        />

        <CatalogTable
          :cant-action="rolUsuario === 'Gerente de Operaciones' ? false : true"
          :titulo="productsColumn.titulo"
          :columns="productsColumn.columns"
          :rows="products?.items ?? []"
          :total-registros="products?.totalCount ?? 0"
          :pagina="page"
          :total-paginas="totalPages"
          formato-export="excel"
          :exportando="exportando"
          @editar="openModalUpdate"
          @eliminar="openModalDelete"
          @exportar="exportTable"
          @cambiar-pagina="changePage"
        />

        <ProductsModals
          v-if="modalInsertEnable"
          :is-insert="true"
          :modal-title="'Crear producto'"
          :modal-subtitle="'Ingrese los datos del producto'"
          @close="modalInsertEnable = false"
          @insert="insertRow"
        />

        <ProductsModals
          v-if="modalUpdateEnable"
          :modal-title="'Modificar producto'"
          :modal-subtitle="'cambie los datos del producto'"
          @close="modalUpdateEnable = false"
          @update="updateRow"
          :description="currentRow?.description"
          :is-supply="currentRow?.isSupply"
          :cost-price ="currentRow?.costPrice"
          :sale-price="currentRow?.salePrice"
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
