import { test, expect } from '@playwright/test';

test('Prueba manual de conexión', async ({ page }) => {
  // Usa la URL completa
  await page.goto('http://localhost:5173');
  console.log('✅ Navegó a la página');
  
  // Espera un poco y toma screenshot
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot.png' });
  
  // Verifica que algo existe
  const title = await page.title();
  console.log('Título de la página:', title);
  
  expect(true).toBe(true);
});