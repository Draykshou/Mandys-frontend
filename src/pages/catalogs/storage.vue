<script setup lang="ts"> 
import { ref, onMounted, computed, watch, reactive} from 'vue'

// UI Externa
import AppHeader from '@/components/AppHeader.vue'
import appSidebar from '@/components/AppSidebar.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'
import AppToast from '@/components/AppToast.vue'
import { useToast } from '@/composables/useToast'

// Services y tipos
import useAuth from '@/composables/useAuth'
import { useExportCatalog } from '@/composables/useExportCatalog'
import { getStorage, putStorage, inStorage, putOneStorage, outStorage, getOneStorage, inOneStorage, outOneStorage, getOneStorageHistory, getStorageHistory} from '@/service/StorageService'
import { getBranches } from '@/service/BranchesService'
import type { Storages, StoragesHistory, Storage, StorageIn, StorageOut } from '@/types/Storage'
import type { Branch } from '@/types/BranchesDtos'
import type { CatalogColumn, CatalogRow } from '@/types/CatalogColumns/catalog'

// UI interna
import StorageHeader from '@/components/storage/StorageHeader.vue'
import storageTable from '@/components/storage/storageTable.vue'
import StorageModals from '@/components/storage/StorageModals.vue'
import StorageUpdateModal from '@/components/storage/StorageUpdateModal.vue'
import StorageHistoryTable from '@/components/storage/StorageHistoryTable.vue'
import axios from 'axios'


definePage({
  meta: { roles: ["Administrador", "Gerente de Operaciones", "Encargado de Almacen Central", "Encargado de Almacen"] },
});

// toast
const { state: toast, mostrar: mostrarToast, cerrar: cerrarToast } = useToast()


// Filtro
const categoriasFiltro = ['Todos', 'Alfabetico A-Z', 'Alfabetico Z-A', 'Cantidad de Stock (ascendente)', 'Cantidad de Stock (descendente)', 'Mayor costo', 'Menor costo', 'Es Insumo', 'No es Insumo', 'Mas reciente', 'Mas antiguo']

const filtro = reactive({
  busqueda: '',
  categoria: categoriasFiltro[0],
})


function limpiarFiltro() {
  filtro.busqueda = ''
  filtro.categoria = categoriasFiltro[0]
}

const search = async () => {
  await loadStorage(1)
}

const getStorageFilter = () => {
  let orderBy = ''
  let isSupply: boolean | null = null

  switch (filtro.categoria) {
    case 'Alfabetico A-Z':
      orderBy = 'description'
      break

    case 'Alfabetico Z-A':
      orderBy = '-description'
      break
    case 'Cantidad de Stock (ascendente)':
      orderBy = 'currentStock'
      break
    case 'Cantidad de Stock (descendente)':
      orderBy = '-currentStock'
      break
    case 'Mayor costo':
      orderBy = '-costPrice'
      break
    case 'Menor costo':
      orderBy = 'costPrice'
      break
    case 'Es Insumo':
      isSupply = true
      break
    case 'No es Insumo':
      isSupply = false
      break
    case 'Mas reciente':
      orderBy = '-lastUpdated'
      break
    case 'Mas antiguo':
      orderBy = 'lastUpdated'
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


// Cargar sucusarl y definir parametros

const { state: auth} = useAuth()
const rolUsuario = computed(() => auth.value.user?.role ?? '')

const storages = ref<Storages | null>(null)
const storagesHistory = ref<StoragesHistory | null>(null)
const page = ref(1)
const totalPages = ref(1)

const branches = ref<Branch[]>([]);
const selectedBranchId = ref<number>();
const selectedBranchName = ref<string>('');
const selectedBranchType = ref<boolean>();

const storageColumns: CatalogColumn[] = [
  { key: 'product', label: 'Producto', type: 'text' },
  { key: 'unidad', label: 'Unidad', type: 'text' },
  { key: 'stockActual', label: 'Stock actual', type: 'text' },
  { key: 'stockMinimo', label: 'Stock mínimo', type: 'text' },
  { key: 'costo', label: 'Costo', type: 'currency' },
  { key: 'ultimaActualizacion', label: 'Última actualización', type: 'text' },
  { key: 'esInsumo', label: 'Es insumo', type: 'boolean' },
]

const historyColumns: CatalogColumn[] = [
  { key: 'tipoMovimiento', label: 'Tipo de movimiento', type: 'text' },
  { key: 'folio', label: 'Folio', type: 'text' },
  { key: 'producto', label: 'Producto', type: 'text' },
  { key: 'cantidad', label: 'Cantidad', type: 'text' },
  { key: 'costo', label: 'Costo', type: 'currency' },
  { key: 'fecha', label: 'Fecha', type: 'text' },
]

type Unidad = Storage['product']['measureUnit']
const CONVERSIONES: Record<Unidad, { etiqueta: string; factor: number }> = {
  Unidades: { etiqueta: 'u', factor: 1 },
  Kilogramos: { etiqueta: 'kg', factor: 1000 },
  Litros: { etiqueta: 'l', factor: 1000 },
}

const conversionPara = (unidad: unknown) => {
  const clave = typeof unidad === 'string' ? unidad.trim() : ''
  if (clave in CONVERSIONES) {
    return CONVERSIONES[clave as Unidad]
  }

  const unidadNormalizada = clave.toLowerCase()
  if (unidadNormalizada === 'kg' || unidadNormalizada === 'kilos') {
    return CONVERSIONES.Kilogramos
  }
  if (unidadNormalizada === 'l' || unidadNormalizada === 'litros') {
    return CONVERSIONES.Litros
  }

  return { etiqueta: clave || 'u', factor: 1 }
}

const stockParaReporte = (valor: number, unidad: unknown) => {
  const conversion = conversionPara(unidad)
  return `${valor / conversion.factor} ${conversion.etiqueta}`
}

const costoParaReporte = (valor: number, unidad: unknown) =>
  valor * conversionPara(unidad).factor

const { exportar } = useExportCatalog()

const loadBranches = async () => {
  try {
    const { items } = await getBranches(1, 40, '', 'id');
    branches.value = items;

    // Seleccionar la primera sucursal por defecto
    if (branches.value.length > 0 && (rolUsuario.value === "Administrador" || rolUsuario.value === "Gerente de Operaciones")) {
      selectedBranchId.value = branches.value[0].id
      selectedBranchName.value = branches.value[0].name
      selectedBranchType.value = branches.value[0].warehouseOnly
      //console.log('Cargar sucursal: ' + selectedBranchId.value)
    }
    else if(branches.value.length > 0){
      selectedBranchId.value = auth.value.user?.branchId
      selectedBranchName.value = branches.value.find(b => b.id === selectedBranchId.value)?.name ?? '' 
      selectedBranchType.value = branches.value.find(b => b.id === selectedBranchId.value)?.warehouseOnly
      //console.log('Cargar sucursal con id: ' + selectedBranchId.value + '. Y nombre: ' + selectedBranchName.value)
    }
  } catch (error) {
    console.error('Error al cargar sucursales:', error);
  }
};

const loadStorage = async (p = 1) => {
  //console.log("Estoy cargando solo almacen")
  try {
    const { orderBy, isSupply } = getStorageFilter()

    if(rolUsuario.value !== "Administrador" && rolUsuario.value !== "Gerente de Operaciones"){
      storages.value = await getOneStorage(p, 20, filtro.busqueda, orderBy, isSupply)
    }
    else{
      storages.value = await getStorage(selectedBranchId.value as number, p, 20, filtro.busqueda, orderBy, isSupply)
    }
    console.log('Cargando inventario para la sucursal:', selectedBranchId.value)
    page.value = storages.value.page
    totalPages.value = storages.value.totalPages
    console.log('Inventario cargado:', storages.value)
  } catch (err) {
    console.error('No se pudo cargar el inventario:', err)
  }
}

const loadStorageHistory = async (p = 1) => {
  //console.log("Estoy cargando solo historial")
  try {
    if(rolUsuario.value !== "Administrador" && rolUsuario.value !== "Gerente de Operaciones"){
      storagesHistory.value = await getOneStorageHistory(p, 20, '', '-date')
    }
    else{
      storagesHistory.value = await getStorageHistory(selectedBranchId.value as number, p, 20, '', '-date')
    }
    console.log('Cargando inventario para la sucursal:', selectedBranchId.value)
    page.value = storagesHistory.value.page
    totalPages.value = storagesHistory.value.totalPages
    console.log('Inventario cargado:', storagesHistory.value)
  } catch (err) {
    console.error('No se pudo cargar el inventario:', err)
  }
}

watch(selectedBranchId, (newId) => {
  if (newId !== undefined) {
    if(inHistoryTable.value){
      //console.log("primero")
      loadStorageHistory(1)
    }
    else{
      //console.log("segundo")
      loadStorage(1)
    }
  }
})

const exportarInventario = () => {
  const filas: CatalogRow[] = (storages.value?.items ?? []).map((row) => ({
    id: row.id,
    product: row.product.description,
    unidad: conversionPara(row.product.measureUnit).etiqueta,
    stockActual: stockParaReporte(row.currentStock, row.product.measureUnit),
    stockMinimo: stockParaReporte(row.minimumStock, row.product.measureUnit),
    costo: costoParaReporte(row.product.costPrice, row.product.measureUnit),
    ultimaActualizacion: row.lastUpdated
      ? new Intl.DateTimeFormat('es-MX').format(new Date(row.lastUpdated))
      : '—',
    esInsumo: row.product.isSupply,
  }))
  void exportar(
    'excel',
    {
      columns: storageColumns,
      titulo: selectedBranchName.value ? `Inventario - ${selectedBranchName.value}` : 'Inventario',
    },
    async () => filas,
  )
}

const exportarHistorial = () => {
  const filas: CatalogRow[] = (storagesHistory.value?.items ?? []).flatMap((movimiento) =>
    movimiento.products.map((detalle, index) => ({
      id: `${movimiento.id}-${index}`,
      tipoMovimiento: movimiento.type === 'in' ? 'Entrada' : 'Salida',
      folio: movimiento.folio,
      producto: detalle.product.description,
      cantidad: stockParaReporte(detalle.quantity, detalle.product.measureUnit),
      costo: costoParaReporte(detalle.costPrice, detalle.product.measureUnit),
      fecha: movimiento.date
        ? new Intl.DateTimeFormat('es-MX').format(new Date(movimiento.date))
        : '—',
    })),
  )

  void exportar(
    'excel',
    {
      columns: historyColumns,
      titulo: selectedBranchName.value
        ? `Historial de almacén - ${selectedBranchName.value}`
        : 'Historial de almacén',
    },
    async () => filas,
  )
}

// Historial
const inHistoryTable = ref(false)

const abrirHistorial = async () => {
  if(!inHistoryTable.value){
    await loadStorageHistory()
    inHistoryTable.value = !inHistoryTable.value
  }
  else{
    await loadStorage()
    inHistoryTable.value = !inHistoryTable.value
  }
}

// Entradas y salidas

const storageUpdateModal = ref(false)
const storageInModal = ref(false)
const storageOutModal = ref(false)
const productoInicial = ref<Storage>()
const enterOnShortCut = ref(false)

const registrarEntrada = async (entrada: StorageIn) => {
  console.log(entrada)
  try{
    if(rolUsuario.value !== "Administrador"){
      await inOneStorage(entrada)
    }
    else{
      await inStorage(Number(selectedBranchId.value), entrada)
    }
    storageInModal.value = false
    mostrarToast('Entrada realizada correctamente','entrada')
  }
  catch(err){
    mostrarToast(obtenerMensajeError(err,'No se pudo realizar la entrada.'),'error')
  }
  await loadStorage()
}

const abrirEntrada = (row?: Storage) => {
  productoInicial.value = row
  enterOnShortCut.value = true
  storageInModal.value = true
}

const registrarSalida = async (salida: StorageOut) => {
  console.log(salida)
  try{
    if(rolUsuario.value !== "Administrador"){
      await outOneStorage(salida)
    }
    else{
      await outStorage(Number(selectedBranchId.value), salida)
    }
    mostrarToast('Salida realizada correctamente','salida')
    storageOutModal.value = false
  }
  catch(err){
    mostrarToast(obtenerMensajeError(err,'No se pudo realizar la salida.'),'error')
  }
  await loadStorage()
}

const abrirSalida = (row?: Storage) => {
  productoInicial.value = row
  enterOnShortCut.value = true
  storageOutModal.value = true
}

const closeModals = () => {
  storageInModal.value = false
  storageOutModal.value = false
  enterOnShortCut.value = false
}

const selectUpdateRow = ref<Storage>()

const updateModalEnabled = (row: Storage) => {
  //console.log('Actualizar stock mínimo para:', row)
  selectUpdateRow.value = row
  storageUpdateModal.value = true
}

const UpdateStorage = async (newStockMinimum: number) => {
  if (!selectUpdateRow.value) return;

  try {
    if(rolUsuario.value !== "Administrador"){
      await putOneStorage(selectUpdateRow.value.product.id, { minimumStock: newStockMinimum })
    }
    else{
      await putStorage(Number(selectedBranchId.value), selectUpdateRow.value.product.id, { minimumStock: newStockMinimum }); 
    }
    await loadStorage();
    mostrarToast('Stock Minimo actualizado correctamente','actualizar')
    storageUpdateModal.value = false;
  } catch (err) {
      console.error("No se pudo crear el producto:", err)
      mostrarToast(obtenerMensajeError(err,'No se pudo eliminar el Producto.'),'error')
  }
};

const obtenerMensajeError=(err:unknown,mensajeDefault:string)=>{
    if(axios.isAxiosError(err)){
        const mensaje=err.response?.data?.message
        if(typeof mensaje==='string'&&mensaje.trim()!==''){
            return mensaje
        }
    }
    return mensajeDefault
}

onMounted( async () => {
  await loadBranches()
  loadStorage();
})

</script>



<template>
  <AppHeader/>
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <appSidebar/>
    
    <div class="flex flex-1 flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto px-8 py-8">
        <StorageHeader
          :rol-usuario="rolUsuario"
          :branches="branches"
          v-model:selectedBranchId="selectedBranchId"
          :selected-branch-name="selectedBranchName"
          :in-history-table="inHistoryTable"
          @storage-in="storageInModal = true"
          @storage-out="storageOutModal = true"
          @storage-history="abrirHistorial"
        /> 

        <CatalogFilter
          v-if="!inHistoryTable"
          v-model:busqueda="filtro.busqueda"
          v-model:categoria="filtro.categoria"
          :categorias="categoriasFiltro"
          @buscar="search"
          @limpiar="limpiarFiltro"
        />

        <StorageModals
          v-if="storageInModal"
          modo="entrada"
          :rol-usuario="rolUsuario"
          :branch-id="selectedBranchId ?? 1"
          :branch-type="selectedBranchType ?? false"
          :producto-inicial="productoInicial"
          :is-short-cut="enterOnShortCut"
          @close="closeModals"
          @storage-in="registrarEntrada"
        />

        <StorageModals
          v-if="storageOutModal"
          modo="salida"
          :rol-usuario="rolUsuario"
          :branch-id="selectedBranchId ?? 1"
          :branch-type="selectedBranchType ?? false"
          :producto-inicial="productoInicial"
          :is-short-cut="enterOnShortCut"
          @close="closeModals"
          @storage-out="registrarSalida"
        />

        <StorageUpdateModal
          v-if="storageUpdateModal"
          :product-name="selectUpdateRow?.product.description ?? ''"
          :stock-minimum="selectUpdateRow?.minimumStock ?? 0"
          :measure-unit="selectUpdateRow?.product.measureUnit ?? ''"
          @close="storageUpdateModal = false"
          @save="UpdateStorage"
        />


        <storageTable
          v-if="!inHistoryTable"
          :rol-usuario="rolUsuario"
          :rows="storages?.items ?? []"
          :total-registros="storages?.totalCount ?? 0"
          :pagina="page"
          :total-paginas="totalPages"
          @cambiar-pagina="loadStorage"
          @editar="updateModalEnabled"
          @entrada="abrirEntrada"
          @salida="abrirSalida"
          @exportar="exportarInventario"
        />
        <StorageHistoryTable
          v-else
          :rows="storagesHistory?.items ?? []"
          :total-registros="storagesHistory?.totalCount ?? 0"
          :pagina="page"
          :total-paginas="totalPages"
          @exportar="exportarHistorial"
        />

        <AppToast
          :visible="toast.visible"
          :mensaje="toast.mensaje"
          :tipo="toast.tipo"
          :duracion="toast.duracion"
          @cerrar="cerrarToast"
        />
      </div>
    </div>
  </div>
</template>
