/**
 * Define la "forma" de un catálogo (Productos, Platillos, Combos, etc.)
 * sin acoplar CatalogTable a ningún catálogo en específico.
 *
 * Los datos solo pueden presentarse de 3 formas:
 * - 'text'    -> texto plano (incluye números, precios ya formateados, etc.)
 * - 'boolean' -> chip Sí / No
 * - 'button'  -> botón de acción propio de esa columna (ej. "Ver receta")
 *
 * La columna de Acciones (editar / eliminar) NO se declara aquí:
 * CatalogTable la agrega siempre al final.
 */
export type CatalogColumnType = 'text' | 'boolean' | 'button'

export interface CatalogColumn {
  /** Llave que existe en cada row (row[key]) */
  key: string
  /** Texto del encabezado de la columna */
  label: string
  type: CatalogColumnType
  /** Alineación del contenido de la celda. Por defecto: 'left' */
  align?: 'left' | 'center' | 'right'

  /** Solo aplica si type === 'button' */
  buttonLabel?: string
  buttonVariant?: 'primary' | 'secondary' | 'outlined'

  /** Solo aplica si type === 'boolean' */
  trueLabel?: string
  falseLabel?: string

  /** Si el valor puede venir vacío/null, qué texto mostrar (ej. "— (Sin valor)") */
  emptyLabel?: string
}

/** Una fila de catálogo: cualquier forma, pero siempre con id */
export type CatalogRow = Record<string, unknown> & { id: number | string }

/** Payload que emite CatalogTable cuando se hace clic en una columna tipo 'button' */
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
