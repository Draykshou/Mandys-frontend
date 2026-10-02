<script setup lang="ts">
import { computed, ref } from 'vue'
import { OctagonAlert } from 'lucide-vue-next'


import DeleteModal from '@/components/modals/DeleteModal.vue'
import type { Branch } from '@/types/BranchesDtos'

const props = defineProps<{
  isInsert?: boolean
  isDelete?: boolean
  modalTitle?: string
  modalSubtitle?: string
  branch?: Branch
}>()

const emit = defineEmits<{
  close: []
  insert: [string, string, boolean]
  update: [string, string, boolean]
  delete: [string]
}>()

const name = ref(props.branch?.name ?? '')
const address = ref(props.branch?.address ?? '')
const warehouseOnly = ref(props.branch?.warehouseOnly ?? false)

const showDeleteModal = ref(false)
const reason = ref('')

const validate = computed(() => {
  return name.value.trim() !== '' && address.value.trim() !== ''
})

const save = () => {
  if (!validate.value) return

  if (props.isInsert) {
    emit(
      'insert',
      name.value.trim(),
      address.value.trim(),
      warehouseOnly.value
    )
  } else {
    emit(
      'update',
      name.value.trim(),
      address.value.trim(),
      warehouseOnly.value
    )
  }
}

const confirmDelete = () => {
  console.log('Motivo de eliminación:', reason.value)
  showDeleteModal.value = false
  emit('delete', reason.value)
}

</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
    @click.self="emit('close')"
  >

    <!-- Modal de insertar / editar -->
    <div
      v-if="!isDelete" class="flex flex-col rounded-2xl shadow-2xl w-full max-w-xl bg-neutral-50 overflow-hidden" style="max-height: 92vh;">
      <!-- Encabezado del modal-->
      <div class="border-b border-neutral-200 p-4">
        <h1 class="text-secondary-800 text-2xl font-bold">
          {{ props.modalTitle }}
        </h1>
        <p class="text-neutral-700">
          {{ props.modalSubtitle }}
        </p>
      </div>

      <div v-if="!isDelete" class="space-y-5 px-6 py-6">
        <div>
          <label class="mb-2 block text-label font-medium text-secondary-800">
            Nombre
          </label>

          <input
            v-model="name"
            type="text"
            class="w-full rounded-control border border-neutral-300 bg-neutral-50 px-3 py-2 outline-none focus:border-primary-500"
            placeholder="Nombre de la sucursal"
          />
        </div>

        <div>
          <label class="mb-2 block text-label font-medium text-secondary-800">
            Dirección
          </label>

          <input
            v-model="address"
            type="text"
            class="w-full rounded-control border border-neutral-300 bg-neutral-50 px-3 py-2 outline-none focus:border-primary-500"
            placeholder="Dirección de la sucursal"
          />
        </div>

        <label class="flex cursor-pointer items-center gap-3">
          <input
            v-model="warehouseOnly"
            type="checkbox"
            class="h-4 w-4"
          />

          <span class="text-body text-secondary-800">
            Esta sucursal es únicamente almacén
          </span>
        </label>
      </div>
      <div
        class="flex justify-between py-4 px-10
               bg-neutral-100 border-t border-neutral-200"
      >
        <button
          type="button"
          class="bg-neutral-50 hover:bg-neutral-200
                 active:bg-neutral-300 border border-neutral-200
                 text-secondary-700 py-3 px-7 rounded-xl shadow-xl"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="!validate"
          class="bg-primary-600 hover:bg-primary-700
                 active:bg-primary-800 text-neutral-50
                 py-3 px-7 rounded-xl shadow-xl
                 disabled:bg-neutral-300
                 disabled:text-neutral-500
                 disabled:cursor-not-allowed
                 disabled:shadow-none"
          @click="save"
          >
          Guardar
        </button>
      </div>
    </div>

      <div
        v-if="isDelete && !showDeleteModal"
        class="w-full max-w-120 flex flex-col rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden m-8"
      >

        <!-- Encabezado -->
        <div class="bg-red-500 text-neutral-50 text-2xl text-center font-bold p-2">
          Eliminar Platillo
        </div>

        <!-- Contenido -->
        <div class="bg-neutral-50 flex flex-col items-center text-center px-8 pt-4">
          <OctagonAlert :size="80" class="text-red-500"/>
          <h2 class="text-red-500 font-bold text-xl pt-4">
            ATENCIÓN
          </h2>
          <p class="text-secondary-700">
            Estás tratando de eliminar el platillo:
            <span class="font-bold text-secondary-800">
              {{ name }}
            </span>
            <br />
            ¿Estás seguro que deseas realizar esta acción?
          </p>
        </div>
        <!-- Botones -->
        <div
          class="bg-neutral-50 flex justify-between px-8 pt-4 pb-4">
          <button
            type="button"
            class="bg-neutral-50 hover:bg-neutral-200
                  border hover:border-primary-600
                  active:bg-neutral-300 border-neutral-200
                  text-primary-600 py-3 px-7
                  rounded-xl shadow-xl"
            @click="emit('close')"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="bg-red-500 hover:bg-red-600
                  active:bg-red-700 border-neutral-200
                  text-neutral-50 py-3 px-7
                  rounded-xl shadow-xl"
            @click="showDeleteModal = true"
          >
            Confirmar
          </button>
        </div>
      </div>

    <DeleteModal
      v-if="showDeleteModal"
      @cancelar="emit('close')"
      @confirmar="confirmDelete"
    />

  </div>
</template>