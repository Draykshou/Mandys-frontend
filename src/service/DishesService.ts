import { api } from "@/lib/api-client"
import type { CreateDish, Dish, Dishes, UpdateDish } from "@/types/DishesDtos"

export async function getDishes(): Promise<Dishes>{
    const response = await api.get<Dishes>("/dishes")
    return response.data as Dishes
}

export async function createDish(payload: CreateDish): Promise<Dish> {
    const response = await api.post<Dish>("/dishes", payload)
    return response.data
}

export async function updateDish(id: string, payload: UpdateDish): Promise<Dish> {
    const response = await api.put<Dish>(`/dishes/${id}`, payload)
    return response.data
}

export async function deleteDish(id: string): Promise<void> {
    await api.delete(`/dishes/${id}`)
}
