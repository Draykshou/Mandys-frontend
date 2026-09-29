export interface Branch{
    id: number,
    name: string,
    address: string,
    warehouseOnly: boolean
}

export interface CreateBranch{
    name: string,
    address: string,
    warehouseOnly: boolean
}

export interface UpdateBranch{
    name: string,
    address: string,
    warehouseOnly: boolean
}

export interface Branches{
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    items: Branch[]
}