export interface Customer{
    id: number
    firstName: string
    lastname: string
    email: string
    password: string
    hasLogin: boolean
    bannedAt: string
}

export interface RegisterCustomer{
    firstName: string
    lastname: string
    email: string
    password: string
}

export interface CreateCustomer{
    firstName: string
    lastname: string
    email: string
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
    totalPage: number
    items: Customer[]
}