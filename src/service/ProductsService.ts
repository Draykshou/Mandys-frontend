import { api } from "@/lib/api-client"
import type { CreateProduct, Product, Products, UpdateProduct } from "@/types/ProductsDtos"

export async function getProducts(): Promise<Products>{
    const response = await api.get<Products>("/products")
    return response.data
}

export async function postProduct(payload: CreateProduct): Promise<Product> {
    const response = await api.post<Product>("/products", payload)
    return response.data
}

export async function putProduct(id: number, payload: UpdateProduct): Promise<Product> {
    const response = await api.put<Product>(`/products/${id}`, payload)
    return response.data
}

export async function deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`)
}
