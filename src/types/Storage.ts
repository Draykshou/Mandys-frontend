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
  supplierName: string
  products: {
    productId: number
    quantity: number
    costPrice: number | null
  }[]
}

export interface StorageOut {
  reason: "TRASPASO" | "MERMA"
  products: {
    productId: number
    quantity: number
  }[]
}

export interface StorageHistory {
  id: number
  branchId: number
  type: string
  folio: string | null
  supplierName: string | null
  reason: string | null
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

