export interface Product {
    id: string
    description: string
    isSupply: boolean
    price: number
    measureUnit: string
}

export interface CreateProduct{
    description: string
    isSupply: boolean
    price: number
    measureUnit: string
}

export interface UpdateProduct{
    description: string
    isSupply: boolean
    price: Number
    measureUnit: string
}

export interface Products{
    totalCount: number
    page: number
    pageSize: number
    totalPage: number
    items: Product[]
}