import logoUrl from '@/assets/mandys_logo_h.svg'

/**
 * Branding compartido para los PDF del sistema.
 *
 * - `PDF_HEADER_FILL` es el terracota corporativo (`--color-primary-600: #C84B31`)
 *   que ya usan el `AppHeader`, la paginación activa y los botones primarios.
 * - `pintarLogoMandys` dibuja el logo horizontal de Mandy's en la esquina
 *   superior derecha del documento.
 */

// #C84B31 → RGB para jsPDF / jspdf-autotable.
export const PDF_HEADER_FILL: [number, number, number] = [200, 75, 49]

let cacheLogo: { dataUrl: string; aspecto: number } | null = null

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar el logo de Mandy\'s.'))
    img.src = url
  })
}

/**
 * Carga el SVG del logo y lo rasteriza a PNG vía canvas, porque `jsPDF.addImage`
 * no acepta SVG directamente. El resultado se cachea para no recargar en cada
 * exportación. Si algo falla devuelve `null` para que el PDF se genere igual,
 * solo sin logo.
 */
async function obtenerLogoPng(): Promise<{ dataUrl: string; aspecto: number } | null> {
  if (cacheLogo) return cacheLogo

  try {
    const respuesta = await fetch(logoUrl)
    if (!respuesta.ok) return null
    const blob = await respuesta.blob()
    const objetoUrl = URL.createObjectURL(blob)

    try {
      const img = await cargarImagen(objetoUrl)
      const anchoNatural = img.naturalWidth || 2562
      const altoNatural = img.naturalHeight || 1125
      const aspecto = altoNatural / anchoNatural

      // Se rasteriza a un ancho fijo: suficiente para verse nítido a ~110pt
      // en el PDF sin inflar el archivo.
      const anchoPx = 560
      const altoPx = Math.max(1, Math.round(anchoPx * aspecto))

      const canvas = document.createElement('canvas')
      canvas.width = anchoPx
      canvas.height = altoPx
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.clearRect(0, 0, anchoPx, altoPx)
      ctx.drawImage(img, 0, 0, anchoPx, altoPx)

      cacheLogo = { dataUrl: canvas.toDataURL('image/png'), aspecto }
      return cacheLogo
    } finally {
      URL.revokeObjectURL(objetoUrl)
    }
  } catch (err) {
    console.warn('No se pudo preparar el logo para el PDF:', err)
    return null
  }
}

export interface LogoOpciones {
  /** Ancho del logo en puntos jsPDF. */
  anchoPt?: number
  /** Margen derecho en puntos (igual que `margin.right` de la tabla). */
  margenDer?: number
  /** Distancia desde el borde superior en puntos. */
  y?: number
}

/**
 * Dibuja el logo de Mandy's en la esquina superior derecha.
 * No lanza: si el logo no carga, simplemente no pinta nada.
 */
export async function pintarLogoMandys(
  doc: { addImage: (...args: never[]) => unknown; internal: { pageSize: { getWidth: () => number } } },
  opciones: LogoOpciones = {},
): Promise<void> {
  const { anchoPt = 110, margenDer = 40, y = 14 } = opciones
  const logo = await obtenerLogoPng()
  if (!logo) return

  const altoPt = anchoPt * logo.aspecto
  const x = doc.internal.pageSize.getWidth() - margenDer - anchoPt
  ;(doc.addImage as CallableFunction)(
    logo.dataUrl,
    'PNG',
    x,
    y,
    anchoPt,
    altoPt,
  )
}
