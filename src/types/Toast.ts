/**
 * El tipo del toast ES la acción que lo disparó, y de ahí sale su color.
 *  exito    -> alta o modificación
 *  eliminar -> baja
 *  error    -> la acción falló
 */
export type ToastTipo = 'exito' | 'eliminar' | 'error'
