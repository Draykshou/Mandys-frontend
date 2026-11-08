import type { Product } from '@/types/ProductsDtos'

type Unidad = Product['measureUnit']

// Cómo se muestra la cantidad de un insumo (siempre en la unidad base).
export const ABREVIATURAS: Record<Unidad, string> = {
  Unidades: 'u',
  Gramos: 'g',
  Mililitros: 'ml',
}

// El costPrice de un producto es por kilo, por litro o por unidad.
// `factor` = cuántas unidades base (g, ml, u) trae esa unidad de costo.
const COSTO_BASE: Record<Unidad, { etiqueta: string; factor: number }> = {
  Unidades: { etiqueta: 'u', factor: 1 },
  Gramos: { etiqueta: 'kg', factor: 1 },
  Mililitros: { etiqueta: 'L', factor: 1 },
}

/** Etiqueta de la unidad en la que viene el costo: "kg", "L" o "u". */
export const etiquetaCosto = (unidad: Unidad) => COSTO_BASE[unidad].etiqueta

/**
 * Costo de `cantidad` (en g, ml o u) de un producto.
 * Unidades: cantidad × costPrice. Gramos y mililitros: cantidad × costPrice ÷ 1000.
 */
export const costoInsumo = (product: Product, cantidad: number) =>
  (cantidad * (Number(product.costPrice) || 0)) / COSTO_BASE[product.measureUnit].factor

/** Suma del costo de todos los insumos de una receta. */
export const costoTotal = (items: { product: Product; quantity: number }[]) =>
  items.reduce((suma, item) => suma + costoInsumo(item.product, item.quantity), 0)

const formatoMonedaMx = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

/** 41.2 -> "$41.20" */
export const formatoMoneda = (valor: number) =>
  formatoMonedaMx.format(Number.isFinite(valor) ? valor : 0)
