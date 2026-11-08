import type { Dish } from '@/types/DishesDtos'
import type { Product } from '@/types/ProductsDtos'

/** Un elemento del combo: puede ser un platillo o un producto de venta (isSupply = false). */
export interface ComboItem {
  type: 'dish' | 'product'
  id: number
  name: string
  quantity: number
  dish?: Dish
  product?: Product
}

/** Precio individual de venta: `price` del platillo o `salePrice` del producto. */
export const precioItem = (item: ComboItem) =>
  Number(item.type === 'dish' ? item.dish?.price : item.product?.salePrice) || 0

/** Precio individual × cantidad. */
export const subtotalItem = (item: ComboItem) => precioItem(item) * item.quantity

/** Suma de precio × cantidad de todos los elementos del combo. */
export const precioTotal = (items: ComboItem[]) =>
  items.reduce((suma, item) => suma + subtotalItem(item), 0)
