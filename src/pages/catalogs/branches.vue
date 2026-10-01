<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import BranchesModals from '@/components/modals/BranchesModals.vue'
import { useToast } from '@/composables/useToast'

import type { CatalogColumn, CatalogRow } from '@/types/CatalogColumns/catalog'
import type { Branch, Branches, CreateBranch, UpdateBranch } from '@/types/BranchesDtos'

import { postBranch, putBranch, deleteBranch, getBranches} from '@/service/BranchesService'

const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

interface CatalogoDef {
  titulo: string
  subtitulo: string
  textoBoton: string
  categorias: string[]
  columns: CatalogColumn[]
}

const BranchColumn: CatalogoDef = {
  titulo: 'Sucursales',
  subtitulo: 'Gestión de las sucursales del restaurante',
  textoBoton: 'Agregar Sucursal',
  categorias: ['Todos'],
  columns: [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'address', label: 'Dirección', type: 'text' },
    { key: 'warehouseOnly', label: 'Solo almacén', type: 'boolean' },
  ],
}

const branches = ref<Branches | null>(null)

const page = ref(1)
const totalPages = ref(1)

const filtro = reactive({
  busqueda: '',
  categoria: BranchColumn.categorias[0],
})

function cleanFilter() {
  filtro.busqueda = ''
  filtro.categoria = BranchColumn.categorias[0]
}

function search() {
}

const modalInsertEnable = ref(false)
const modalUpdateEnable = ref(false)
const modalDeleteEnable = ref(false)

const currentRow = ref<Branch | null>(null)

const insertRow = async (
  name: string,
  address: string,
  warehouseOnly: boolean
) => {
  const branch: CreateBranch = {
    name,
    address,
    warehouseOnly
  }

  try {
    await postBranch(branch)
    modalInsertEnable.value = false
    mostrarToast('Sucursal creada correctamente.', 'exito')
    await loadBranches(page.value)
  } catch (err) {
    console.error('No se pudo crear la sucursal:', err)
    mostrarToast(
      obtenerMensajeError(err, 'No se pudo crear la sucursal.'),
      'error'
    )
  }
}

const loadRowInformation = (row: CatalogRow) => {
  currentRow.value = {
    id: Number(row.id),
    name: String(row.name),
    address: String(row.address),
    warehouseOnly: row.warehouseOnly === true
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
  address: string,
  warehouseOnly: boolean
) => {
  if (!currentRow.value) return

  const branch: UpdateBranch = {
    name,
    address,
    warehouseOnly
  }

  try {
    await putBranch(currentRow.value.id, branch)
    modalUpdateEnable.value = false
    mostrarToast('Sucursal actualizada correctamente.', 'exito')
    await loadBranches(page.value)
  } catch (err) {
    console.error('No se pudo actualizar la sucursal:', err)
    mostrarToast(
      obtenerMensajeError(err, 'No se pudo actualizar la sucursal.'),
      'error'
    )
  }
}

const deleteRow = async (reason: string) => {
  console.log("Llega hasta el deleteRow")
  if (!currentRow.value) return

  console.log('Motivo de eliminación:', reason)

  try {
    await deleteBranch(currentRow.value.id)
    modalDeleteEnable.value = false
    mostrarToast('Sucursal eliminada correctamente.', 'exito')
    await loadBranches(page.value)
  } catch (err) {
    console.error('No se pudo eliminar la sucursal:', err)
    mostrarToast(
      obtenerMensajeError(err, 'No se pudo eliminar la sucursal.'),
      'error'
    )
  }
}

const exportTable = () => {
}

const loadBranches = async (pagina = 1) => {
  try {
    branches.value = await getBranches(pagina, 20)
    page.value = branches.value.page
    totalPages.value = branches.value.totalPages
  } catch (err) {
    console.error('No se pudieron cargar las sucursales:', err)
  }
}

const cambiarPagina = async (pagina: number) => {
  await loadBranches(pagina)
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

onMounted(() => loadBranches())
</script>

<template>
  <AppHeader />
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <AppSidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <main class="flex-1 overflow-y-auto px-8 py-8">
        <CatalogHeader
          :titulo="BranchColumn.titulo"
          :subtitulo="BranchColumn.subtitulo"
          :texto-boton="BranchColumn.textoBoton"
          @agregar="modalInsertEnable = true"
        />

        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="BranchColumn.categorias"
          @buscar="search"
          @limpiar="cleanFilter"
        />

        <CatalogTable
          :titulo="BranchColumn.titulo"
          :columns="BranchColumn.columns"
          :rows="branches?.items ?? []"
          :total-registros="branches?.totalCount ?? 0"
          :pagina="page"
          :total-paginas="totalPages"
          @editar="openModalUpdate"
          @eliminar="openModalDelete"
          @exportar="exportTable"
          @cambiar-pagina="cambiarPagina"
        />

        <BranchesModals
          v-if="modalInsertEnable"
          :is-insert="true"
          :modal-title="'Crear Sucursal'"
          :modal-subtitle="'Ingrese los datos de la sucursal'"
          @close="modalInsertEnable = false"
          @insert="insertRow"
        />

        <BranchesModals
          v-if="modalUpdateEnable"
          :modal-title="'Modificar Sucursal'"
          :modal-subtitle="'Cambie los datos de la sucursal'"
          :branch="currentRow ?? undefined"
          @close="modalUpdateEnable = false"
          @update="updateRow"
        />

        <BranchesModals
          v-if="modalDeleteEnable"
          :is-delete="true"
          :branch="currentRow ?? undefined"
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