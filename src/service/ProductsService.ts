import { api } from "@/lib/api-client"
import type { CreateProduct, Product, Products, UpdateProduct } from "@/types/ProductsDtos"

export async function getProducts(): Promise<Products>{
    const response = await api.get<Products>("/products")
    return response.data as Products
}

export async function createProduct(payload: CreateProduct): Promise<Product> {
    const response = await api.post<Product>("/products", payload)
    return response.data
}

/** El update reemplaza el producto completo, por eso manda el mismo cuerpo que el alta. */
export async function updateProduct(id: string, payload: UpdateProduct): Promise<Product> {
    const response = await api.put<Product>(`/products/${id}`, payload)
    return response.data
}

export async function deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`)
}
