import { api } from "@/lib/api-client"
import type { Combo, Combos, CreateCombo, UpdateCombo } from "@/types/CombosDtos"

export async function getCombos(): Promise<Combos>{
    const response = await api.get<Combos>("/combos")
    return response.data as Combos
}

export async function postCombo(payload: CreateCombo): Promise<Combo> {
    const response = await api.post<Combo>("/combos", payload)
    return response.data
}

/** El update reemplaza el combo completo, por eso manda el mismo cuerpo que el alta. */
export async function putCombo(id: number, payload: UpdateCombo): Promise<Combo> {
    const response = await api.put<Combo>(`/combos/${id}`, payload)
    return response.data
}

export async function deleteCombo(id: number): Promise<void> {
    await api.delete(`/combos/${id}`)
}
