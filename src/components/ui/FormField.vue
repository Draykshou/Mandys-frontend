<script setup lang="ts">
/**
 * Envoltura de un campo: label, control y mensaje de error.
 * El control (input, select, textarea) se mete por el slot por defecto.
 */
withDefaults(
  defineProps<{
    label: string
    error?: string
    hint?: string
    required?: boolean
    /** 2 = ocupa todo el ancho en grids de dos columnas. */
    span?: 1 | 2
  }>(),
  {
    error: '',
    hint: '',
    span: 1,
  },
)
</script>

<template>
  <div :class="span === 2 ? 'md:col-span-2' : ''">
    <label class="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-600">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <slot />

    <p v-if="error" class="mt-1.5 text-xs font-medium text-red-500">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-xs text-neutral-400">{{ hint }}</p>
  </div>
</template>
