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

import type { CatalogColumn, CatalogRow } from '@/types/CatalogColumns/catalog'
import type { Customer, Customers, RegisterCustomer, UpdateCustomer} from '@/types/CustomersDtos'

import { postCustomer, putCustomer, getCustomers} from '@/service/CustomersService'

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
  categorias: ['Todos'],
  columns: [
    { key: 'email', label: 'Correo electrónico', type: 'text' },
    { key: 'firstName', label: 'Nombre', type: 'text' },
    { key: 'lastName', label: 'Apellido', type: 'text' },
    { key: 'hasLogin', label: 'Tiene acceso', type: 'boolean' },
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

function search() {
}

const modalInsertEnable = ref(false)
const modalUpdateEnable = ref(false)
const modalDeleteEnable = ref(false)

const currentRow = ref<Customer | null>(null)

const insertRow = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => {
  const customer: RegisterCustomer = {
    firstName,
    lastName,
    email,
    password
  }

  try {
    await postCustomer(customer)
    modalInsertEnable.value = false
    mostrarToast('Cliente creado correctamente.', 'exito')
    await loadCustomers(page.value)
  } catch (err) {
    console.error('No se pudo crear el cliente:', err)
    mostrarToast(
      obtenerMensajeError(err, 'No se pudo crear el cliente.'),
      'error'
    )
  }
}

const loadRowInformation = (row: CatalogRow) => {
  currentRow.value = {
    id: Number(row.id),
    firstName: String(row.firstName),
    lastName: String(row.lastName),
    email: String(row.email),
    hasLogin: row.hasLogin === true
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
  firstName: string,
  lastName: string,
  email: string
) => {
  if (!currentRow.value) return

  const customer: UpdateCustomer = {
    firstName,
    lastName,
    email
  }

  try {
    await putCustomer(currentRow.value.id, customer)
    modalUpdateEnable.value = false
    mostrarToast('Cliente actualizado correctamente.', 'exito')
    await loadCustomers(page.value)
  } catch (err) {
    console.error('No se pudo actualizar el cliente:', err)
    mostrarToast(
      obtenerMensajeError(err, 'No se pudo actualizar el cliente.'),
      'error'
    )
  }
}

const deleteRow = async () => {
}

const exportTable = () => {
}

const loadCustomers = async (pagina = 1) => {
  try {
    customers.value = await getCustomers(pagina, 20)
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
          :titulo="CustomerColumn.titulo"
          :subtitulo="CustomerColumn.subtitulo"
          :texto-boton="CustomerColumn.textoBoton"
          @agregar="modalInsertEnable = true"
        />

        <CatalogFilter
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="CustomerColumn.categorias"
          @buscar="search"
          @limpiar="cleanFilter"
        />

        <CatalogTable
          :titulo="CustomerColumn.titulo"
          :columns="CustomerColumn.columns"
          :rows="customers?.items ?? []"
          :total-registros="customers?.totalCount ?? 0"
          :pagina="page"
          :total-paginas="totalPages"
          @editar="openModalUpdate"
          @eliminar="openModalDelete"
          @exportar="exportTable"
          @cambiar-pagina="cambiarPagina"
        />

        <CustomersModals
          v-if="modalInsertEnable"
          :is-insert="true"
          :modal-title="'Crear Cliente'"
          :modal-subtitle="'Ingrese los datos del cliente'"
          @close="modalInsertEnable = false"
          @insert="insertRow"
        />

        <CustomersModals
          v-if="modalUpdateEnable"
          :modal-title="'Modificar Cliente'"
          :modal-subtitle="'Cambie los datos del cliente'"
          :customer="currentRow ?? undefined"
          @close="modalUpdateEnable = false"
          @update="updateRow"
        />

        <CustomersModals
          v-if="modalDeleteEnable"
          :is-delete="true"
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