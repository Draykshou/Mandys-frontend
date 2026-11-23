<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'

// Componentes externos
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import DishesTable from '@/components/dishes/DishesTable.vue'
import DishesModals from '@/components/dishes/DishesModals.vue'
import ModalImg from '@/components/ModalImg.vue'

// Servicios y tipos
import { useToast } from '@/composables/useToast'
import { useExportCatalog } from '@/composables/useExportCatalog'
import { postDish, putDish, deleteDish, getDishes, putDishImage } from '@/service/DishesService'
import type { CreateDish, Dish, Dishes, UpdateDish } from '@/types/catalogs/DishesDtos'

// posiblemente eliminar
import type { CatalogColumn } from '@/types/CatalogColumns/catalog'

// Acceso a la página (roles que pueden entrar)
definePage({
  meta: { roles: ["Administrador", "Gerente de Operaciones"]},
});

// ---------------------------------------------------------------------------
// Avisos
// ---------------------------------------------------------------------------
const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

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

const definicionPlatillos: DefinicionCatalogo = {
  titulo: 'Platillos',
  subtitulo: 'Gestión de los platillos del restaurante',
  textoBoton: 'Agregar Platillo',
  categorias: ['Todos', 'Alfabetico A-Z', 'Alfabetico Z-A', 'Mayor precio', 'Menor precio'],
  columnasExcel: [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'price', label: 'Precio', type: 'currency' },
    { key: 'recipe', label: 'Recetas', type: 'button' },
  ],
}

// ---------------------------------------------------------------------------
// Estado de la vista
// ---------------------------------------------------------------------------
const REGISTROS_POR_PAGINA = 5

const platillos = ref<Dishes | null>(null)
const paginaActual = ref(1)
const totalPaginas = ref(1)

const filtro = reactive({
  busqueda: '',
  categoria: definicionPlatillos.categorias[0],
})

// ---------------------------------------------------------------------------
// Carga de datos
// ---------------------------------------------------------------------------
const obtenerFiltrosPlatillos = () => {
  let orderBy = ''

  switch (filtro.categoria) {
    case 'Alfabetico A-Z':
      orderBy = 'name'
      break
    case 'Alfabetico Z-A':
      orderBy = '-name'
      break
    case 'Mayor precio':
      orderBy = '-price'
      break
    case 'Menor precio':
      orderBy = 'price'
      break
    default:
      orderBy = 'name'
      break
  }

  return { orderBy }
}

const cargarPlatillos = async (pagina = 1) => {
  try {
    const { orderBy } = obtenerFiltrosPlatillos()
    const respuesta = await getDishes(pagina, REGISTROS_POR_PAGINA, filtro.busqueda, orderBy)

    platillos.value = respuesta
    paginaActual.value = respuesta.page
    totalPaginas.value = respuesta.totalPages
  } catch (err) {
    console.error('No se pudieron cargar los platillos:', err)
  }
}

// ---------------------------------------------------------------------------
// Filtros, búsqueda y paginación
// ---------------------------------------------------------------------------
const buscar = async () => {
  await cargarPlatillos(1)
}

const limpiarFiltro = () => {
  filtro.busqueda = ''
  filtro.categoria = definicionPlatillos.categorias[0]
}

const cambiarPagina = async (pagina: number) => {
  await cargarPlatillos(pagina)
}

// ---------------------------------------------------------------------------
// Agregar, editar, eliminar y ver receta
// ---------------------------------------------------------------------------
const platilloActual = ref<Dish | null>(null)
const modalInsertarVisible = ref(false)
const modalEditarVisible = ref(false)
const modalEliminarVisible = ref(false)
const modalRecetaVisible = ref(false)

const abrirModalEditar = (platillo: Dish) => {
  platilloActual.value = platillo
  modalEditarVisible.value = true
}

const abrirModalEliminar = (platillo: Dish) => {
  platilloActual.value = platillo
  modalEliminarVisible.value = true
}

const verReceta = (platillo: Dish) => {
  platilloActual.value = platillo
  modalRecetaVisible.value = true
}

const insertarPlatillo = async (nombre: string, precio: number, receta: CreateDish['recipe'], imagen: File | null) => {
  const platillo: CreateDish = {
    name: nombre,
    price: precio,
    recipe: receta,
  }

  try {
    const response = await postDish(platillo)

    if(imagen && response.id){
      await putDishImage(response.id, imagen)
    }

    modalInsertarVisible.value = false
    mostrarToast('Platillo creado correctamente.', 'exito')
    await cargarPlatillos()
  } catch (err) {
    console.error('No se pudo crear el platillo:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo crear el platillo.'), 'error')
  }
}

const actualizarPlatillo = async (nombre: string, precio: number, receta: UpdateDish['recipe'], imagen: File | null) => {
  if (!platilloActual.value) return

  const platillo: UpdateDish = {
    name: nombre,
    price: precio,
    recipe: receta,
  }

  try {

    const response = await putDish(platilloActual.value.id, platillo)

    if(imagen && response.id){
      await putDishImage(response.id, imagen)
    }

    await putDish(platilloActual.value.id, platillo)
    modalEditarVisible.value = false
    mostrarToast('Platillo actualizado correctamente.', 'actualizar')
    await cargarPlatillos()
  } catch (err) {
    console.error('No se pudo actualizar el platillo:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo actualizar el platillo.'), 'error')
  }
}

const eliminarPlatillo = async () => {
  try {
    await deleteDish(platilloActual.value?.id as number)
    modalEliminarVisible.value = false
    mostrarToast('Platillo eliminado correctamente.', 'eliminar')
    await cargarPlatillos()
  } catch (err) {
    console.error('No se pudo eliminar el platillo:', err)
    modalEliminarVisible.value = false
    mostrarToast(obtenerMensajeError(err, 'No se pudo eliminar el platillo.'), 'error')
  }
}

// ---------------------------------------------------------------------------
// Imágenes
// ---------------------------------------------------------------------------
const modalImg = ref(false)
const imgActual = ref<string | null>(null)

const abrirModalImg = (img: string | null) => {
  imgActual.value = img
  console.log(imgActual.value)
  modalImg.value = true
}

// ---------------------------------------------------------------------------
// Exportación a Excel
// ---------------------------------------------------------------------------
/** Tamaño de página para traer el catálogo completo antes de generar el archivo. */
const TAMANO_PAGINA_EXPORTACION = 20

/** `getDishes` pagina en servidor: recorre todas las páginas para no cortar el Excel. */
const cargarCatalogo = async () => {
  const primera = await getDishes(1, TAMANO_PAGINA_EXPORTACION, '', 'name')
  const items = [...primera.items]

  for (let pagina = 2; pagina <= primera.totalPages; pagina++) {
    const siguiente = await getDishes(pagina, TAMANO_PAGINA_EXPORTACION, '', 'name')
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
      columns: definicionPlatillos.columnasExcel,
      titulo: definicionPlatillos.titulo,
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

onMounted(() => cargarPlatillos())
</script>

<template>
  <AppHeader/>
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <AppSidebar/>

    <div class="flex flex-1 flex-col overflow-hidden">

      <main class="flex-1 overflow-y-auto px-8 py-8">
        <CatalogHeader
          :titulo="definicionPlatillos.titulo"
          :subtitulo="definicionPlatillos.subtitulo"
          :texto-boton="definicionPlatillos.textoBoton"
          @agregar="modalInsertarVisible = true"
        />

        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="definicionPlatillos.categorias"
          @buscar="buscar"
          @limpiar="limpiarFiltro"
        />

        <DishesTable
          :platillos="platillos?.items ?? []"
          :total-registros="platillos?.totalCount ?? 0"
          :pagina="paginaActual"
          :total-paginas="totalPaginas"
          :tamano-pagina="REGISTROS_POR_PAGINA"
          :exportando="exportando"
          @editar="abrirModalEditar"
          @eliminar="abrirModalEliminar"
          @ver-receta="verReceta"
          @ver-imagen="abrirModalImg"
          @exportar="exportarTabla"
          @cambiar-pagina="cambiarPagina"
        />

        <DishesModals
          v-if="modalInsertarVisible"
          :is-insert="true"
          :modal-title="'Crear Platillo'"
          :modal-subtitle="'Ingrese los datos del platillo'"
          @close="modalInsertarVisible = false"
          @insert="insertarPlatillo"
        />

        <DishesModals
          v-if="modalEditarVisible"
          :modal-title="'Modificar Platillo'"
          :modal-subtitle="'cambie los datos del platillo'"
          :dish="platilloActual ?? undefined"
          @close="modalEditarVisible = false"
          @update="actualizarPlatillo"
        />

        <DishesModals
          v-if="modalEliminarVisible"
          :is-delete="true"
          :dish="platilloActual ?? undefined"
          @close="modalEliminarVisible = false"
          @delete="eliminarPlatillo"
        />

        <DishesModals
          v-if="modalRecetaVisible"
          :is-action="true"
          :dish="platilloActual ?? undefined"
          @close="modalRecetaVisible = false"
        />

        <ModalImg
          v-if="modalImg"
          :image="imgActual ?? null"
          @close="modalImg = false"
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