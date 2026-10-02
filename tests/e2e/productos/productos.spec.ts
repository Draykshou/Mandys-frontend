import { test, expect } from '@playwright/test';
// Agrupamos todas las pruebas de esta sección
test.describe('CU-01 Registrar Producto', () => {

  // Este código se ejecutará automáticamente ANTES de cada 'test'
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login'); 
    await page.getByPlaceholder('Ej. cmedina@mandys.mx o ID de empleado').fill('admin@mandyspos.com');
    await page.getByPlaceholder('••••••••••••').fill('mandyspos');
    await page.getByRole('button', { name: /ingresar al sistema/i }).click();
    
    await expect(page.getByText('Productos', { exact: true })).toBeVisible();
    await page.goto('http://localhost:5173/catalogs/products');
  });

  // PRUEBA 1: Registro válido
  test('TC-PRO-001 Registrar producto valido', async ({ page }) => {
    await page.getByRole('button', { name: 'Agregar Producto' }).click();

    const nombreUnico = `Hamburguesa ${Date.now()}`;
    await page.getByPlaceholder('Ej. Tacos de Rib Eye con Tuétano').fill(nombreUnico);
    await page.getByPlaceholder('0.00').first().fill('80');
    await page.getByPlaceholder('0.00').nth(1).fill('120');
    await page.locator('select').nth(1).selectOption({ label: 'Kilogramos' });
    await page.getByRole('button', { name: 'Guardar' }).click();

    const tituloModal = page.getByText('Crear producto', { exact: true });
    await expect(tituloModal).toBeHidden();
  });

  // PRUEBA 2: Validación de precio negativo
  test('TC-PRO-002 Validar bloqueo de precio de venta negativo', async ({ page }) => {
    await page.getByRole('button', { name: 'Agregar Producto' }).click();

    const nombreUnico = `Prueba Negativa ${Date.now()}`;
    await page.getByPlaceholder('Ej. Tacos de Rib Eye con Tuétano').fill(nombreUnico);
    await page.getByPlaceholder('0.00').first().fill('3');
    await page.getByPlaceholder('0.00').nth(1).fill('-33');
    await page.locator('select').nth(1).selectOption({ label: 'Kilogramos' });
    await page.getByRole('button', { name: 'Guardar' }).click();

    const tituloModal = page.getByText('Crear producto', { exact: true });
    await expect(tituloModal).toBeVisible();
  });

  // PRUEBA 4: Flujo Alterno A2 - Producto Duplicado
  test('TC-PRO-004 Validar rechazo por producto duplicado', async ({ page }) => {
    const nombreDuplicado = `Refresco ${Date.now()}`;

    // --- PASO 1: CREAR EL PRODUCTO POR PRIMERA VEZ ---
    await page.getByRole('button', { name: 'Agregar Producto' }).click();
    await page.getByPlaceholder('Ej. Tacos de Rib Eye con Tuétano').fill(nombreDuplicado);
    await page.getByPlaceholder('0.00').first().fill('20');
    await page.getByPlaceholder('0.00').nth(1).fill('35');
    await page.locator('select').nth(1).selectOption({ label: 'Kilogramos' });
    await page.getByRole('button', { name: 'Guardar' }).click();
    
    // Validamos que el primero se guardó correctamente
    const tituloModal = page.getByText('Crear producto', { exact: true });
    await expect(tituloModal).toBeHidden();

    // --- PASO 2: INTENTAR CREAR EL MISMO PRODUCTO EXACTAMENTE IGUAL ---
    await page.getByRole('button', { name: 'Agregar Producto' }).click();
    await page.getByPlaceholder('Ej. Tacos de Rib Eye con Tuétano').fill(nombreDuplicado);
    await page.getByPlaceholder('0.00').first().fill('20');
    await page.getByPlaceholder('0.00').nth(1).fill('35');
    await page.locator('select').nth(1).selectOption({ label: 'Kilogramos' });
    await page.getByRole('button', { name: 'Guardar' }).click();

    // --- PASO 3: VALIDACIÓN FINAL ---
    // El modal NO debe cerrarse porque el backend debe rechazar el duplicado
    await expect(tituloModal).toBeVisible();
 });

});
