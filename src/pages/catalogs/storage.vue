<script setup lang="ts"> 
import { ref, onMounted, computed, watch} from 'vue'

// UI Externa
import AppHeader from '@/components/AppHeader.vue'
import appSidebar from '@/components/AppSidebar.vue'

// Services y tipos
import useAuth from '@/composables/useAuth'
import { getStorage, putStorage, inStorage, outStorage } from '@/service/StorageService'
import { getBranches } from '@/service/BranchesService'
import type { Storages, Storage, StorageIn, StorageOut } from '@/types/Storage'
import type { Branch } from '@/types/BranchesDtos'

// UI interna
import StorageHeader from '@/components/storage/StorageHeader.vue'
import storageTable from '@/components/storage/storageTable.vue'
import StorageModals from '@/components/storage/StorageModals.vue'
import StorageUpdateModal from '@/components/storage/StorageUpdateModal.vue'

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
    if (branches.value.length > 0) {
      selectedBranchId.value = branches.value[0].id;
      selectedBranchName.value = branches.value[0].name;
    }
  } catch (error) {
    console.error('Error al cargar sucursales:', error);
  }
};

const loadStorage = async (p = 1) => {
  try {
    console.log('Cargando inventario para la sucursal:', selectedBranchId.value)
    storages.value = await getStorage(selectedBranchId.value as number, p, 20, '', 'description', null)
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

const storageUpdateModal = ref(false)
const storageInModal = ref(false)
const storageOutModal = ref(false)
const productoInicial = ref<Storage>()
const enterOnShortCut = ref(false)

const registrarEntrada = async (entrada: StorageIn) => {
  console.log(entrada)
  await inStorage(Number(selectedBranchId.value), entrada)
  storageInModal.value = false
  await loadStorage()
}

const abrirEntrada = (row?: Storage) => {
  productoInicial.value = row
  enterOnShortCut.value = true
  storageInModal.value = true
}

const registrarSalida = async (salida: StorageOut) => {
  await outStorage(Number(selectedBranchId.value), salida)
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
          @storage-in="storageInModal = true"
          @storage-out="storageOutModal = true"
        /> 

        <StorageModals
          v-if="storageInModal"
          modo="entrada"
          :branch-id="Number(selectedBranchId)"
          :producto-inicial="productoInicial"
          :is-short-cut="enterOnShortCut"
          @close="closeModals"
          @storage-in="registrarEntrada"
        />

        <StorageModals
          v-if="storageOutModal"
          modo="salida"
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
