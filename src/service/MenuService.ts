import { api } from '@/lib/api-client'
import type { Combo } from '@/types/CombosDtos'
import type { Dish } from '@/types/DishesDtos'
import type { Product } from '@/types/ProductsDtos'

type MenuResponse<T> = T[] | { items: T[] }

const getItems = <T>(data: MenuResponse<T>): T[] => Array.isArray(data) ? data : data.items

export interface MenuProduct extends Product {
  name?: string
  description: string
}

export async function getMenuCombos(): Promise<Combo[]> {
  const response = await api.get<MenuResponse<Combo>>('/menu/combos')
  return getItems(response.data)
}

export async function getMenuDishes(): Promise<Dish[]> {
  const response = await api.get<MenuResponse<Dish>>('/menu/dishes')
  return getItems(response.data)
}

export async function getMenuProducts(): Promise<MenuProduct[]> {
  const response = await api.get<MenuResponse<MenuProduct>>('/menu/products')
  return getItems(response.data)
}
