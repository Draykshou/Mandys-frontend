export interface StorageItem {
  id: number
  nombre: string
  stock: number
  ultimoStock: string | null 
  umbralMaximo: number
}
 
export interface Storage {
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  items: StorageItem[]
}
