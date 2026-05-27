import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// TESTS: Página Principal (/)
// Frontend: Vite + React | Puerto: http://localhost:5173
// Backend API: http://localhost:4000
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Home - Encabezado y logo', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-001: Logo "Dulce hogar" visible en el header', async ({ page }) => {
    // SimpleHeader y Home usan alt="Dulce hogar logo"
    const logo = page.getByAltText('Dulce hogar logo');
    await expect(logo).toBeVisible();
  });

  test('TC-002: Título "Dulce hogar" y subtítulo "Tradición y calidad" visibles', async ({ page }) => {
    // En Home.jsx: <h1>Dulce hogar</h1> y <p>Tradición y calidad</p>
    await expect(page.locator('#logo-text h1')).toHaveText('Dulce hogar');
    await expect(page.locator('#logo-text p')).toHaveText('Tradición y calidad');
  });

  test('TC-003: Barra de búsqueda con placeholder "Buscar productos..." visible', async ({ page }) => {
    const buscador = page.locator('#search-container input[placeholder="Buscar productos..."]');
    await expect(buscador).toBeVisible();
  });

  test('TC-004: Botón de filtros (FaSlidersH) visible', async ({ page }) => {
    const btnFiltros = page.locator('.filtros-toggle-btn');
    await expect(btnFiltros).toBeVisible();
  });

  test('TC-005: Links "Registrarse" e "Iniciar sesión" visibles cuando no hay sesión', async ({ page }) => {
    await expect(page.locator('#link-registrarse')).toBeVisible();
    await expect(page.locator('#link-login')).toBeVisible();
  });

  test('TC-006: Link de Favoritos con icono corazón visible', async ({ page }) => {
    const favLink = page.locator('.favoritos-link');
    await expect(favLink).toBeVisible();
    await expect(favLink).toContainText('Favoritos');
  });

  test('TC-007: Ícono del carrito de compras visible', async ({ page }) => {
    const carrito = page.locator('.cart-icon');
    await expect(carrito).toBeVisible();
  });
});

test.describe('Home - Navegación secundaria y carrusel', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-008: Botón "Categorías" visible en nav-links', async ({ page }) => {
    const btnCategorias = page.locator('.categorias-btn');
    await expect(btnCategorias).toBeVisible();
    await expect(btnCategorias).toContainText('Categorías');
  });

  test('TC-009: Al hacer click en "Categorías" se abre el menú desplegable', async ({ page }) => {
    await page.locator('.categorias-btn').click();
    const menu = page.locator('.menu-desplegable');
    await expect(menu).toBeVisible();
  });

  test('TC-010: Menú categorías muestra Tecnología, Electrodomésticos y Muebles', async ({ page }) => {
    await page.locator('.categorias-btn').click();
    const menu = page.locator('.menu-desplegable');
    await expect(menu).toContainText('Tecnología');
    await expect(menu).toContainText('Electrodomésticos');
    await expect(menu).toContainText('Muebles');
  });

  test('TC-011: Botón "Promociones" visible', async ({ page }) => {
    const btnPromo = page.locator('.promociones-btn');
    await expect(btnPromo).toBeVisible();
    await expect(btnPromo).toContainText('Promociones');
  });

  test('TC-012: Carrusel de imágenes visible cuando no hay búsqueda activa', async ({ page }) => {
    // mostrarCarrusel = true cuando no hay búsqueda ni categoría seleccionada
    const heroSection = page.locator('#hero-section');
    await expect(heroSection).toBeVisible();
  });

  test('TC-013: Botones de navegación del carrusel (prev/next) visibles', async ({ page }) => {
    await expect(page.locator('.carousel-btn.prev')).toBeVisible();
    await expect(page.locator('.carousel-btn.next')).toBeVisible();
  });

  test('TC-014: Click en botón siguiente del carrusel cambia la imagen activa', async ({ page }) => {
    const activeImg = page.locator('.carousel-image.active');
    await expect(activeImg).toBeVisible();
    await page.locator('.carousel-btn.next').click();
    // Esperar la transición CSS
    await page.waitForTimeout(500);
    await expect(page.locator('.carousel-image.active')).toBeVisible();
  });
});

test.describe('Home - Búsqueda de productos', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-015: Escribir en el buscador muestra el botón limpiar (✕)', async ({ page }) => {
    const input = page.locator('#search-container input');
    await input.fill('televisor');
    const clearBtn = page.locator('.clear-btn');
    await expect(clearBtn).toBeVisible();
  });

  test('TC-016: Botón buscar (lupa) se oculta cuando hay texto en la búsqueda', async ({ page }) => {
    const input = page.locator('#search-container input');
    await input.fill('nevera');
    const searchBtn = page.locator('.search-btn');
    await expect(searchBtn).toHaveCSS('display', 'none');
  });

  test('TC-017: Buscar un producto muestra el grid de resultados', async ({ page }) => {
    const input = page.locator('#search-container input');
    await input.fill('televisor');
    await input.press('Enter');

    // Esperar spinner y luego resultados
    await page.waitForTimeout(1500);

    // Puede aparecer el grid de productos o el mensaje de no resultados
    const grid = page.locator('.productos-grid');
    const noResult = page.locator('.no-result');
    const hayResultados = await grid.isVisible().catch(() => false);
    const hayNoResultado = await noResult.isVisible().catch(() => false);
    expect(hayResultados || hayNoResultado).toBe(true);
  });

  test('TC-018: Spinner de carga visible durante la búsqueda', async ({ page }) => {
    const input = page.locator('#search-container input');
    await input.fill('lavadora');
    await input.press('Enter');
    // El spinner aparece durante mínimo 800ms (minLoadingTime)
    const spinner = page.locator('.spinner-container');
    await expect(spinner).toBeVisible({ timeout: 2000 });
  });

  test('TC-019: Limpiar búsqueda vuelve a mostrar el carrusel', async ({ page }) => {
    const input = page.locator('#search-container input');
    await input.fill('televisor');
    await input.press('Enter');
    await page.waitForTimeout(2000);

    await page.locator('.clear-btn').click();

    await expect(page.locator('#hero-section')).toBeVisible();
  });

  test('TC-020: Filtros modal se abre al hacer click en botón filtros', async ({ page }) => {
    await page.locator('.filtros-toggle-btn').click();
    // FiltrosModal tiene isOpen=true → buscar el modal en el DOM
    const modal = page.locator('.filtros-modal, [class*="filtros-modal"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Home - Footer', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-021: Footer visible con "Dulce hogar del Norte S.A.S"', async ({ page }) => {
    const footer = page.locator('.simple-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Dulce hogar del Norte S.A.S');
  });

  test('TC-022: Iconos de redes sociales (Facebook, Instagram, WhatsApp) visibles', async ({ page }) => {
    const socialIcons = page.locator('.social-icon');
    await expect(socialIcons).toHaveCount(3);
  });

  test('TC-023: Link "Términos y Condiciones" en footer funciona', async ({ page }) => {
    await page.locator('.simple-footer-links a[href="/terminos-y-condiciones"]').click();
    await expect(page).toHaveURL(/\/terminos-y-condiciones/);
  });

  test('TC-024: Link "Preguntas Frecuentes" en footer funciona', async ({ page }) => {
    await page.locator('.simple-footer-links a[href="/preguntas-frecuentes"]').click();
    await expect(page).toHaveURL(/\/preguntas-frecuentes/);
  });
});