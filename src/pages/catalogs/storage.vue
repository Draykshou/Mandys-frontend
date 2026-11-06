<script setup lang="ts"> 
import { ref, onMounted} from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import appSidebar from '@/components/AppSidebar.vue'
import CatalogHeader from '@/components/CatalogHeader.vue'
import storageTable from '@/components/storage/storageTable.vue'
import type { Storage } from '@/types/Storage'
import { getStorageMock } from '@/mocks/storageMock'


const storage = ref<Storage | null>(null)
const page = ref(1)
const totalPages = ref(1)

const loadStorage = async (p = 1) => {
  try {
    storage.value = await getStorageMock(p, 5)
    page.value = storage.value.page
    totalPages.value = storage.value.totalPages
  } catch (err) {
    console.error('No se pudo cargar el inventario:', err)
  }
}

onMounted(() => loadStorage())




</script>



<template>
  <AppHeader/>
  <div class="flex h-screen bg-neutral-100 text-secondary-800 pt-16">
    <appSidebar/>
    
    <div class="flex flex-1 flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto px-8 py-8">
        <CatalogHeader
          :titulo="'Gestion de almacen'"
          :subtitulo="'Gestiona las entradas y salidas'"
          :texto-boton="'Generar entrada'"
        /> 

        <storageTable
          :rows="storage?.items ?? []"
          :total-registros="storage?.totalCount ?? 0"
          :pagina="page"
          :total-paginas="totalPages"
          @cambiar-pagina="loadStorage"
        />
        
      </div>
    </div>
  </div>
</template>
