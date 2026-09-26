import { api } from "@/lib/api-client"
import type { CreateCombo, UpdateCombo, Combos } from "@/types/combosDtos"

export async function getCombos(): Promise<Combos>{
    const response = await api.get<Combos>("/Combos")
    return response.data as Combos
}

