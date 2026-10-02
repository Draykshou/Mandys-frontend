<script setup lang="ts">
import { ref } from 'vue'

import DeleteModal from '@/components/modals/DeleteModal.vue'

import type { Customer } from '@/types/CustomersDtos'

const props = defineProps<{
  customer?: Customer
}>()

const emit = defineEmits<{
  close: []
  delete: []
}>()

const email = ref(props.customer?.email ?? '')

const firstDeleteModel = ref(true)
const reasonModalEnable = ref(false)

const changeDeleteModal = () => {
  firstDeleteModel.value = false
  reasonModalEnable.value = true
}

</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
    @click.self="emit('close')"
  >
    <div
      v-if="firstDeleteModel"
      class="w-full max-w-120 flex flex-col rounded-2xl shadow-2xl bg-neutral-50 overflow-hidden m-8"
    >
      <div class="bg-red-500 text-neutral-50 text-2xl text-center font-bold p-2">
        Eliminar Combo
      </div>

      <div class="bg-neutral-50 flex flex-col items-center text-center px-8 pt-4">
        <OctagonAlert :size="80" class="text-red-500" />

        <h2 class="text-red-500 font-bold text-xl pt-4">
          ATENCIÓN
        </h2>

        <p class="text-secondary-700">
          Estás tratando de eliminar el cliente con correo electrónico:
          <span class="font-bold text-secondary-800">{{ email }}</span>
          <br />
          ¿Estás seguro que deseas realizar esta acción?
        </p>
      </div>

      <div class="bg-neutral-50 flex justify-between px-8 pt-4 pb-4">
        <button
          type="button"
          class="bg-neutral-50 hover:bg-neutral-200 border hover:border-primary-600 active:bg-neutral-300 border-neutral-200 text-primary-600 py-3 px-7 rounded-xl shadow-xl"
          @click="emit('close')"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="bg-red-500 hover:bg-red-600 active:bg-red-700 border-neutral-200 text-neutral-50 py-3 px-7 rounded-xl shadow-xl"
          @click="changeDeleteModal"
        >
          Confirmar
        </button>
      </div>
    </div>

    <DeleteModal
      v-if="reasonModalEnable"
      @cancelar="emit('close')"
      @confirmar="emit('delete')"
    />
  </div>
</template>