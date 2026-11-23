export interface Product {
    id: number
    description: string
    isSupply: boolean
    costPrice: number
    salePrice: number
    measureUnit: "Kilogramos" | "Litros" | "Unidades"
    imageUrl: string | null
}

export interface CreateProduct{
    description: string
    isSupply: boolean
    salePrice: number | null
    measureUnit: string
}

export interface UpdateProduct{
    description: string
    isSupply: boolean
    salePrice: number | null
    measureUnit: string
}

export interface Products{
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    items: Product[]
}