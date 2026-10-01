import { api } from "@/lib/api-client"
import type { Combo, Combos, CreateCombo, UpdateCombo } from "@/types/CombosDtos"

export async function getCombos(
    page = 1,
    pageSize = 20,
    search = '',
    orderBy = ''
) {
    const response = await api.get<Combos>('/combos', {
        params: {
            page,
            pageSize,
            search: search || undefined,
            orderBy
        }
    })
    return response.data
}

export async function postCombo(payload: CreateCombo): Promise<Combo> {
    const response = await api.post<Combo>("/combos", payload)
    return response.data
}

export async function putCombo(id: number, payload: UpdateCombo): Promise<Combo> {
    const response = await api.put<Combo>(`/combos/${id}`, payload)
    return response.data
}

export async function deleteCombo(id: number): Promise<void> {
    await api.delete(`/combos/${id}`)
}