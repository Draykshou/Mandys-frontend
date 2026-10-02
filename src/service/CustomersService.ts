import { api } from "@/lib/api-client"
import type { Customer, Customers, RegisterCustomer, UpdateCustomer } from "@/types/CustomersDtos"

export async function getCustomers(
    page = 1,
    pageSize = 20,
    search = '',
    orderBy = ''
) {
    const response = await api.get<Customers>('/customers', {
        params: {
            page,
            pageSize,
            search: search || undefined,
            orderBy,
        }
    })
    return response.data
}

export async function postCustomer(payload: RegisterCustomer): Promise<Customer> {
    const response = await api.post<Customer>("/customers/register", payload)
    return response.data
}

export async function putCustomer(id: number, payload: UpdateCustomer): Promise<Customer> {
    const response = await api.put<Customer>(`/customers/${id}`, payload)
    return response.data
}

export async function deleteCustomer(id: number): Promise<void> {
    await api.delete(`/customers/${id}`)
}
