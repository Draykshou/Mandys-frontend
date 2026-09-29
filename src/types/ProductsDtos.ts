export interface Product {
    id: number
    description: string
    isSupply: boolean
    costPrice: number
    salePrice: number
    measureUnit: string
}

export interface CreateProduct{
    description: string
    isSupply: boolean
    salePrice: number
    measureUnit: string
}

export interface UpdateProduct{
    description: string
    isSupply: boolean
    salePrice: number
    measureUnit: string
}

export interface Products{
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    items: Product[]
}