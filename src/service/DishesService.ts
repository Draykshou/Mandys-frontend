import { api } from "@/lib/api-client"
import type { CreateDish, Dish, Dishes, UpdateDish } from "@/types/catalogs/DishesDtos"

export async function getDishes(
    page = 1,
    pageSize = 20,
    search = '',
    orderBy = ''
) {
    const response = await api.get<Dishes>('/dishes', {
        params: {
            page,
            pageSize,
            search: search || undefined,
            orderBy
        }
    })

    return response.data
}


export async function postDish(payload: CreateDish): Promise<Dish> {
    const response = await api.post<Dish>("/dishes", payload)
    return response.data
}

export async function putDish(id: number, payload: UpdateDish): Promise<Dish> {
    const response = await api.put<Dish>(`/dishes/${id}`, payload)
    return response.data
}

export async function putDishImage(id: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.put(`/dishes/${id}/image`,formData)
    return response.data
}

export async function deleteDish(id: number): Promise<void> {
    await api.delete(`/dishes/${id}`)
}
