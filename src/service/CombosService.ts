import { api } from "@/lib/api-client"
<<<<<<< HEAD
import type { CreateCombo, UpdateCombo, Combos } from "@/types/CombosDtos"
=======
import type { Combo, Combos, CreateCombo, UpdateCombo } from "@/types/CombosDtos"
>>>>>>> origin/dev/carlos

export async function getCombos(): Promise<Combos>{
    const response = await api.get<Combos>("/combos")
    return response.data as Combos
}

export async function createCombo(payload: CreateCombo): Promise<Combo> {
    const response = await api.post<Combo>("/combos", payload)
    return response.data
}

/** El update reemplaza el combo completo, por eso manda el mismo cuerpo que el alta. */
export async function updateCombo(id: string, payload: UpdateCombo): Promise<Combo> {
    const response = await api.put<Combo>(`/combos/${id}`, payload)
    return response.data
}

export async function deleteCombo(id: string): Promise<void> {
    await api.delete(`/combos/${id}`)
}
