import type { CatalogColumn, CatalogRow } from '@/types/CatalogColumns/catalog'
import { formatCurrency } from '@/utils/format'
import { PDF_HEADER_FILL, pintarLogoMandys } from '@/utils/pdfBranding'

export type FormatoExport = 'excel' | 'pdf'

export interface ExportarOpciones {
  /** Las mismas `columns` que recibe `CatalogTable`. */
  columns: CatalogColumn[]
  /** Título del catálogo; da nombre al archivo y a la hoja. */
  titulo: string
}

function columnasExportables(columns: CatalogColumn[]): CatalogColumn[] {
  return columns.filter((col) => col.type !== 'button')
}

function valorLegible(col: CatalogColumn, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return col.emptyLabel ?? '—'
  if (col.type === 'boolean') return valor ? (col.trueLabel ?? 'Sí') : (col.falseLabel ?? 'No')
  if (Array.isArray(valor)) return String(valor.length)
  return String(valor)
}

function valorParaExcel(col: CatalogColumn, valor: unknown): string | number {
  if (col.type !== 'currency') return valorLegible(col, valor)

  const numero =
    typeof valor === 'number' ? valor : Number(String(valor ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(numero) ? numero : valorLegible(col, valor)
}


function nombreArchivo(titulo: string, extension: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  const hoy = new Date()
  const sello = [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, '0'),
    String(hoy.getDate()).padStart(2, '0'),
  ].join('')

  return `${base || 'catalogo'}_${sello}.${extension}`
}

/** Genera y descarga el .xlsx del catálogo. */
export async function exportarAExcel(
  opciones: ExportarOpciones,
  filas: CatalogRow[],
): Promise<void> {
  const XLSX = await import('xlsx')
  const columnas = columnasExportables(opciones.columns)

  const matriz = [
    columnas.map((col) => col.label),
    ...filas.map((fila) => columnas.map((col) => valorParaExcel(col, fila[col.key]))),
  ]

  const hoja = XLSX.utils.aoa_to_sheet(matriz)
  hoja['!cols'] = columnas.map((col, i) => {
    const ancho = Math.max(
      ...matriz.map((fila) => String(fila[i] ?? '').length),
      col.label.length,
    )
    return { wch: Math.min(Math.max(ancho + 2, 8), 45) }
  })

  const libro = XLSX.utils.book_new()
  // Los nombres de hoja de Excel admiten 31 caracteres.
  XLSX.utils.book_append_sheet(libro, hoja, opciones.titulo.slice(0, 31) || 'Catálogo')
  XLSX.writeFile(libro, nombreArchivo(opciones.titulo, 'xlsx'))
}

/**
 * Descarga un blob con un `<a download>`.
 *
 * Se usa en vez de `doc.save()` porque jsPDF decide en tiempo de import si su
 * descargador está disponible, y en un entorno sin `window` lo deja como no-op
 * silencioso. Hacer la descarga aquí es el mismo mecanismo que usa SheetJS por
 * dentro y no depende de ese sniffing.
 */
function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  // Se revoca después del clic: si se hace de inmediato, algunos navegadores
  // cancelan la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/** Genera y descarga el PDF del catálogo, en horizontal para que quepan las columnas. */
export async function exportarAPdf(
  opciones: ExportarOpciones,
  filas: CatalogRow[],
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { autoTable } = await import('jspdf-autotable')

  const columnas = columnasExportables(opciones.columns)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  // Logo de Mandy's en el header superior derecho.
  await pintarLogoMandys(doc)

  doc.setFontSize(14)
  doc.text(opciones.titulo, 40, 36)
  doc.setFontSize(9)
  doc.setTextColor(110, 110, 110)
  doc.text(`Exportado el ${new Date().toLocaleDateString('es-MX')}`, 40, 52)

  autoTable(doc, {
    startY: 66,
    head: [columnas.map((col) => col.label)],
    body: filas.map((fila) =>
      columnas.map((col) =>
        col.type === 'currency'
          ? formatCurrency(fila[col.key])
          : valorLegible(col, fila[col.key]),
      ),
    ),
    styles: { fontSize: 8, cellPadding: 5, textColor: [30, 30, 30] },
    headStyles: { fillColor: PDF_HEADER_FILL, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 40, right: 40 },
  })

  descargar(doc.output('blob'), nombreArchivo(opciones.titulo, 'pdf'))
}
