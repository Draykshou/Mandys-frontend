import { test, expect } from '@playwright/test';
import { usuarios } from '../../datos-prueba/credenciales';

test('TC-001: Login exitoso como administrador', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  
  await page.getByPlaceholder('Ej. cmedina@mandys.mx o ID de empleado').fill(usuarios.admin.email);
  await page.getByPlaceholder('••••••••••••').fill(usuarios.admin.password);
  
  await page.getByRole('button', { name: /ingresar al sistema/i }).click();
  await expect(page).toHaveURL(/.*\/inicio/);
});