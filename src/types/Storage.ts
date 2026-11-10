import type { Product } from '@/types/ProductsDtos'

export interface Storage {
  id: number
  branchId: number
  product: Product
  minimumStock: number
  currentStock: number
  lastUpdated: string
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

export interface StorageHistory {
  id: number
  branchId: number
  type: string
  folio: string
  products: [
    {
      product: Product
      quantity: number
      costPrice: number
    }
  ]
  date: string

}
 
export interface Storages {
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  items: Storage[]
}

export interface StoragesHistory {
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  items: StorageHistory[]
}

