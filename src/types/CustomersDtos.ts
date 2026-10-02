export interface Customer{
    id: number
    firstName: string
    lastName: string
    email: string
}

export interface RegisterCustomer{
    firstName: string
    lastName: string
    email: string
    password: string
}

export interface UpdateCustomer{
    firstName: string
    lastName: string
    email: string
}

export interface Customers{
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    items: Customer[]
}