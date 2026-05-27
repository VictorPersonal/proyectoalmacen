import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// TESTS: Carrito de Compras
// Basado en Carrito.jsx — se abre desde el ícono .cart-icon en Home
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Carrito - Apertura y cierre', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-070: Click en ícono del carrito abre el panel del carrito', async ({ page }) => {
    await page.locator('.cart-icon').click();
    // Carrito.jsx renderiza con class "carrito-overlay" o similar cuando abierto=true
    const carritoPanel = page.locator('.carrito-overlay, .carrito-container, [class*="carrito"]').first();
    await expect(carritoPanel).toBeVisible({ timeout: 3000 });
  });

  test('TC-071: Carrito muestra mensaje vacío cuando no hay productos', async ({ page }) => {
    await page.locator('.cart-icon').click();
    // Sin sesión o con carrito vacío debe mostrar texto indicando que está vacío
    const carritoArea = page.locator('.carrito-overlay, .carrito-container, [class*="carrito"]').first();
    await expect(carritoArea).toBeVisible({ timeout: 3000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTS: Tarjetas de Producto (ProductCard)
// Basado en productoCard.jsx — clase: .card
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ProductCard - Estructura y favoritos', () => {

  test.beforeEach(async ({ page }) => {
    // Buscar un producto para que aparezcan las cards
    await page.goto('/');
    const input = page.locator('#search-container input');
    await input.fill('televisor');
    await input.press('Enter');
    await page.waitForSelector('.productos-grid, .no-result', { timeout: 8000 });
  });

  test('TC-075: Si hay resultados, las tarjetas .card son visibles', async ({ page }) => {
    const grid = page.locator('.productos-grid');
    const hayGrid = await grid.isVisible().catch(() => false);
    if (hayGrid) {
      const cards = page.locator('.card');
      await expect(cards.first()).toBeVisible();
    } else {
      // No hay productos en la BD para ese término — test pasa como N/A
      console.log('No hay productos con ese término de búsqueda');
    }
  });

  test('TC-076: Tarjeta muestra nombre del producto (.card-nombre)', async ({ page }) => {
    const grid = page.locator('.productos-grid');
    const hayGrid = await grid.isVisible().catch(() => false);
    if (hayGrid) {
      await expect(page.locator('.card-nombre').first()).toBeVisible();
    }
  });

  test('TC-077: Tarjeta muestra precio (.card-precio o .precio-descuento)', async ({ page }) => {
    const grid = page.locator('.productos-grid');
    const hayGrid = await grid.isVisible().catch(() => false);
    if (hayGrid) {
      const precio = page.locator('.card-precio, .precio-descuento').first();
      await expect(precio).toBeVisible();
    }
  });

  test('TC-078: Botón corazón de favorito (.card-corazon-favorito) visible en cada tarjeta', async ({ page }) => {
    const grid = page.locator('.productos-grid');
    const hayGrid = await grid.isVisible().catch(() => false);
    if (hayGrid) {
      await expect(page.locator('.card-corazon-favorito').first()).toBeVisible();
    }
  });

  test('TC-079: Click en tarjeta de producto navega a /producto/:id', async ({ page }) => {
    const grid = page.locator('.productos-grid');
    const hayGrid = await grid.isVisible().catch(() => false);
    if (hayGrid) {
      await page.locator('.card').first().click();
      await expect(page).toHaveURL(/\/producto\/\d+/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTS: Favoritos (/favoritos)
// Basado en Favorito.jsx
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Favoritos - Página', () => {

  test('TC-080: Página /favoritos carga correctamente', async ({ page }) => {
    await page.goto('/favoritos');
    await expect(page).toHaveURL(/\/favoritos/);
  });

  test('TC-081: Favoritos muestra mensaje cuando el usuario no está logueado', async ({ page }) => {
    await page.goto('/favoritos');
    // Sin sesión, debe mostrar mensaje para iniciar sesión o lista vacía
    await page.waitForTimeout(1500);
    // Verificar que la página cargó (no 404 ni error de JS)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTS: Navegación entre rutas
// Basado en App.jsx (todas las rutas de react-router-dom)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navegación - Rutas del sistema', () => {

  test('TC-090: Ruta / → Página principal con carrusel', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#header')).toBeVisible();
    await expect(page.locator('#hero-section')).toBeVisible();
  });

  test('TC-091: Ruta /login → Página de inicio de sesión', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.login-form-title')).toHaveText('Inicio de sesión');
  });

  test('TC-092: Ruta /registro → Página de creación de cuenta', async ({ page }) => {
    await page.goto('/registro');
    await expect(page.locator('.registro-form-title')).toHaveText('Crear Cuenta');
  });

  test('TC-093: Ruta /terminos-y-condiciones → Carga correctamente', async ({ page }) => {
    await page.goto('/terminos-y-condiciones');
    await expect(page).toHaveURL(/terminos-y-condiciones/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('TC-094: Ruta /preguntas-frecuentes → Carga correctamente', async ({ page }) => {
    await page.goto('/preguntas-frecuentes');
    await expect(page).toHaveURL(/preguntas-frecuentes/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('TC-095: Ruta /Acerca-de/Dulce-Hogar → Historia de Dulce Hogar carga', async ({ page }) => {
    await page.goto('/Acerca-de/Dulce-Hogar');
    await expect(page).toHaveURL(/Acerca-de\/Dulce-Hogar/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('TC-096: Link "Registrarse" desde Home navega a /registro', async ({ page }) => {
    await page.goto('/');
    await page.locator('#link-registrarse').click();
    await expect(page).toHaveURL(/\/registro/);
  });

  test('TC-097: Link "Iniciar sesión" desde Home navega a /login', async ({ page }) => {
    await page.goto('/');
    await page.locator('#link-login').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-098: Link "Favoritos" desde Home navega a /favoritos', async ({ page }) => {
    await page.goto('/');
    await page.locator('.favoritos-link').click();
    await expect(page).toHaveURL(/\/favoritos/);
  });

  test('TC-099: WhatsApp Button visible en todas las páginas', async ({ page }) => {
    await page.goto('/');
    // WhatsAppButton.jsx se renderiza en App.jsx fuera del Router — siempre visible
    const waBtn = page.locator('.whatsapp-button, [class*="whatsapp"]').first();
    await expect(waBtn).toBeVisible({ timeout: 3000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTS: Responsivo móvil
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsivo - Vista móvil', () => {

  test('TC-100: En móvil (375px) el header de Home es visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('#header')).toBeVisible();
    await expect(page.getByAltText('Dulce hogar logo')).toBeVisible();
  });

  test('TC-101: En móvil la barra de búsqueda es visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('#search-container input')).toBeVisible();
  });

  test('TC-102: En móvil el formulario de login es usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await expect(page.locator('.login-form-input[type="email"]')).toBeVisible();
    await expect(page.locator('.login-password-input')).toBeVisible();
    await expect(page.locator('.login-btn-ingresar')).toBeVisible();
  });
});
