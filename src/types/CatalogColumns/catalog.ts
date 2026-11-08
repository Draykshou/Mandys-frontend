
export type CatalogColumnType = 'text' | 'currency' | 'boolean' | 'button'

export interface CatalogColumn {
  key: string
  label: string
  type: CatalogColumnType
  align?: 'left' | 'center' | 'right'

  // Si la columna es de tipo accion
  buttonLabel?: string
  buttonVariant?: 'primary' | 'secondary' | 'outlined'

  // Si la columna es de tipo booleano
  trueLabel?: string
  falseLabel?: string

  // Si la columna muestra solo texto o un boton
  emptyLabel?: string
  
  // Formato personalizado para mostrar el valor de una celda
  format?: (value: unknown, row: Record<string, unknown>) => string
}

export type CatalogRow = Record<string, unknown> & { id: number | string }


export interface CatalogButtonActionPayload {
  columnKey: string
  row: CatalogRow
}

export interface SidebarItem {
  key: string
  label: string
  icon: 'box' | 'book' | 'bag' | 'archive'
  count?: number
}
