import type { Storages, Storage } from '@/types/Storage'

// Mezcla de filas normales y en alerta (stock <= umbralMaximo) para probar el rojo.
const items: Storage[] = [
  { id: 1, nombre: 'Harina de trigo 1 kg', stock: 120, umbralMaximo: 50 },
  { id: 2, nombre: 'Azúcar refinada 1 kg', stock: 40, umbralMaximo: 60 },
  { id: 3, nombre: 'Mantequilla 500 g', stock: 15, umbralMaximo: 15 },
  { id: 4, nombre: 'Huevo (caja 30 pzas)', stock: 80, umbralMaximo: 30 },
  { id: 5, nombre: 'Leche entera 1 L', stock: 22, umbralMaximo: 40 },
  { id: 6, nombre: 'Chocolate semiamargo 1 kg', stock: 9, umbralMaximo: 10 },
  { id: 7, nombre: 'Vainilla líquida 250 ml', stock: 35, umbralMaximo: 20 },
  { id: 8, nombre: 'Polvo para hornear 500 g', stock: 5, umbralMaximo: 12 },
  { id: 9, nombre: 'Crema para batir 1 L', stock: 60, umbralMaximo: 25 },
  { id: 10, nombre: 'Queso crema 190 g', stock: 18, umbralMaximo: 18 },
  { id: 11, nombre: 'Fresa congelada 1 kg', stock: 70, umbralMaximo:30 },
]

// Simula el endpoint paginado: devuelve el mismo formato que mandará el back.
export async function getStorageMock(page = 1, pageSize = 5): Promise<Storages> {
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