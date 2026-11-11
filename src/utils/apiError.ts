/** Cuerpo de error que devuelve la API. */
interface ApiError {
  message?: string
  code?: string
  response?: { data?: { message?: string } }
}

/** Usa el mensaje de la API si lo manda; si no, un texto genérico. */
export function mensajeDeError(err: unknown, porDefecto: string): string {
  const apiError = err as ApiError | undefined
  if (apiError?.code === 'ERR_NETWORK') {
    return 'No se pudo conectar con el servidor. Verifica que la API esté ejecutándose en http://localhost:8080.'
  }
  const message = apiError?.response?.data?.message
  return message ? `Error: ${message}` : porDefecto
}
