const MONEDA = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const YA_TIENE_SIMBOLO = /^\s*[$€£]/

/**
 * Muestra un valor como moneda: 85 -> "$85.00".
 * Si el backend ya devuelve el precio con símbolo ("$85.00") se respeta tal cual.
 */
export function formatCurrency(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (typeof valor === 'string' && YA_TIENE_SIMBOLO.test(valor)) return valor

  const numero = Number(valor)
  return Number.isFinite(numero) ? MONEDA.format(numero) : String(valor)
}

export function toNumber(valor: unknown): number {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0

  const numero = Number(String(valor ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(numero) ? numero : 0
}
