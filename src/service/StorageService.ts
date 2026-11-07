import { api } from '@/lib/api-client'
import type { Storages, StorageIn, StorageOut, StorageUpdate } from '@/types/Storage'

export async function getStorage(
    branchId: number,
    page = 1,
    pageSize = 20,
    search = '',
    orderBy = '',
    isSupply: boolean | null = null
){
    const response = await api.get<Storages>(`/branches/${branchId}/storage`, {
        params: {
            page,
            pageSize,
            search: search || undefined,
            orderBy,
            isSupply
        }
    })
    return response.data
}

export async function putStorage(branchId: number, productId: number, payload: StorageUpdate) {
    const response = await api.put<StorageUpdate>(`/branches/${branchId}/storage/${productId}`, payload)
    return response.data
}

export async function inStorage(branchId: number, payload: StorageIn) {
    const response = await api.post<StorageIn>(`/branches/${branchId}/storage/in`, payload)
    return response.data
}

export async function outStorage(branchId: number, payload: StorageOut) {
    const response = await api.post<StorageOut>(`/branches/${branchId}/storage/out`, payload)
    return response.data
}