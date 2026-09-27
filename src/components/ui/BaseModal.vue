<script setup lang="ts">
/**
 * Modal global: overlay, cabecera, cuerpo con scroll y pie con los botones.
 * Cada modal de la app solo se ocupa del contenido de su formulario.
 */
import { onUnmounted, watch, type Component } from 'vue'
import { CheckCircle, Loader2, X } from 'lucide-vue-next'
import BaseAlert from '@/components/ui/BaseAlert.vue'

type ModalSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle?: string
    icon?: Component
    size?: ModalSize
    /** Bloquea el cierre y el botón de guardar mientras la petición corre. */
    loading?: boolean
    error?: string
    success?: string
    submitText?: string
    cancelText?: string
  }>(),
  {
    size: 'md',
    loading: false,
    error: '',
    success: '',
    submitText: 'Guardar',
    cancelText: 'Cancelar',
  },
)

const emit = defineEmits<{
  close: []
  submit: []
}>()

const ANCHO: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

/** No se puede cerrar en medio de un guardado. */
function cerrar() {
  if (!props.loading) emit('close')
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') cerrar()
}

watch(
  () => props.open,
  (abierto) => {
    document.body.style.overflow = abierto ? 'hidden' : ''
    if (abierto) window.addEventListener('keydown', onEscape)
    else window.removeEventListener('keydown', onEscape)
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onEscape)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px)"
        @click.self="cerrar"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          class="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          :class="ANCHO[size]"
        >
          <header class="flex items-start justify-between gap-4 border-b border-neutral-100 px-8 py-6">
            <div class="flex items-center gap-4">
              <div
                v-if="icon"
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50"
              >
                <component :is="icon" :size="24" class="text-primary-600" />
              </div>
              <div>
                <h2 class="text-xl font-bold tracking-tight text-secondary-900">{{ title }}</h2>
                <p v-if="subtitle" class="mt-0.5 text-sm text-neutral-500">{{ subtitle }}</p>
              </div>
            </div>

            <button
              type="button"
              :disabled="loading"
              class="rounded-xl p-2 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-secondary-700 disabled:opacity-40"
              aria-label="Cerrar"
              @click="cerrar"
            >
              <X :size="22" />
            </button>
          </header>

          <div class="flex-1 overflow-y-auto px-8 py-6">
            <BaseAlert v-if="error" :message="error" variant="error" />
            <BaseAlert v-else-if="success" :message="success" variant="success" />

            <slot />
          </div>

          <footer
            class="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-100 px-8 py-5"
          >
            <slot
              name="footer"
              :close="cerrar"
              :submit="() => emit('submit')"
              :loading="loading"
            >
              <button
                type="button"
                :disabled="loading"
                class="rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-secondary-700 transition-colors hover:bg-neutral-200 disabled:opacity-50"
                @click="cerrar"
              >
                {{ cancelText }}
              </button>

              <button
                type="button"
                :disabled="loading || !!success"
                class="flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary-700 active:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
                @click="emit('submit')"
              >
                <Loader2 v-if="loading" :size="18" class="animate-spin" />
                <CheckCircle v-else-if="success" :size="18" />
                <slot name="submitIcon" />

                <span>{{ loading ? 'Guardando…' : submitText }}</span>
              </button>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  animation: modalIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.93) translateY(16px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
