import { api } from "@/lib/api-client"
import type { CreateBranch, Branch, Branches, UpdateBranch } from "@/types/BranchesDtos"

export async function getBranches(
    page = 1,
    pageSize = 20,
    search = '',
    orderBy = ''
) {
    const response = await api.get<Branches>('/branches', {
        params: {
            page,
            pageSize,
            search: search || undefined,
            orderBy,
        }
    })
    return response.data
}

export async function postBranch(payload: CreateBranch): Promise<Branch> {
    const response = await api.post<Branch>("/branches", payload)
    return response.data
}

export async function putBranch(id: number, payload: UpdateBranch): Promise<Branch> {
    const response = await api.put<Branch>(`/branches/${id}`, payload)
    return response.data
}

export async function deleteBranch(id: number): Promise<void> {
    await api.delete(`/branches/${id}`)
}
