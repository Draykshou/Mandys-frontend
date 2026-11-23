<script setup lang="ts">
import { reactive, ref, onMounted, computed } from 'vue'
import axios from 'axios'

// Componentes externos
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import ProductsTable from '@/components/products/ProductsTable.vue'
import ProductsModals from '@/components/products/ProductsModals.vue'
import ModalImg from '@/components/ModalImg.vue'

// Servicios y tipos
import useAuth from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { useExportCatalog } from '@/composables/useExportCatalog'
import { deleteProduct, getProducts, postProduct, putProduct, putProductImage } from '@/service/ProductsService'
import { formatCurrency } from '@/utils/format'
import type { Product, CreateProduct, UpdateProduct, Products } from '@/types/catalogs/ProductsDtos'

// posiblemente eliminar
import type { CatalogColumn } from '@/types/CatalogColumns/catalog'

// Acceso a la página (roles que pueden entrar)
definePage({
  meta: { roles: ["Administrador", "Gerente de Operaciones", "Encargado de Almacen Central", "Encargado de Almacen"] },
});

// ---------------------------------------------------------------------------
// Sesión y avisos
// ---------------------------------------------------------------------------
const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

const { state: sesion } = useAuth()
const rolUsuario = computed(() => sesion.value.user?.role ?? '')

// El Gerente de Operaciones solo consulta: no agrega, edita ni elimina.
const puedeModificar = computed(() => rolUsuario.value !== 'Gerente de Operaciones')

// ---------------------------------------------------------------------------
// Definición del catálogo
// ---------------------------------------------------------------------------
interface DefinicionCatalogo {
  titulo: string
  subtitulo: string
  textoBoton: string
  categorias: string[]
  columnasExcel: CatalogColumn[]
}

const SUFIJO_UNIDAD: Record<string, string> = {
  Kilogramos: '/ KG',
  Litros: '/ L',
  Unidades: '/ U',
}

const definicionProductos: DefinicionCatalogo = {
  titulo: 'Productos',
  subtitulo: 'Control y administración del inventario de productos de la sucursal.',
  textoBoton: 'Agregar Producto',
  categorias: ['Todos', 'Alfabetico A-Z', 'Alfabetico Z-A', 'Mayor precio', 'Menor precio', 'Es Insumo', 'No es Insumo'],
  columnasExcel: [
    { key: 'description', label: 'Descripción', type: 'text' },
    { key: 'isSupply', label: 'Insumo', type: 'boolean' },
    {
      key: 'costPrice',
      label: 'Precio de compra',
      type: 'currency',
      format: (valor, fila) =>
        `${formatCurrency(Number(valor))} ${SUFIJO_UNIDAD[String(fila.measureUnit)] ?? ''}`,
    },
    {
      key: 'salePrice',
      label: 'Precio de venta',
      type: 'currency',
      format: (valor, fila) => (fila.isSupply ? 'Sin precio' : formatCurrency(Number(valor))),
    },
    { key: 'measureUnit', label: 'Unidad de medida', type: 'text' },
  ],
}

// ---------------------------------------------------------------------------
// Estado de la vista
// ---------------------------------------------------------------------------

const productos = ref<Products | null>(null)
const paginaActual = ref(1)
const totalPaginas = ref(1)
const imageVersion = ref(Date.now())

const filtro = reactive({
  busqueda: '',
  categoria: definicionProductos.categorias[0],
})

// ---------------------------------------------------------------------------
// Carga de datos
// ---------------------------------------------------------------------------
const obtenerFiltrosProductos = () => {
  let orderBy = ''
  let IsSupply: boolean | null = null

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
      IsSupply = true
      break
    case 'No es Insumo':
      IsSupply = false
      break
    default:
      orderBy = 'description'
      break
  }

  return { orderBy, IsSupply }
}

const cargarProductos = async (p = 1) => {
  try {
    const { orderBy, IsSupply } = obtenerFiltrosProductos()
    productos.value = await getProducts(p, 20, filtro.busqueda, orderBy, IsSupply)

    paginaActual.value = productos.value?.page ?? 1
    totalPaginas.value = productos.value?.totalPages ?? 1 
    } catch (err) {
      console.error('No se pudieron cargar los productos:', err)
    } 
  }

// ---------------------------------------------------------------------------
// Filtros, búsqueda y paginación
// ---------------------------------------------------------------------------
const buscar = async () => {
  await cargarProductos(1)
}

const limpiarFiltro = () => {
  filtro.busqueda = ''
  filtro.categoria = definicionProductos.categorias[0]
}

const cambiarPagina = async (pagina: number) => {
  await cargarProductos(pagina)
}

// ---------------------------------------------------------------------------
// Agregar, editar y eliminar
// ---------------------------------------------------------------------------

const productoActual = ref<Product | null>(null)
const modalInsertarVisible = ref(false)
const modalEditarVisible = ref(false)
const modalEliminarVisible = ref(false)

const abrirModalEditar = (producto: Product) => {
  productoActual.value = producto
  console.log(producto)
  modalEditarVisible.value = true
}

const abrirModalEliminar = (producto: Product) => {
  productoActual.value = producto
  modalEliminarVisible.value = true
}

const insertarProducto = async (descripcion: string, IsSupply: boolean, precioVenta: number, unidadMedida: string, imagen: File | null) => {
  const producto: CreateProduct = {
    description: descripcion,
    isSupply: IsSupply,
    salePrice: IsSupply ? null : precioVenta,
    measureUnit: unidadMedida,
  }

  try {
    const response = await postProduct(producto)

     if (imagen && response.id) {
      await putProductImage(response.id, imagen);
    }

    modalInsertarVisible.value = false
    mostrarToast('Producto agregado correctamente.', 'exito')
    await cargarProductos()
  } catch (err) {
    console.error('No se pudo crear el producto:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo crear el Producto.'), 'error')
  }
}

const actualizarProducto = async (descripcion: string, IsSupply: boolean, precioVenta: number, unidadMedida: string, imagen: File | null) => {
  const producto: UpdateProduct = {
    description: descripcion,
    isSupply: IsSupply,
    salePrice: IsSupply ? null : precioVenta,
    measureUnit: unidadMedida,
  }

  try {
    const response = await putProduct(productoActual.value?.id as number, producto)

     if (imagen && response.id) {
      await putProductImage(response.id, imagen);
    }
    imageVersion.value = Date.now()

    modalEditarVisible.value = false
    mostrarToast('Producto actualizado correctamente.', 'actualizar')
    await cargarProductos()
  } catch (err) {
    console.error('No se pudo actualizar el producto:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo actualizar el Producto.'), 'error')
  }
}

const eliminarProducto = async () => {
  try {
    await deleteProduct(productoActual.value?.id as number)
    modalEliminarVisible.value = false
    mostrarToast('Producto eliminado correctamente.', 'eliminar')
    await cargarProductos()
  } catch (err) {
    console.error('No se pudo eliminar el producto:', err)
    modalEliminarVisible.value = false
    mostrarToast(obtenerMensajeError(err, 'No se pudo eliminar el Producto.'), 'error')
  }
}

// Imagenes
const modalImg = ref(false)
const imgActual = ref<string | null>()

const abrirModalImg = (img: string | null) => {
  imgActual.value = img
  modalImg.value = true
}

// ---------------------------------------------------------------------------
// Exportación a Excel
// ---------------------------------------------------------------------------
/** Tamaño de página para traer el catálogo completo antes de generar el archivo. */

/**
 * Recorre todas las páginas con `getProducts` para que el archivo no se corte
 * en la primera. Se trae completo (sin filtro de insumo) y ordenado por descripción.
 */
const cargarCatalogo = async () => {
  const primera = await getProducts(1, 20, '', 'description', null)
  const items = [...primera.items]

  for (let pagina = 2; pagina <= primera.totalPages; pagina++) {
    const siguiente = await getProducts(pagina, 20, '', 'description', null)
    // Si una página viene vacía no hay nada más que traer.
    if (siguiente.items.length === 0) break
    items.push(...siguiente.items)
  }

  return items
}

const { exportando, exportar } = useExportCatalog()

const exportarTabla = () => {
  void exportar(
    'excel',
    {
      columns: definicionProductos.columnasExcel,
      titulo: definicionProductos.titulo,
    },
    cargarCatalogo,
  )
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const obtenerMensajeError = (err: unknown, mensajePorDefecto: string) => {
  if (axios.isAxiosError(err)) {
    const mensaje = err.response?.data?.message
    if (typeof mensaje === 'string' && mensaje.trim() !== '') {
      return mensaje
    }
  }
  return mensajePorDefecto
}

onMounted(() => cargarProductos())
</script>

<template>
  <AppHeader/>
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <AppSidebar/>

    <div class="flex flex-1 flex-col overflow-hidden">

      <main class="flex-1 overflow-y-auto px-8 py-8">
        <CatalogHeader
          :can-insert="puedeModificar"
          :titulo="definicionProductos.titulo"
          :subtitulo="definicionProductos.subtitulo"
          :texto-boton="definicionProductos.textoBoton"
          @agregar="modalInsertarVisible = true"
        />

        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="definicionProductos.categorias"
          @buscar="buscar"
          @limpiar="limpiarFiltro"
        />

        <ProductsTable
          :productos="productos?.items ?? []"
          :total-registros="productos?.totalCount ?? 0"
          :pagina="paginaActual"
          :total-paginas="totalPaginas"
          :tamano-pagina="20"
          :mostrar-acciones="puedeModificar"
          :exportando="exportando"
          @editar="abrirModalEditar"
          @eliminar="abrirModalEliminar"
          @ver-imagen="abrirModalImg"
          @exportar="exportarTabla"
          @cambiar-pagina="cambiarPagina"
        />

        <ProductsModals
          v-if="modalInsertarVisible"
          :is-insert="true"
          :modal-title="'Crear producto'"
          :modal-subtitle="'Ingrese los datos del producto'"
          @close="modalInsertarVisible = false"
          @insert="insertarProducto"
        />

        <ProductsModals
          v-if="modalEditarVisible"
          :modal-title="'Modificar producto'"
          :modal-subtitle="'cambie los datos del producto'"
          :description="productoActual?.description"
          :is-supply="productoActual?.isSupply"
          :cost-price="productoActual?.costPrice"
          :sale-price="productoActual?.salePrice"
          :measure-unit="productoActual?.measureUnit"
          :image-url="productoActual?.imageUrl"
          @close="modalEditarVisible = false"
          @update="actualizarProducto"
        />

        <ProductsModals
          v-if="modalEliminarVisible"
          :is-delete="true"
          :description="productoActual?.description"
          @close="modalEliminarVisible = false"
          @delete="eliminarProducto"
        />

        <ModalImg
          v-if="modalImg"
          :image="imgActual ?? null"
          @close="modalImg = false"
        >

        </ModalImg>

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