<script setup lang="ts">
/**
 * Confirmación de cierre de sesión con cuenta regresiva.
 * Solo pinta; del temporizador se encarga quien lo usa (AppSidebar).
 */
import { computed } from 'vue'
import { TriangleAlert, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    visible: boolean
    segundos: number
    total?: number
    turno?: string
  }>(),
  {
    total: 10,
    turno: '',
  },
)

const emit = defineEmits<{
  permanecer: []
  confirmar: []
  cerrar: []
}>()

const progreso = computed(() => `${(props.segundos / props.total) * 100}%`)
</script>

<template>
  <Teleport to="body">
    <Transition name="logout-toast">
      <div
        v-if="visible"
        role="alertdialog"
        aria-modal="false"
        aria-label="Confirmar cierre de sesión"
        class="fixed right-6 top-6 z-100 w-[calc(100%-3rem)] max-w-md rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-lg"
      >
        <div class="flex items-start gap-3">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600"
          >
            <TriangleAlert :size="22" />
          </span>
          <span class="min-w-0 flex-1 leading-tight">
            <span class="block text-label font-bold text-secondary-800">
              ¿Cerrar sesión activa?
            </span>
            <span v-if="turno" class="block text-caption text-neutral-500">{{ turno }}</span>
          </span>
          <button
            type="button"
            title="Permanecer en sesión"
            aria-label="Permanecer en sesión"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-secondary-500 transition-colors hover:bg-neutral-100"
            @click="emit('cerrar')"
          >
            <X :size="18" />
          </button>
        </div>

        <p class="mt-3 text-sm leading-snug text-secondary-700">
          Haz clic en Cancelar para seguir operando. La sesión se cerrará de forma
          automática en <span class="font-bold text-primary-600">{{ segundos }}s</span>.
        </p>

        <div class="mt-3 h-2 w-full overflow-hidden rounded-pill bg-neutral-200">
          <div
            class="h-full rounded-pill bg-primary-600"
            :style="{ width: progreso, transition: 'width 1s linear' }"
          />
        </div>

        <div class="mt-4 flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-xl bg-neutral-200 py-2.5 text-label font-bold text-secondary-800 transition-colors hover:bg-neutral-300"
            @click="emit('permanecer')"
          >
            Permanecer
          </button>
          <button
            type="button"
            class="flex-1 rounded-xl bg-primary-600 py-2.5 text-label font-bold text-neutral-50 transition-colors hover:bg-primary-700"
            @click="emit('confirmar')"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
