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

export type CargarCatalogo = () => Promise<unknown[]>

export function useExportCatalog() {
  const { mostrar } = useToast()
  const exportando = ref(false)

  async function exportar(
    formato: FormatoExport,
    opciones: ExportarOpciones,
    cargar: CargarCatalogo,
  ): Promise<void> {
   
    if (exportando.value) return

    exportando.value = true
    try {
      const registros = await cargar()

      if (registros.length === 0) {
        mostrar('No hay registros para exportar.', 'error')
        return
      }

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
