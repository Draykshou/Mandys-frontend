export interface Dish {
    id: string
    name: string
    price: number
    recipe: Recipe
}

export interface Recipe {
    id: string
    description: string
    isSupply: boolean
    price: number
    measureUnit: string
    quantity: number
}

export interface CreateDish{
    name: string
    price: number
    recipe: [{
      productId: number,
      quantity: number
    }]
}

export interface UpdateDish{
    name: string
    price: number
    recipe: [{
      productId: number,
      quantity: number
    }]
}

export interface Dishes{
    totalCount: number
    page: number
    pageSize: number
    totalPage: number
    items: Dish[]
}