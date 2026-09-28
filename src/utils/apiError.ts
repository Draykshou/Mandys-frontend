/** Cuerpo de error que devuelve la API. */
interface ApiError {
  response?: { data?: { message?: string } }
}

/** Usa el mensaje de la API si lo manda; si no, un texto genérico. */
export function mensajeDeError(err: unknown, porDefecto: string): string {
  const message = (err as ApiError | undefined)?.response?.data?.message
  return message ? `Error: ${message}` : porDefecto
}
