<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'

// Componentes externos
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CombosTable from '@/components/combos/CombosTable.vue'
import CombosModals from '@/components/combos/CombosModals.vue'
import ModalImg from '@/components/ModalImg.vue'

// Servicios y tipos
import { useToast } from '@/composables/useToast'
import { useExportCatalog } from '@/composables/useExportCatalog'
import { postCombo, putCombo, deleteCombo, getCombos } from '@/service/CombosService'
import type { Combo, Combos, CreateCombo, UpdateCombo } from '@/types/catalogs/CombosDtos'

// posiblemente eliminar
import type { CatalogColumn } from '@/types/CatalogColumns/catalog'

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

const definicionCombos: DefinicionCatalogo = {
  titulo: 'Combos',
  subtitulo: 'Gestión de los combos del restaurante',
  textoBoton: 'Agregar Combo',
  categorias: ['Alfabetico A-Z', 'Alfabetico Z-A', 'Mayor precio', 'Menor precio'],
  columnasExcel: [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'price', label: 'Precio', type: 'currency' },
    { key: 'dishes', label: 'Contenido', type: 'button' },
  ],
}

// ---------------------------------------------------------------------------
// Estado de la vista
// ---------------------------------------------------------------------------
const REGISTROS_POR_PAGINA = 5

const combos = ref<Combos | null>(null)
const paginaActual = ref(1)
const totalPaginas = ref(1)

const filtro = reactive({
  busqueda: '',
  categoria: definicionCombos.categorias[0],
})

// ---------------------------------------------------------------------------
// Carga de datos
// ---------------------------------------------------------------------------
const obtenerFiltrosCombos = () => {
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

const cargarCombos = async (pagina = 1) => {
  try {
    const { orderBy } = obtenerFiltrosCombos()
    const respuesta = await getCombos(pagina, REGISTROS_POR_PAGINA, filtro.busqueda, orderBy)

    combos.value = respuesta
    paginaActual.value = respuesta.page
    totalPaginas.value = respuesta.totalPages
  } catch (err) {
    console.error('No se pudieron cargar los combos:', err)
  }
}

// ---------------------------------------------------------------------------
// Filtros, búsqueda y paginación
// ---------------------------------------------------------------------------
const buscar = async () => {
  await cargarCombos(1)
}

const limpiarFiltro = () => {
  filtro.busqueda = ''
  filtro.categoria = definicionCombos.categorias[0]
}

const cambiarPagina = async (pagina: number) => {
  await cargarCombos(pagina)
}

// ---------------------------------------------------------------------------
// Agregar, editar, eliminar y ver contenido
// ---------------------------------------------------------------------------
const comboActual = ref<Combo | null>(null)
const modalInsertarVisible = ref(false)
const modalEditarVisible = ref(false)
const modalEliminarVisible = ref(false)
const modalContenidoVisible = ref(false)

const abrirModalEditar = (combo: Combo) => {
  comboActual.value = combo
  modalEditarVisible.value = true
}

const abrirModalEliminar = (combo: Combo) => {
  comboActual.value = combo
  modalEliminarVisible.value = true
}

const verContenido = (combo: Combo) => {
  comboActual.value = combo
  modalContenidoVisible.value = true
}

const insertarCombo = async (
  nombre: string,
  precio: number,
  platillos: CreateCombo['dishes'],
  productos: CreateCombo['products'],
) => {
  const combo: CreateCombo = {
    name: nombre,
    price: precio,
    dishes: platillos,
    products: productos,
  }

  try {
    await postCombo(combo)
    modalInsertarVisible.value = false
    mostrarToast('Combo creado correctamente.', 'exito')
    await cargarCombos()
  } catch (err) {
    console.error('No se pudo crear el combo:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo crear el combo.'), 'error')
  }
}

const actualizarCombo = async (
  nombre: string,
  precio: number,
  platillos: UpdateCombo['dishes'],
  productos: UpdateCombo['products'],
) => {
  if (!comboActual.value) return

  const combo: UpdateCombo = {
    name: nombre,
    price: precio,
    dishes: platillos,
    products: productos,
  }

  try {
    await putCombo(comboActual.value.id, combo)
    modalEditarVisible.value = false
    mostrarToast('Combo actualizado correctamente.', 'actualizar')
    await cargarCombos()
  } catch (err) {
    console.error('No se pudo actualizar el combo:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo actualizar el combo.'), 'error')
  }
}

const eliminarCombo = async (motivo: string) => {
  if (!comboActual.value) return
  console.log('Motivo de eliminación:', motivo)

  try {
    await deleteCombo(comboActual.value.id)
    modalEliminarVisible.value = false
    mostrarToast('Combo eliminado correctamente.', 'eliminar')
    await cargarCombos()
  } catch (err) {
    console.error('No se pudo eliminar el combo:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo eliminar el combo.'), 'error')
  }
}

// ---------------------------------------------------------------------------
// Imágenes
// ---------------------------------------------------------------------------
const modalImg = ref(false)
const imgActual = ref<string | null>(null)

const abrirModalImg = (img: string | null) => {
  imgActual.value = img
  modalImg.value = true
}

// ---------------------------------------------------------------------------
// Exportación a Excel
// ---------------------------------------------------------------------------
/** Tamaño de página para traer el catálogo completo antes de generar el archivo. */
const TAMANO_PAGINA_EXPORTACION = 20

/** Recorre todas las páginas con `getCombos` para que el Excel no se corte en la primera. */
const cargarCatalogo = async () => {
  const primera = await getCombos(1, TAMANO_PAGINA_EXPORTACION, '', 'name')
  const items = [...primera.items]

  for (let pagina = 2; pagina <= primera.totalPages; pagina++) {
    const siguiente = await getCombos(pagina, TAMANO_PAGINA_EXPORTACION, '', 'name')
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
      columns: definicionCombos.columnasExcel,
      titulo: definicionCombos.titulo,
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

onMounted(() => cargarCombos())
</script>

<template>
  <AppHeader/>
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <AppSidebar/>
    <div class="flex flex-1 flex-col overflow-hidden">
      <main class="flex-1 overflow-y-auto px-8 py-8">
        <CatalogHeader
          :titulo="definicionCombos.titulo"
          :subtitulo="definicionCombos.subtitulo"
          :texto-boton="definicionCombos.textoBoton"
          @agregar="modalInsertarVisible = true"
        />

        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="definicionCombos.categorias"
          @buscar="buscar"
          @limpiar="limpiarFiltro"
        />

        <CombosTable
          :combos="combos?.items ?? []"
          :total-registros="combos?.totalCount ?? 0"
          :pagina="paginaActual"
          :total-paginas="totalPaginas"
          :tamano-pagina="REGISTROS_POR_PAGINA"
          :exportando="exportando"
          @editar="abrirModalEditar"
          @eliminar="abrirModalEliminar"
          @ver-contenido="verContenido"
          @ver-imagen="abrirModalImg"
          @exportar="exportarTabla"
          @cambiar-pagina="cambiarPagina"
        />

        <CombosModals
          v-if="modalInsertarVisible"
          :is-insert="true"
          :modal-title="'Crear Combo'"
          :modal-subtitle="'Ingrese los datos del combo'"
          @close="modalInsertarVisible = false"
          @insert="insertarCombo"
        />

        <CombosModals
          v-if="modalEditarVisible"
          :modal-title="'Modificar Combo'"
          :modal-subtitle="'Cambie los datos del combo'"
          :combo="comboActual ?? undefined"
          @close="modalEditarVisible = false"
          @update="actualizarCombo"
        />

        <CombosModals
          v-if="modalEliminarVisible"
          :is-delete="true"
          :combo="comboActual ?? undefined"
          @close="modalEliminarVisible = false"
          @delete="eliminarCombo"
        />

        <CombosModals
          v-if="modalContenidoVisible"
          :is-action="true"
          :combo="comboActual ?? undefined"
          @close="modalContenidoVisible = false"
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