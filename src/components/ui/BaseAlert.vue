<script setup lang="ts">
import { AlertCircle, CheckCircle } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    variant?: 'error' | 'success'
    message: string
  }>(),
  {
    variant: 'error',
  },
)

/** Un solo lugar decide el color de cada tipo de aviso. */
const ESTILOS = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-green-200 bg-green-50 text-green-700',
}
</script>

<template>
  <div
    class="mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm"
    :class="ESTILOS[variant]"
    role="alert"
  >
    <AlertCircle v-if="variant === 'error'" :size="18" class="mt-0.5 shrink-0 text-red-500" />
    <CheckCircle v-else :size="18" class="mt-0.5 shrink-0 text-green-500" />
    <span>{{ message }}</span>
  </div>
</template>
