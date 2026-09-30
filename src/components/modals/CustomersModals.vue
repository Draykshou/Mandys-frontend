<script setup lang="ts">
import { computed, ref } from 'vue'

import DeleteModal from '@/components/DeleteModal.vue'

import type { Customer } from '@/types/CustomersDtos'

const props = defineProps<{
  isInsert?: boolean
  isDelete?: boolean
  modalTitle?: string
  modalSubtitle?: string
  customer?: Customer
  password?: string
}>()

const emit = defineEmits<{
  close: []
  insert: [string, string, string, string]
  update: [string, string, string]
  delete: []
}>()

const firstName = ref(props.customer?.firstName ?? '')
const lastName = ref(props.customer?.lastName ?? '')
const email = ref(props.customer?.email ?? '')
const password = ref(props.password ?? '')

const showDeleteModal = ref(false)

const puedeGuardar = computed(() => {
  return (
    firstName.value.trim() !== '' &&
    lastName.value.trim() !== '' &&
    email.value.trim() !== ''
  )
})

const guardar = () => {
  if (!puedeGuardar.value) return

  if (props.isInsert) {
    emit(
      'insert',
      firstName.value.trim(),
      lastName.value.trim(),
      email.value.trim(),
      password.value.trim()
    )
  } else {
    emit(
      'update',
      firstName.value.trim(),
      lastName.value.trim(),
      email.value.trim()
    )
  }
}

const abrirDeleteModal = () => {
  showDeleteModal.value = true
}

const cerrarDeleteModal = () => {
  showDeleteModal.value = false
}

const confirmarDelete = () => {
  emit('delete')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  >
    <div class="w-full max-w-lg rounded-card bg-neutral-50 shadow-xl">
      <div class="border-b border-neutral-200 px-6 py-5">
        <h2 class="text-title font-semibold text-secondary-800">
          {{ modalTitle }}
        </h2>

        <p class="mt-1 text-body text-neutral-500">
          {{ modalSubtitle }}
        </p>
      </div>

      <div v-if="!isDelete" class="space-y-5 px-6 py-6">
        <div>
          <label class="mb-2 block text-label font-medium text-secondary-800">
            Correo electrónico
          </label>

          <input
            v-model="email"
            type="email"
            class="w-full rounded-control border border-neutral-300 bg-neutral-50 px-3 py-2 outline-none focus:border-primary-500"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label class="mb-2 block text-label font-medium text-secondary-800">
            Nombre
          </label>

          <input
            v-model="firstName"
            type="text"
            class="w-full rounded-control border border-neutral-300 bg-neutral-50 px-3 py-2 outline-none focus:border-primary-500"
            placeholder="Nombre del cliente"
          />
        </div>

        <div>
          <label class="mb-2 block text-label font-medium text-secondary-800">
            Apellido
          </label>

          <input
            v-model="lastName"
            type="text"
            class="w-full rounded-control border border-neutral-300 bg-neutral-50 px-3 py-2 outline-none focus:border-primary-500"
            placeholder="Apellido del cliente"
          />
        </div>
      </div>

      <div
        v-else
        class="px-6 py-6 text-body text-secondary-800"
      >
        <p>
          ¿Está seguro de que desea eliminar este cliente?
        </p>
      </div>

      <div class="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4">
        <button
          type="button"
          class="rounded-control border border-neutral-300 px-4 py-2 text-label text-secondary-800 hover:bg-neutral-100"
          @click="emit('close')"
        >
          Cancelar
        </button>

        <button
          v-if="!isDelete"
          type="button"
          class="rounded-control bg-primary-600 px-4 py-2 text-label text-neutral-50 hover:bg-primary-700 disabled:opacity-40"
          :disabled="!puedeGuardar"
          @click="guardar"
        >
          {{ isInsert ? 'Crear' : 'Guardar' }}
        </button>

        <button
          v-else
          type="button"
          class="rounded-control bg-red-600 px-4 py-2 text-label text-neutral-50 hover:bg-red-700"
          @click="abrirDeleteModal"
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>

  <DeleteModal
    v-if="showDeleteModal"
    @close="cerrarDeleteModal"
    @delete="confirmarDelete"
  />
</template>