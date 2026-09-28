import { test, expect } from '@playwright/test'
import { PaginaLogin } from '../../soporte/paginas/PaginaLogin'
import { PaginaProductos } from '../../soporte/paginas/PaginaProductos'
import { usuarios } from '../../datos-prueba/usuarios'
import { nombreUnico } from '../../datos-prueba/productos'

test.describe('XSS con alert', () => {
  let paginaProductos: PaginaProductos

  // PRECONDICIÓN: usuario logueado
  test.beforeEach(async ({ page }) => {
    const paginaLogin = new PaginaLogin(page)
    await paginaLogin.ir()
    await paginaLogin.iniciarSesion(usuarios.admin.usuario, usuarios.admin.password)
    await paginaLogin.esperarLoginExitoso()
    paginaProductos = new PaginaProductos(page)
  })

  test('TC-XSS-001: El nombre del producto NO debe ejecutar un alert', async ({
    page,
  }) => {
    // 1. Escuchamos si aparece algún alert durante todo el test
    let alertaAparecio = false
    page.on('dialog', async (dialog) => {
      alertaAparecio = true
      console.error(`🚨 XSS DETECTADO: apareció "${dialog.message()}"`)
      await dialog.dismiss()
    })

    // 2. Payload simple
    const payload = '<script>alert("XSS")</script>'
    const nombreMalicioso = nombreUnico('ProductoXSS')

    // 3. Creamos un producto con el payload en el nombre
    await paginaProductos.crearProducto({
      nombre: `${nombreMalicioso} ${payload}`,
      precio: '10.00',
    })

    // 4. Vamos al listado donde se muestra el producto
    await paginaProductos.irALista()
    await page.waitForTimeout(2000) // Damos tiempo a que cualquier script corra

    // 5. Verificamos que NO apareció ningún alert
    expect(
      alertaAparecio,
      '🚨 XSS DETECTADO: apareció un alert. El nombre del producto se ejecutó como JavaScript.'
    ).toBe(false)
  })
})