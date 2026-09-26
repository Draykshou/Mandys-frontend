export interface Dish {
    id: string
    name: string
    price: boolean
    recipe: Recipe
}

export interface Recipe {
    id: string
    description: string
    isSupply: boolean
    price: string
    measureUnit: string
    quantity: number
}

export interface CreateDish{
    name: string
    price: boolean
    recipe: Recipe
}

export interface UpdateDish{
    name: string
    price: boolean
    recipe: Recipe
}

export interface Dishes{
    totalCount: number
    page: number
    pageSize: number
    totalPage: number
    items: Dish[]
}