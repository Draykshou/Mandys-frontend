import type { Product } from '@/types/ProductsDtos'

export interface Storage {
  id: number
  branchId: number
  product: Product
  minimumStock: number
  currentStock: number
}

export interface StorageUpdate{
  minimumStock: number
}

export interface StorageIn {
  folio: string
  products: {
    productId: number
    quantity: number
    costPrice: number
  }[]
}

export interface StorageOut {
  products: {
    productId: number
    quantity: number
  }[]
  folio: string
}
 
export interface Storages {
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  items: Storage[]
}

