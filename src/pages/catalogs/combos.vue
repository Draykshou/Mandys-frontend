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
import type { CatalogColumn, CatalogRow } from '@/types/CatalogColumns/catalog'
import type { Combo, Combos, CreateCombo, UpdateCombo } from '@/types/CombosDtos'
import { postCombo, putCombo, deleteCombo, getCombos } from '@/service/CombosService'

const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()

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
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'price', label: 'Precio', type: 'currency' },
    { key: 'dishes', label: 'Cotenido', type: 'button' },
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
const modalActionEnable = ref(false)

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
  console.log(row)
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
    mostrarToast('Combo actualizado correctamente.', 'actualizar')
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
    mostrarToast('Combo eliminado correctamente.', 'eliminar')
    await loadCombos()
  } catch (err) {
    console.error('No se pudo eliminar el combo:', err)
    mostrarToast(obtenerMensajeError(err, 'No se pudo eliminar el combo.'), 'error')
  }
}

const seeContent = (row: CatalogRow) => {
  console.log("llega aquí", row)
  loadRowInformation(row)
  modalActionEnable.value = true
  console.log(modalActionEnable.value)
}

const changePage = async (page: number) => {
  await loadCombos(page)
}

const exportTable = () => {
}

const loadCombos = async (p = 1) => {
  try {
    combos.value = await getCombos(p, 5, '', "name")
    page.value = combos.value.page
    totalPages.value = combos.value.totalPages
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
          @editar="openModalUpdate"
          @eliminar="openModalDelete"
          @accion="seeContent"
          @exportar="exportTable"
          @cambiar-pagina="changePage"
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

        <CombosModals
          v-if="modalActionEnable"
          :is-action="true"
          @close="modalActionEnable = false"
          :combo="currentRow ?? undefined"
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