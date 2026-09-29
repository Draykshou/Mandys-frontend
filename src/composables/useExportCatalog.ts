import { readonly, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { mensajeDeError } from '@/utils/apiError'
import {
  exportarAPdf,
  exportarAExcel,
  type ExportarOpciones,
  type FormatoExport,
} from '@/utils/exportCatalog'
import type { CatalogRow } from '@/types/CatalogColumns/catalog'

/**
 * Cómo cada vista trae su catálogo para exportarlo. Se pasa como callback para
 * que el composable use el service que ya usa esa vista —`getProducts`,
 * `getDishes`, `getCombos`— y no uno genérico aparte.
 */
export type CargarCatalogo = () => Promise<unknown[]>

/**
 * Exporta un catálogo a Excel o a PDF.
 *
 * El flujo es: pedir el catálogo con el service de la vista → generar el
 * archivo con las mismas columnas que pinta la tabla → avisar con el mismo
 * toast que usa el resto de la vista.
 */
export function useExportCatalog() {
  const { mostrar } = useToast()
  const exportando = ref(false)

  async function exportar(
    formato: FormatoExport,
    opciones: ExportarOpciones,
    cargar: CargarCatalogo,
  ): Promise<void> {
    // Bloquea clics dobles mientras se arma el archivo.
    if (exportando.value) return

    exportando.value = true
    try {
      const registros = await cargar()

      if (registros.length === 0) {
        mostrar('No hay registros para exportar.', 'error')
        return
      }

      // Los DTO de cada catálogo son objetos planos con `id`; el cast es solo
      // para relaxing la forma, la lista de columnas es la que manda.
      const filas = registros as CatalogRow[]
      if (formato === 'excel') await exportarAExcel(opciones, filas)
      else await exportarAPdf(opciones, filas)

      mostrar(`Se exportaron ${filas.length} registros.`, 'exito')
    } catch (err) {
      console.error('No se pudo exportar el catálogo:', err)
      mostrar(mensajeDeError(err, 'No se pudo exportar el catálogo.'), 'error')
    } finally {
      exportando.value = false
    }
  }

  return {
    exportando: readonly(exportando),
    exportar,
  }
}
