import type { Dish } from '@/types/DishesDtos'
import type { Product } from '@/types/ProductsDtos'

export interface Combo {
    id: number
    name: string
    price: number
    dishes: {
        dish: Dish
        quantity: number
    }[]
    products: {
        product: Product
        quantity: number
    }[]
}

export interface CreateCombo {
    name: string
    price: number
    dishes: {
        dishId: number
        quantity: number
    }[]
    products: {
        productId: number
        quantity: number
    }[]
}

export interface UpdateCombo {
    name: string
    price: number
    dishes: {
        dishId: number
        quantity: number
    }[]
    products: {
        productId: number
        quantity: number
    }[]
}

export interface Combos {
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    items: Combo[]
}