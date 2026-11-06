import type { Storage, StorageItem } from '@/types/Storage'

// Mezcla de filas normales y en alerta (stock <= umbralMaximo) para probar el rojo.
const items: StorageItem[] = [
  { id: 1, nombre: 'Harina de trigo 1 kg', stock: 120, ultimoStock: '2026-10-28T09:15:00Z', umbralMaximo: 50 },
  { id: 2, nombre: 'Azúcar refinada 1 kg', stock: 40, ultimoStock: '2026-10-25T14:30:00Z', umbralMaximo: 60 },
  { id: 3, nombre: 'Mantequilla 500 g', stock: 15, ultimoStock: '2026-10-30T11:00:00Z', umbralMaximo: 15 },
  { id: 4, nombre: 'Huevo (caja 30 pzas)', stock: 80, ultimoStock: '2026-11-01T08:45:00Z', umbralMaximo: 30 },
  { id: 5, nombre: 'Leche entera 1 L', stock: 22, ultimoStock: '2026-10-31T16:20:00Z', umbralMaximo: 40 },
  { id: 6, nombre: 'Chocolate semiamargo 1 kg', stock: 9, ultimoStock: '2026-10-20T10:10:00Z', umbralMaximo: 10 },
  { id: 7, nombre: 'Vainilla líquida 250 ml', stock: 35, ultimoStock: null, umbralMaximo: 20 },
  { id: 8, nombre: 'Polvo para hornear 500 g', stock: 5, ultimoStock: '2026-10-15T13:00:00Z', umbralMaximo: 12 },
  { id: 9, nombre: 'Crema para batir 1 L', stock: 60, ultimoStock: '2026-10-29T09:00:00Z', umbralMaximo: 25 },
  { id: 10, nombre: 'Queso crema 190 g', stock: 18, ultimoStock: '2026-10-27T12:40:00Z', umbralMaximo: 18 },
  { id: 11, nombre: 'Fresa congelada 1 kg', stock: 70, ultimoStock: '2026-11-02T07:30:00Z', umbralMaximo: 30 },
  { id: 12, nombre: 'Cajas para pastel (paq. 10)', stock: 3, ultimoStock: '2026-10-10T15:50:00Z', umbralMaximo: 8 },
]

// Simula el endpoint paginado: devuelve el mismo formato que mandará el back.
export async function getStorageMock(page = 1, pageSize = 5): Promise<Storage> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // latencia falsa
  const start = (page - 1) * pageSize
  return {
    totalCount: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
    items: items.slice(start, start + pageSize),
  }
}