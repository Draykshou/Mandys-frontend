<script setup lang="ts">
import { reactive, ref, onMounted, type Component } from 'vue'
import axios from 'axios'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import CombosModals from '@/components/modals/CombosModals.vue'
import { useToast } from '@/composables/useToast'
import { useExportCatalog } from '@/composables/useExportCatalog'
import type { ToastTipo } from '@/types/Toast'
import type { CatalogColumn, CatalogRow } from '@/types/CatalogColumns/catalog'
import type { Combo, Combos, CreateCombo, UpdateCombo } from '@/types/CombosDtos'
import { CheckCircle, Trash2, AlertCircle } from 'lucide-vue-next'
import { postCombo, putCombo, deleteCombo, getCombos } from '@/service/CombosService'

const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

const ESTILOS: Record<ToastTipo, { icono: Component; caja: string; barra: string }> = {
  exito: {
    icono: CheckCircle,
    caja: 'border-green-200 bg-green-50 text-green-900',
    barra: 'bg-green-500',
  },
  eliminar: {
    icono: Trash2,
    caja: 'border-red-200 bg-red-50 text-red-900',
    barra: 'bg-red-500',
  },
  error: {
    icono: AlertCircle,
    caja: 'border-red-200 bg-red-50 text-red-900',
    barra: 'bg-red-500',
  },
}

interface CatalogoDef {
  titulo: string
  subtitulo: string
  textoBoton: string
  categorias: string[]
  columns: CatalogColumn[]
}

const combos = ref<Combos | null>(null)

const CombosColumn: CatalogoDef = {
  titulo: 'Combos',
  subtitulo: 'Gestión de los combos del restaurante',
  textoBoton: 'Agregar Combo',
  categorias: ['Todos'],
  columns: [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'price', label: 'Precio', type: 'currency' },
    { key: 'dishes', label: 'Platillos', type: 'button' },
    { key: 'products', label: 'Productos', type: 'button' },
  ],
}

const page = ref(1)
const totalPages = ref(1)

const filtro = reactive({
  busqueda: '',
  categoria: CombosColumn.categorias[0],
})

function cleanFilter() {
  filtro.busqueda = ''
  filtro.categoria = CombosColumn.categorias[0]
}

function search() {
}

const modalInsertEnable = ref(false)
const modalUpdateEnable = ref(false)
const modalDeleteEnable = ref(false)

const currentRow = ref<Combo | null>(null)

const insertRow = async (
  name: string,
  price: number,
  dishes: CreateCombo['dishes'],
  products: CreateCombo['products']
) => {
  const combo: CreateCombo = {
    name,
    price,
    dishes,
    products
  }
  try {
    await postCombo(combo)
    modalInsertEnable.value = false
    mostrarToast('Combo creado correctamente.', 'exito')
    await loadCombos()
  } catch (err) {
    console.error('No se pudo crear el combo:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo crear el combo.'), 'error')
  }
}

const loadRowInformation = (row: CatalogRow) => {
  currentRow.value = {
    id: Number(row.id),
    name: String(row.name),
    price: Number(row.price),
    dishes: row.dishes as Combo['dishes'],
    products: row.products as Combo['products']
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

const updateRow = async (
  name: string,
  price: number,
  dishes: UpdateCombo['dishes'],
  products: UpdateCombo['products']
) => {
  if (!currentRow.value) return
  const combo: UpdateCombo = {
    name,
    price,
    dishes,
    products
  }
  try {
    await putCombo(currentRow.value.id, combo)
    modalUpdateEnable.value = false
    mostrarToast('Combo actualizado correctamente.', 'exito')
    await loadCombos()
  } catch (err) {
    console.error('No se pudo actualizar el combo:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo actualizar el combo.'), 'error')
  }
}

const deleteRow = async (reason: string) => {
  if (!currentRow.value) return
  console.log('Motivo de eliminación:', reason)
  try {
    await deleteCombo(currentRow.value.id)
    modalDeleteEnable.value = false
    mostrarToast('Combo eliminado correctamente.', 'exito')
    await loadCombos()
  } catch (err) {
    console.error('No se pudo eliminar el combo:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo eliminar el combo.'), 'error')
  }
}

/** `getCombos` ya devuelve el catálogo tal como lo muestra la tabla. */
const cargarCatalogo = async () => (await getCombos()).items

const { exportando, exportar } = useExportCatalog()

const exportTable = () => {
  void exportar(
    'pdf',
    {
      columns: CombosColumn.columns,
      titulo: CombosColumn.titulo,
    },
    cargarCatalogo,
  )
}

const loadCombos = async () => {
  try {
    combos.value = await getCombos()
    page.value = combos.value.page
    totalPages.value = combos.value.totalPage
    console.log(combos.value)
  } catch (err) {
    console.error('No se pudieron cargar los combos:', err)
  }
}

const obtenerMensajeError = (err: unknown, mensajeDefault: string) => {
  if (axios.isAxiosError(err)) {
    const mensaje = err.response?.data?.message
    if (typeof mensaje === 'string' && mensaje.trim() !== '') {
      return mensaje
    }
  }
  return mensajeDefault
}

onMounted(loadCombos)
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
          @agregar="modalInsertEnable = true"
        />
        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="CombosColumn.categorias"
          @buscar="search"
          @limpiar="cleanFilter"
        />
        <CatalogTable
          :titulo="CombosColumn.titulo"
          :columns="CombosColumn.columns"
          :rows="combos?.items ?? []"
          :total-registros="combos?.totalCount ?? 0"
          :pagina="page"
          :total-paginas="totalPages"
          formato-export="pdf"
          :exportando="exportando"
          @editar="openModalUpdate"
          @eliminar="openModalDelete"
          @exportar="exportTable"
          @cambiar-pagina="(p) => (page = p)"
        />
        <CombosModals
          v-if="modalInsertEnable"
          :is-insert="true"
          :modal-title="'Crear Combo'"
          :modal-subtitle="'Ingrese los datos del combo'"
          @close="modalInsertEnable = false"
          @insert="insertRow"
        />
        <CombosModals
          v-if="modalUpdateEnable"
          :modal-title="'Modificar Combo'"
          :modal-subtitle="'Cambie los datos del combo'"
          :combo="currentRow ?? undefined"
          @close="modalUpdateEnable = false"
          @update="updateRow"
        />
        <CombosModals
          v-if="modalDeleteEnable"
          :is-delete="true"
          :combo="currentRow ?? undefined"
          @close="modalDeleteEnable = false"
          @delete="deleteRow"
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