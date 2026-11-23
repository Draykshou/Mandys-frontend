import type { Dish } from '@/types/catalogs/DishesDtos'
import type { Product } from '@/types/catalogs/ProductsDtos'

export interface Combo {
    id: number
    name: string
    price: number
    costPrice: number
    dishes: {
        dish: Dish
        quantity: number
    }[]
    products: {
        product: Product
        quantity: number
    }[]
    imageUrl: string | null
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