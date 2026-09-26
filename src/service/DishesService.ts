import { api } from "@/lib/api-client"
import type { CreateDish, UpdateDish, Dishes } from "@/types/DishesDtos"

export async function getDishes(): Promise<Dishes>{
    const response = await api.get<Dishes>("/dishes")
    return response.data as Dishes
}

