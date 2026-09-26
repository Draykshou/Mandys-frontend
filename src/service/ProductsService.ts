import { api } from "@/lib/api-client"
import type { CreateProduct, UpdateProduct, Products, Product } from "@/types/ProductsDtos"

export async function getProducts(): Promise<Products>{
    const response = await api.get<Products>("/products")
    return response.data as Products
}

export async function putProducts(id: string): Promise<Product>{
    const response = await api.put<Product>(`/usuario/${id}`)
    return response.data
}

