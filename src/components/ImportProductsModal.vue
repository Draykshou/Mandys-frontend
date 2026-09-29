<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, CircleAlert, CircleCheck, FileSpreadsheet, Loader, Upload } from 'lucide-vue-next'
import { useImportProducts } from '@/composables/useImportProducts'
import { formatCurrency } from '@/utils/format'

/**
 * Modal de importación masiva de productos.
 *
 * Sigue el patrón visual de `ProductsModals.vue`: fondo difuminado,
 * encabezado con borde inferior y barra de acciones con Cancelar / acción
 * principal en `shadow-xl`.
 */
const emit = defineEmits<{
  close: []
  /** Se dispara cuando el backend respondió, para recargar el catálogo. */
  completado: [exitosos: number]
}>()

const {
  estado,
  filas,
  nombreArchivo,
  errorDeArchivo,
  errorMsg,
  resumen,
  truncado,
  total,
  validas,
  conError,
  importando,
  puedeConfirmar,
  seleccionarArchivo,
  confirmar,
} = useImportProducts()

const inputArchivo = ref<HTMLInputElement | null>(null)

/** Input oculto y disparado por una etiqueta, así conserva el `accept`. */
function abrirSelector() {
  inputArchivo.value?.click()
}

async function alElegirArchivo(event: Event) {
  const input = event.target as HTMLInputElement
  const archivo = input.files?.[0]
  // Se limpia para que elegir otra vez el mismo archivo vuelva a disparar change.
  input.value = ''
  if (archivo) await seleccionarArchivo(archivo)
}

async function alConfirmar() {
  if (await confirmar()) emit('completado', resumen.value?.exitosos ?? 0)
}

const leyendo = computed(() => estado.value === 'leyendo')
const hayPreview = computed(() => estado.value === 'listo' || estado.value === 'importando')
</script>

<template>
  <!-- Fondo -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
    @click.self="emit('close')"
  >
    <div
      class="flex flex-col rounded-2xl shadow-2xl w-full max-w-5xl bg-neutral-50 overflow-hidden"
      style="max-height: 92vh;"
    >
      <!-- Encabezado del modal -->
      <div class="border-b border-neutral-200 p-4">
        <h1 class="text-secondary-800 text-2xl font-bold">Importar productos</h1>
        <p class="text-neutral-700">Carga un archivo .xlsx con una fila por producto.</p>
      </div>

      <!-- Contenido -->
      <div class="flex-1 overflow-y-auto">
        <div class="px-8 pt-4 pb-2">
          <label class="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
            Archivo de productos
            <span class="text-red-500">*</span>
          </label>

          <!-- Zona de carga -->
          <input
            ref="inputArchivo"
            type="file"
            accept=".xlsx,.xls"
            class="hidden"
            @change="alElegirArchivo"
          />
          <button
            type="button"
            class="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2
                   border-dashed border-neutral-300 bg-neutral-100 px-6 py-6 text-neutral-600
                   hover:border-primary-600 hover:text-primary-700 transition-all"
            :disabled="leyendo"
            @click="abrirSelector"
          >
            <Upload :size="28" />
            <span class="text-sm font-semibold">
              {{ nombreArchivo || 'Selecciona un archivo .xlsx' }}
            </span>
            <span class="text-xs text-neutral-500">
              Encabezados: descripción, insumo, precio de venta, unidad de medida
            </span>
          </button>

          <p v-if="leyendo" class="mt-3 flex items-center gap-2 text-sm text-primary-700">
            <Loader :size="16" class="animate-spin" />
            Leyendo el archivo…
          </p>

          <!-- Archivo ilegible, a diferencia de una fila inválida -->
          <div
            v-if="errorDeArchivo"
            class="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <CircleAlert :size="16" class="mt-0.5 shrink-0" />
            <span>{{ errorDeArchivo }}</span>
          </div>

          <!-- Fallo de la API al confirmar -->
          <div
            v-if="errorMsg"
            class="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <CircleAlert :size="16" class="mt-0.5 shrink-0" />
            <span>{{ errorMsg }}</span>
          </div>
        </div>

        <!-- Contadores -->
        <div v-if="hayPreview" class="px-8 py-3 flex flex-wrap items-center gap-3">
          <span
            class="inline-flex items-center gap-2 rounded-xl bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-700"
          >
            <Check :size="16" />
            {{ validas.length }} válidos
          </span>
          <span
            class="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold"
            :class="conError.length > 0 ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-600'"
          >
            <CircleAlert :size="16" />
            {{ conError.length }} con error
          </span>
          <span class="text-sm text-neutral-600">{{ total }} filas leídas</span>
          <span v-if="truncado" class="text-sm font-semibold text-orange-600">
            Se mostraron las primeras {{ total }} filas.
          </span>
        </div>

        <!-- Resultado final -->
        <div v-if="estado === 'finalizado' && resumen" class="px-8 pt-4 pb-2">
          <div
            class="flex items-start gap-3 rounded-xl border px-4 py-3"
            :class="resumen.fallidos.length > 0
              ? 'border-orange-200 bg-orange-50 text-orange-800'
              : 'border-green-200 bg-green-50 text-green-800'"
          >
            <CircleCheck :size="20" class="mt-0.5 shrink-0" />
            <div>
              <p class="font-bold">
                Se crearon {{ resumen.exitosos }} productos
                <span v-if="resumen.fallidos.length > 0">
                  y {{ resumen.fallidos.length }} no se pudieron crear
                </span>.
              </p>
              <ul v-if="resumen.fallidos.length > 0" class="mt-2 space-y-1 text-sm">
                <li v-for="falla in resumen.fallidos" :key="falla.fila">
                  Fila {{ falla.fila }}: {{ falla.motivo }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Previsualización -->
        <div v-if="filas.length > 0" class="px-8 pt-4 pb-6">
          <div class="overflow-x-auto rounded-xl border border-neutral-200">
            <table class="w-full text-sm">
              <thead class="bg-neutral-100 text-xs uppercase tracking-wider text-neutral-600">
                <tr>
                  <th class="px-3 py-2.5 text-left font-bold">Fila</th>
                  <th class="px-3 py-2.5 text-left font-bold">Descripción</th>
                  <th class="px-3 py-2.5 text-left font-bold">Insumo</th>
                  <th class="px-3 py-2.5 text-left font-bold">Precio de venta</th>
                  <th class="px-3 py-2.5 text-left font-bold">Unidad de medida</th>
                  <th class="px-3 py-2.5 text-left font-bold">Errores</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200">
                <tr
                  v-for="fila in filas"
                  :key="fila.fila"
                  :class="fila.errores.length > 0 ? 'bg-red-50' : 'bg-white'"
                >
                  <td class="px-3 py-2.5 font-semibold text-neutral-700">
                    <span class="inline-flex items-center gap-1.5">
                      <CircleAlert v-if="fila.errores.length > 0" :size="14" class="shrink-0 text-red-500" />
                      <CircleCheck v-else :size="14" class="shrink-0 text-green-600" />
                      {{ fila.fila }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-secondary-800">{{ fila.descripcion || '—' }}</td>
                  <td class="px-3 py-2.5 text-secondary-800">{{ fila.isSupply ? 'Sí' : 'No' }}</td>
                  <td class="px-3 py-2.5 text-secondary-800">{{ formatCurrency(fila.salePrice) }}</td>
                  <td class="px-3 py-2.5 text-secondary-800">{{ fila.unidad || '—' }}</td>
                  <td class="px-3 py-2.5">
                    <span v-if="fila.errores.length === 0" class="text-neutral-400">—</span>
                    <ul v-else class="space-y-0.5 text-red-700">
                      <li v-for="error in fila.errores" :key="error">{{ error }}</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Botones de cancelar y confirmar -->
      <div class="flex justify-between py-4 px-10 bg-neutral-100 border-t border-neutral-200">
        <button
          class="bg-neutral-50 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-200 text-secondary-700 py-3 px-7 rounded-xl shadow-xl"
          :disabled="importando"
          @click="emit('close')"
        >
          {{ estado === 'finalizado' ? 'Cerrar' : 'Cancelar' }}
        </button>

        <button
          v-if="estado !== 'finalizado'"
          :disabled="!puedeConfirmar"
          class="bg-primary-600 hover:bg-primary-700 active:bg-primary-800
                 text-neutral-50 py-3 px-7 rounded-xl shadow-xl inline-flex items-center gap-2
                 disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:shadow-none"
          @click="alConfirmar"
        >
          <Loader v-if="importando" :size="16" class="animate-spin" />
          <FileSpreadsheet v-else :size="16" />
          {{ importando ? 'Importando…' : 'Confirmar importación' }}
        </button>
      </div>
    </div>
  </div>
</template>
