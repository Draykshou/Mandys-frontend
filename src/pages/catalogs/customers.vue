<script setup lang="ts">
import { reactive, ref, onMounted} from 'vue'
import axios from 'axios'

import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppToast from '@/components/AppToast.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import CatalogTable from '@/components/CatalogTable.vue'
import CustomersModals from '@/components/modals/CustomersModals.vue'
import { useToast } from '@/composables/useToast'
import { useExportCatalog } from '@/composables/useExportCatalog'

import type { CatalogColumn, CatalogRow } from '@/types/CatalogColumns/catalog'
import type { Customer, Customers} from '@/types/CustomersDtos'

import { deleteCustomer, getCustomers } from '@/service/CustomersService'

const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

interface CatalogoDef {
  titulo: string
  subtitulo: string
  textoBoton: string
  categorias: string[]
  columns: CatalogColumn[]
}

const CustomerColumn: CatalogoDef = {
  titulo: 'Clientes',
  subtitulo: 'Gestión de los clientes del restaurante',
  textoBoton: 'Agregar Cliente',
  categorias: ['Alfabetico A-Z', 'Alfabetico Z-A'],
  columns: [
    { key: 'email', label: 'Correo electrónico', type: 'text' },
    { key: 'firstName', label: 'Nombre', type: 'text' },
    { key: 'lastName', label: 'Apellido', type: 'text' },
  ],
}

const customers = ref<Customers | null>(null)

const page = ref(1)
const totalPages = ref(1)

const filtro = reactive({
  busqueda: '',
  categoria: CustomerColumn.categorias[0],
})

function cleanFilter() {
  filtro.busqueda = ''
  filtro.categoria = CustomerColumn.categorias[0]
}

const search = async () => {
  await loadCustomers(1)
}

const getProductFilters = () => {
  let orderBy = ''
  switch (filtro.categoria) {
    case 'Alfabetico A-Z':
      orderBy = 'lastName'
      break

    case 'Alfabetico Z-A':
      orderBy = '-lastName'
      break

    default:
      orderBy = 'lastName'
      break
  }

  return {
    orderBy
  }
}

const modalDeleteEnable = ref(false)

const currentRow = ref<Customer | null>(null)

const loadRowInformation = (row: CatalogRow) => {
  currentRow.value = {
    id: Number(row.id),
    firstName: String(row.firstName),
    lastName: String(row.lastName),
    email: String(row.email)
  }
}

const openModalDelete = (row: CatalogRow) => {
  loadRowInformation(row)
  modalDeleteEnable.value = true
}

const deleteRow = async () => {
  if (!currentRow.value) return

  try {
    await deleteCustomer(currentRow.value.id)
    mostrarToast('Cliente eliminado correctamente', 'eliminar')
    modalDeleteEnable.value = false
    await loadCustomers(page.value)
  } catch (err) {
    const mensajeError = obtenerMensajeError(err, 'No se pudo eliminar el cliente')
    mostrarToast(mensajeError, 'error')
  }
}

/** Tamaño de página para traer el catálogo completo antes de generar el archivo. */
const PAGE_SIZE_EXPORT = 100

/** Recorre todas las páginas con `getCustomers` para que el Excel no se corte en la primera. */
const cargarCatalogo = async () => {
  const primera = await getCustomers(1, PAGE_SIZE_EXPORT, '')
  const items = [...primera.items]
  for (let pagina = 2; pagina <= primera.totalPages; pagina++) {
    const siguiente = await getCustomers(pagina, PAGE_SIZE_EXPORT, '')
    if (siguiente.items.length === 0) break
    items.push(...siguiente.items)
  }
  return items
}

const { exportar } = useExportCatalog()

const exportTable = () => {
  void exportar(
    'excel',
    {
      columns: CustomerColumn.columns,
      titulo: CustomerColumn.titulo,
    },
    cargarCatalogo,
  )
}

const loadCustomers = async (pagina = 1) => {
  try {
    const { orderBy } = getProductFilters()

    customers.value = await getCustomers(pagina, 20, filtro.busqueda, orderBy)
    page.value = customers.value.page
    totalPages.value = customers.value.totalPages
  } catch (err) {
    console.error('No se pudieron cargar los clientes:', err)
  }
}

const cambiarPagina = async (pagina: number) => {
  await loadCustomers(pagina)
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

onMounted(() => loadCustomers())
</script>

<template>
  <AppHeader />
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <AppSidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <main class="flex-1 overflow-y-auto px-8 py-8">
        <CatalogHeader
          :can-insert="false"
          :titulo="CustomerColumn.titulo"
          :subtitulo="CustomerColumn.subtitulo"
          :texto-boton="CustomerColumn.textoBoton"
        />

        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="CustomerColumn.categorias"
          @buscar="search"
          @limpiar="cleanFilter"
        />

        <CatalogTable
          :is-customer="true"
          :titulo="CustomerColumn.titulo"
          :columns="CustomerColumn.columns"
          :rows="customers?.items ?? []"
          :total-registros="customers?.totalCount ?? 0"
          :pagina="page"
          :total-paginas="totalPages"
          @eliminar="openModalDelete"
          @exportar="exportTable"
          @cambiar-pagina="cambiarPagina"
        />

        <CustomersModals
          v-if="modalDeleteEnable"
          :customer="currentRow ?? undefined"
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