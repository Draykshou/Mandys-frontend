import { api } from "@/lib/api-client"
import type { CreateProduct, UpdateProduct, Products } from "@/types/ProductsDtos"

export async function getProducts(): Promise<Products>{
    const response = await api.get<Products>("/products")
    return response.data as Products
}

