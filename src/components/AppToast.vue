<script setup lang="ts">
/**
 * Toast global. Solo pinta y anima; del estado y del temporizador
 * se encarga useToast.
 */
import { computed, ref, type Component } from 'vue'
import { animate } from 'animejs'
import { AlertCircle, CheckCircle, Trash2, X } from 'lucide-vue-next'
import type { ToastTipo } from '@/types/Toast'

const props = withDefaults(
  defineProps<{
    visible: boolean
    mensaje: string
    tipo?: ToastTipo
    /** Segundos que dura el aviso; la barra se vacía en ese mismo tiempo. */
    duracion?: number
  }>(),
  {
    tipo: 'exito',
    duracion: 3200,
  },
)

const emit = defineEmits<{
  cerrar: []
}>()

const barra = ref<HTMLElement | null>(null)

/** Icono y color de cada acción, todo en un solo lugar. */
const ESTILOS: Record<ToastTipo, { icono: Component; caja: string; barra: string }> = {
  exito: {
    icono: CheckCircle,
    caja: 'border-green-200 bg-green-50 text-green-900',
    barra: 'bg-green-500',
  },
  eliminar: {
    icono: Trash2,
    caja: 'border-red-200 bg-red-50 text-red-900',
    barra: 'bg-red-500',
  },
  error: {
    icono: AlertCircle,
    caja: 'border-amber-200 bg-amber-50 text-amber-900',
    barra: 'bg-amber-500',
  },
}

const estilo = computed(() => ESTILOS[props.tipo])

// --- Animación (anime.js) ---------------------------------------------------
function alEntrar(el: Element, done: () => void) {
  animate(el, {
    opacity: [0, 1],
    x: [64, 0],
    scale: [0.92, 1],
    duration: 420,
    ease: 'out(3)',
    onComplete: done,
  })

  if (barra.value) {
    animate(barra.value, { width: ['0%', '100%'], duration: props.duracion, ease: 'linear' })
  }
}

function alSalir(el: Element, done: () => void) {
  animate(el, {
    opacity: 0,
    x: 48,
    scale: 0.95,
    duration: 220,
    ease: 'in(2)',
    onComplete: done,
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition :css="false" @enter="alEntrar" @leave="alSalir">
      <div
        v-if="visible"
        role="status"
        aria-live="polite"
        class="fixed right-6 top-6 z-100 flex w-80 items-start gap-3 overflow-hidden rounded-2xl border p-4 pr-9 shadow-lg"
        :class="estilo.caja"
      >
        <component :is="estilo.icono" :size="22" class="mt-0.5 shrink-0" />

        <p class="flex-1 text-sm font-medium leading-snug">{{ mensaje }}</p>

        <button
          type="button"
          class="absolute right-2 top-2 rounded-lg p-1 opacity-50 transition-opacity hover:opacity-100"
          aria-label="Cerrar"
          @click="emit('cerrar')"
        >
          <X :size="16" />
        </button>

        <span ref="barra" class="absolute bottom-0 left-0 h-1 w-0" :class="estilo.barra" />
      </div>
    </Transition>
  </Teleport>
</template>
