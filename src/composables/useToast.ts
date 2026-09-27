import { reactive, readonly } from 'vue'
import type { ToastTipo } from '@/types/Toast'

/** 3.2 s en pantalla: suficiente para leerlo, corto para no estorbar. */
const DURACION = 3200

const estado = reactive({
  visible: false,
  mensaje: '',
  tipo: 'exito' as ToastTipo,
  duracion: DURACION,
})

let temporizador: ReturnType<typeof setTimeout> | undefined

/**
 * Un solo toast para toda la app (igual que useAuth), así las páginas
 * no repiten el setTimeout ni el flag de visibilidad.
 */
export function useToast() {
  function mostrar(mensaje: string, tipo: ToastTipo = 'exito') {
    estado.mensaje = mensaje
    estado.tipo = tipo
    estado.visible = true

    clearTimeout(temporizador)
    temporizador = setTimeout(cerrar, DURACION)
  }

  function cerrar() {
    clearTimeout(temporizador)
    estado.visible = false
  }

  return {
    state: readonly(estado),
    mostrar,
    cerrar,
  }
}
