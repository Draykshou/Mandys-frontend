<script setup lang="ts"> 
import { ref, onMounted, computed, watch, reactive} from 'vue'

// UI Externa
import AppHeader from '@/components/AppHeader.vue'
import appSidebar from '@/components/AppSidebar.vue'
import CatalogFilter from '@/components/CatalogFilter.vue'

// Services y tipos
import useAuth from '@/composables/useAuth'
import { getStorage, putStorage, inStorage, outStorage, getOneStorage, inOneStorage, outOneStorage} from '@/service/StorageService'
import { getBranches } from '@/service/BranchesService'
import type { Storages, Storage, StorageIn, StorageOut } from '@/types/Storage'
import type { Branch } from '@/types/BranchesDtos'

// UI interna
import StorageHeader from '@/components/storage/StorageHeader.vue'
import storageTable from '@/components/storage/storageTable.vue'
import StorageModals from '@/components/storage/StorageModals.vue'
import StorageUpdateModal from '@/components/storage/StorageUpdateModal.vue'

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
const page = ref(1)
const totalPages = ref(1)

const branches = ref<Branch[]>([]);
const selectedBranchId = ref<number>();
const selectedBranchName = ref<string>('');

const loadBranches = async () => {
  try {
    const { items } = await getBranches(1, 40, '', 'id');
    branches.value = items;

    // Seleccionar la primera sucursal por defecto
    if (branches.value.length > 0 && (rolUsuario.value === "Encargado de Almacen Central" || rolUsuario.value === "Administrador")) {
      selectedBranchId.value = branches.value[0].id;
      selectedBranchName.value = branches.value[0].name;
      console.log('Cargar sucursal: ' + selectedBranchId.value)
    }
    else if(branches.value.length > 0 && rolUsuario.value === "Encargado de Almacen"){
      selectedBranchId.value = auth.value.user?.branchId
      selectedBranchName.value = branches.value.find(b => b.id === selectedBranchId.value)?.name ?? '' 
      console.log('Cargar sucursal con id: ' + selectedBranchId.value + '. Y nombre: ' + selectedBranchName.value)
    }
  } catch (error) {
    console.error('Error al cargar sucursales:', error);
  }
};

const loadStorage = async (p = 1) => {
  try {
    const { orderBy, isSupply } = getStorageFilter()

    if(rolUsuario.value === "Encargado de Almacen"){
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

watch(selectedBranchId, (newId) => {
  if (newId !== undefined) {
    loadStorage(1)
  }
})

// Entradas y salidas

const storageUpdateModal = ref(false)
const storageInModal = ref(false)
const storageOutModal = ref(false)
const productoInicial = ref<Storage>()
const enterOnShortCut = ref(false)

const registrarEntrada = async (entrada: StorageIn) => {
  console.log(entrada)
  if(rolUsuario.value === "Encargado de Almacen"){
    await inOneStorage(entrada)
  }
  else{
    await inStorage(Number(selectedBranchId.value), entrada)
  }
  storageInModal.value = false
  await loadStorage()
}

const abrirEntrada = (row?: Storage) => {
  productoInicial.value = row
  enterOnShortCut.value = true
  storageInModal.value = true
}

const registrarSalida = async (salida: StorageOut) => {
  if(rolUsuario.value === "Encargado de Almacen"){
    await outOneStorage(salida)
  }
  else{
    await outStorage(Number(selectedBranchId.value), salida)
  }
  storageOutModal.value = false
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
  console.log('Actualizar stock mínimo para:', row)
  selectUpdateRow.value = row
  storageUpdateModal.value = true
}

const UpdateStorage = async (newStockMinimum: number) => {
  if (!selectUpdateRow.value) return;

  try {
    console.log(`Stock mínimo actualizado para el producto ${selectUpdateRow.value.product.id}: ${newStockMinimum}`);
    await putStorage(Number(selectedBranchId.value), selectUpdateRow.value.product.id, { minimumStock: newStockMinimum });
    storageUpdateModal.value = false;
    await loadStorage();
  } catch (error) {
    console.error('Error al actualizar el stock mínimo:', error);
  }
};

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
          @storage-in="storageInModal = true"
          @storage-out="storageOutModal = true"
        /> 

        <CatalogFilter
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
          :branch-id="Number(selectedBranchId)"
          :producto-inicial="productoInicial"
          :is-short-cut="enterOnShortCut"
          @close="closeModals"
          @storage-in="registrarEntrada"
        />

        <StorageModals
          v-if="storageOutModal"
          modo="salida"
          :rol-usuario="rolUsuario"
          :branch-id="Number(selectedBranchId)"
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
          :rows="storages?.items ?? []"
          :total-registros="storages?.totalCount ?? 0"
          :pagina="page"
          :total-paginas="totalPages"
          @cambiar-pagina="loadStorage"
          @editar="updateModalEnabled"
          @entrada="abrirEntrada"
          @salida="abrirSalida"
        />
      </div>
    </div>
  </div>
</template>
