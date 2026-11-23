import { api } from "@/lib/api-client"
import type { CreateProduct, Product, Products, UpdateProduct } from "@/types/catalogs/ProductsDtos"

export async function getProducts(
    page = 1,
    pageSize = 20,
    search = '',
    orderBy = '',
    isSupply: boolean | null = null
) {
    const response = await api.get<Products>('/products', {
        params: {
            page,
            pageSize,
            search: search || undefined,
            orderBy,
            isSupply
        }
    })

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

export async function putProductImage(id: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.put(`/products/${id}/image`,formData)
    return response.data
}

export async function deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`)
}
