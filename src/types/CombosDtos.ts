export interface Combo {
    id: string
    name: string
    price: boolean
    Dishes: Dishes
}

export interface Dishes {
    id: string
    name: string
    price: boolean
    recipe: Recipe
    quantity: number
}

export interface Recipe {
    id: string
    description: string
    isSupply: boolean
    price: string
    measureUnit: string
    quantity: number
}

export interface CreateCombo{
    name: string
    price: boolean
    Dishes: Dishes
}

export interface UpdateCombo{
    name: string
    price: boolean
    Dishes: Dishes
}

export interface Combos{
    totalCount: number
    page: number
    pageSize: number
    totalPage: number
    items: Combo[]
}