export interface ImportProductsFailure {
  
  fila: number
  motivo: string
}

export interface ImportProductsSummary {
  exitosos: number
  fallidos: ImportProductsFailure[]
}
