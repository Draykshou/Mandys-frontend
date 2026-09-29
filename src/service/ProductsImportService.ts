import { api } from '@/lib/api-client'
import type { CreateProduct } from '@/types/ProductsDtos'
import type { ImportProductsSummary } from '@/types/ProductsImportDtos'

export async function postProductsBatch(
  productos: CreateProduct[],
): Promise<ImportProductsSummary> {
  const response = await api.post<ImportProductsSummary>('/products/batch', productos)
  return response.data
}
