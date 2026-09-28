import type { Product } from "./ProductsDtos"

export interface Dish {
    id: number
    name: string
    price: number
    recipe: Recipe[]
}

export interface Recipe {
    product: Product
    quantity: number
}

export interface CreateDish{
    name: string
    price: number
    recipe:{
        productId:number
        quantity:number
    }[]
}

export interface UpdateDish{
    name: string
    price: number
    recipe:{
        productId:number
        quantity:number
    }[]
}

export interface Dishes{
    totalCount: number
    page: number
    pageSize: number
    totalPage: number
    items: Dish[]
}