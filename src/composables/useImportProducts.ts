import { computed, readonly, ref } from 'vue'
import { postProductsBatch } from '@/service/ProductsImportService'
import { mensajeDeError } from '@/utils/apiError'
import { toNumber } from '@/utils/format'
import type { CreateProduct } from '@/types/ProductsDtos'
import type { ImportProductsSummary } from '@/types/ProductsImportDtos'




const LIMITE_DESCRIPCION = 50

const LIMITE_UNIDAD = 50

const MAX_FILAS = 2000

export type ImportEstado = 'vacio' | 'leyendo' | 'listo' | 'importando' | 'finalizado'


export interface FilaPrevia {
  fila: number
  descripcion: string
  isSupply: boolean
  precio: number | null
  unidad: string
  errores: string[]
}

/** Resumen a mostrar: `fila` ya traducida a la fila real del Excel. */
export interface ResumenImport {
  exitosos: number
  fallidos: { fila: number; motivo: string }[]
}
type CeldaExcel = string | number | boolean | Date | null | undefined

type FilaExcel = CeldaExcel[]

type ClaveColumna = 'description' | 'isSupply' | 'price' | 'measureUnit'

const COLUMNAS: Record<ClaveColumna, readonly string[]> = {
  description: ['description', 'descripcion', 'nombre', 'name'],
  isSupply: ['issupply', 'insumo', 'esinsumo', 'esuninsumo'],
  price: ['price', 'precio', 'costo', 'cost', 'preciounitario'],
  measureUnit: ['measureunit', 'unidaddemedida', 'unidadmedida', 'unidad', 'um'],
}

const VALORES_VERDADEROS = new Set(['1', 'true', 'verdadero', 'si', 'yes', 'x', 'insumo'])
const VALORES_FALSOS = new Set(['0', 'false', 'falso', 'no'])

function textoDeCelda(valor: CeldaExcel): string {
  if (valor === null || valor === undefined) return ''
  if (valor instanceof Date) return valor.toISOString().slice(0, 10)
  return String(valor).trim()
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function precioDesdeCelda(valor: CeldaExcel): { precio: number | null; error: string } {
  const texto = textoDeCelda(valor)
  if (texto === '') return { precio: null, error: 'El precio es obligatorio.' }
  if (!/\d/.test(texto)) return { precio: null, error: `El precio "${texto}" no es un número.` }

  const precio = toNumber(texto)
  if (precio < 0) return { precio, error: 'El precio no puede ser negativo.' }
  return { precio, error: '' }
}

function isSupplyDesdeCelda(valor: CeldaExcel): { valor: boolean; error: string } {
  const texto = normalizar(textoDeCelda(valor))
  if (texto === '') return { valor: true, error: '' }
  if (VALORES_VERDADEROS.has(texto)) return { valor: true, error: '' }
  if (VALORES_FALSOS.has(texto)) return { valor: false, error: '' }
  return { valor: true, error: `No se entiende "${textoDeCelda(valor)}" como insumo (usa Sí/No).` }
}

function indicesDeColumnas(encabezados: FilaExcel): Record<ClaveColumna, number> {
  const normalizados = encabezados.map((celda) => normalizar(textoDeCelda(celda)))
  const indiceDe = (clave: ClaveColumna): number =>
    normalizados.findIndex((nombre) => COLUMNAS[clave].includes(nombre))

  return {
    description: indiceDe('description'),
    isSupply: indiceDe('isSupply'),
    price: indiceDe('price'),
    measureUnit: indiceDe('measureUnit'),
  }
}

function validarFilas(filas: FilaPrevia[]): void {

  const primeraVez = new Map<string, number>()

  for (const fila of filas) {
    const descripcion = fila.descripcion.trim()

    if (descripcion === '') {
      fila.errores.push('La descripción es obligatoria.')
    } else if (descripcion.length > LIMITE_DESCRIPCION) {
      fila.errores.push(`La descripción excede ${LIMITE_DESCRIPCION} caracteres.`)
    } else {
      const clave = descripcion.toLowerCase()
      const previa = primeraVez.get(clave)
      if (previa === undefined) primeraVez.set(clave, fila.fila)
      else fila.errores.push(`Duplicado en el archivo: ya aparece en la fila ${previa}.`)
    }

    const unidad = fila.unidad.trim()
    if (unidad === '') fila.errores.push('La unidad de medida es obligatoria.')
    else if (unidad.length > LIMITE_UNIDAD) {
      fila.errores.push(`La unidad de medida excede ${LIMITE_UNIDAD} caracteres.`)
    }
  }
}

function traducir(
  resultado: ImportProductsSummary,
  filasValidas: FilaPrevia[],
): ResumenImport {
  return {
    exitosos: resultado.exitosos,
    fallidos: resultado.fallidos.map((falla) => ({
      fila: filasValidas[falla.fila - 1]?.fila ?? falla.fila,
      motivo: falla.motivo,
    })),
  }
}

export function useImportProducts() {
  const estado = ref<ImportEstado>('vacio')
  const filas = ref<FilaPrevia[]>([])
  const nombreArchivo = ref('')
 
  const errorDeArchivo = ref('')
  
  const errorMsg = ref('')
  const resumen = ref<ResumenImport | null>(null)
 
  const truncado = ref(false)

  const total = computed(() => filas.value.length)
  const conError = computed(() => filas.value.filter((f) => f.errores.length > 0))
  const validas = computed(() => filas.value.filter((f) => f.errores.length === 0))
  const importando = computed(() => estado.value === 'importando')
  const puedeConfirmar = computed(() => validas.value.length > 0 && !importando.value)

  function reiniciar() {
    estado.value = 'vacio'
    filas.value = []
    nombreArchivo.value = ''
    errorDeArchivo.value = ''
    errorMsg.value = ''
    resumen.value = null
    truncado.value = false
  }

  async function seleccionarArchivo(archivo: File): Promise<void> {
    reiniciar()
    estado.value = 'leyendo'
    nombreArchivo.value = archivo.name

    try {
      const XLSX = await import('xlsx')

      const buffer = await archivo.arrayBuffer()
      const libro = XLSX.read(buffer, { type: 'array' })
      const hoja = libro.Sheets[libro.SheetNames[0]]
      if (!hoja) throw new Error('El archivo no tiene ninguna hoja.')

      const matriz = XLSX.utils.sheet_to_json<FilaExcel>(hoja, { header: 1, defval: '' })
      if (matriz.length < 2) throw new Error('El archivo solo tiene la fila de encabezados.')

      const encabezados = matriz[0] ?? []
      const cuerpo = matriz.slice(1, MAX_FILAS + 1)
      truncado.value = matriz.length - 1 > MAX_FILAS
      if (cuerpo.length === 0) throw new Error('El archivo no tiene filas de datos.')

      const columnas = indicesDeColumnas(encabezados)
      const faltantes = (Object.keys(COLUMNAS) as ClaveColumna[]).filter(
        (clave) => columnas[clave] === -1,
      )
      if (faltantes.length > 0) {
        throw new Error(`Faltan columnas obligatorias en el archivo: ${faltantes.join(', ')}.`)
      }

      filas.value = cuerpo.map((celdas, indice) => {
        const { precio, error: errorPrecio } = precioDesdeCelda(celdas[columnas.price])
        const { valor, error: errorIsSupply } = isSupplyDesdeCelda(celdas[columnas.isSupply])

        return {
          fila: indice + 2, // +2 porque la fila 1 del archivo son los encabezados
          descripcion: textoDeCelda(celdas[columnas.description]),
          isSupply: valor,
          precio,
          unidad: textoDeCelda(celdas[columnas.measureUnit]),
          errores: [errorPrecio, errorIsSupply].filter((e) => e !== ''),
        }
      })

      validarFilas(filas.value)
      estado.value = 'listo'
    } catch (err) {
      filas.value = []
      estado.value = 'vacio'
      errorDeArchivo.value = err instanceof Error ? err.message : 'No se pudo leer el archivo.'
    }
  }

  async function confirmar(): Promise<boolean> {
    if (!puedeConfirmar.value) return false

    estado.value = 'importando'
    errorMsg.value = ''

    const productos: CreateProduct[] = validas.value.map((fila) => ({
      description: fila.descripcion.trim(),
      isSupply: fila.isSupply,
      price: fila.precio as number,
      measureUnit: fila.unidad.trim(),
    }))

    try {
      const resultado: ImportProductsSummary = await postProductsBatch(productos)
      resumen.value = traducir(resultado, validas.value)
      estado.value = 'finalizado'
      return true
    } catch (err) {
      estado.value = 'listo'
      errorMsg.value = mensajeDeError(err, 'No se pudieron importar los productos.')
      return false
    }
  }

  return {
    estado: readonly(estado),
    filas: readonly(filas),
    nombreArchivo: readonly(nombreArchivo),
    errorDeArchivo: readonly(errorDeArchivo),
    errorMsg: readonly(errorMsg),
    resumen: readonly(resumen),
    truncado: readonly(truncado),

    total,
    validas,
    conError,
    importando,
    puedeConfirmar,

    seleccionarArchivo,
    confirmar,
    reiniciar,
  }
}
