# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Home.spec.ts >> Home - Búsqueda de productos >> TC-017: Buscar un producto muestra el grid de resultados
- Location: tests\Home.spec.ts:127:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - navigation [ref=e5]:
        - generic [ref=e6]:
          - img "Dulce hogar logo" [ref=e8]
          - generic [ref=e9]:
            - heading "Dulce hogar" [level=1] [ref=e10]
            - paragraph [ref=e11]: Tradición y calidad
        - generic [ref=e12]:
          - generic [ref=e13]:
            - textbox "Buscar productos..." [active] [ref=e14]: televisor
            - button "✕" [ref=e15] [cursor=pointer]
          - button "Filtros" [ref=e16] [cursor=pointer]:
            - img [ref=e17]
        - generic [ref=e19]:
          - link "Registrarse" [ref=e20] [cursor=pointer]:
            - /url: /registro
          - link "Iniciar sesión" [ref=e21] [cursor=pointer]:
            - /url: /login
          - link "Favoritos" [ref=e22] [cursor=pointer]:
            - /url: /favoritos
            - img [ref=e23]
            - text: Favoritos
          - img [ref=e26] [cursor=pointer]
      - generic [ref=e28]:
        - button "Categorías ∨" [ref=e30] [cursor=pointer]
        - button "Promociones" [ref=e31] [cursor=pointer]
        - link "Ayuda" [ref=e32] [cursor=pointer]:
          - /url: "#"
    - main [ref=e33]:
      - generic [ref=e35]: "Búsqueda: \"televisor\" - Encontrados: 0 de 0"
      - generic [ref=e36]:
        - paragraph [ref=e38]: Cargando productos...
        - paragraph [ref=e39]: Por favor espera, esto puede tomar unos segundos
    - contentinfo [ref=e40]:
      - generic [ref=e41]:
        - heading "Redes sociales" [level=4] [ref=e42]
        - generic [ref=e43]:
          - link [ref=e44] [cursor=pointer]:
            - /url: https://www.facebook.com/dulce.hogar.3192479
            - img [ref=e45]
          - link [ref=e47] [cursor=pointer]:
            - /url: https://www.instagram.com/dulcehogarcaicedonia?igsh=ZnA2MWVicnZod2ly
            - img [ref=e48]
          - link [ref=e50] [cursor=pointer]:
            - /url: https://wa.me/573103749429?text=Hola,+quiero+más+información
            - img [ref=e51]
      - paragraph [ref=e54]:
        - text: Dulce hogar del Norte S.A.S
        - text: NIT
        - text: "Ubicados en:"
        - text: "Cra 16 #7-17"
      - generic [ref=e55]:
        - link "Consejo de Seguridad" [ref=e56] [cursor=pointer]:
          - /url: /consejo-de-seguridad
        - generic [ref=e57]: /
        - link "Términos y Condiciones" [ref=e58] [cursor=pointer]:
          - /url: /terminos-y-condiciones
        - generic [ref=e59]: /
        - link "Preguntas Frecuentes" [ref=e60] [cursor=pointer]:
          - /url: /preguntas-frecuentes
      - generic [ref=e61]: © 2025 FDO, todos los derechos reservados
  - link "Contactar por WhatsApp" [ref=e62] [cursor=pointer]:
    - /url: https://wa.me/573103749429?text=Hola,%20me%20gustaría%20obtener%20más%20información
    - img [ref=e63]
```

# Test source

```ts
  40  |   });
  41  | 
  42  |   test('TC-006: Link de Favoritos con icono corazón visible', async ({ page }) => {
  43  |     const favLink = page.locator('.favoritos-link');
  44  |     await expect(favLink).toBeVisible();
  45  |     await expect(favLink).toContainText('Favoritos');
  46  |   });
  47  | 
  48  |   test('TC-007: Ícono del carrito de compras visible', async ({ page }) => {
  49  |     const carrito = page.locator('.cart-icon');
  50  |     await expect(carrito).toBeVisible();
  51  |   });
  52  | });
  53  | 
  54  | test.describe('Home - Navegación secundaria y carrusel', () => {
  55  | 
  56  |   test.beforeEach(async ({ page }) => {
  57  |     await page.goto('/');
  58  |   });
  59  | 
  60  |   test('TC-008: Botón "Categorías" visible en nav-links', async ({ page }) => {
  61  |     const btnCategorias = page.locator('.categorias-btn');
  62  |     await expect(btnCategorias).toBeVisible();
  63  |     await expect(btnCategorias).toContainText('Categorías');
  64  |   });
  65  | 
  66  |   test('TC-009: Al hacer click en "Categorías" se abre el menú desplegable', async ({ page }) => {
  67  |     await page.locator('.categorias-btn').click();
  68  |     const menu = page.locator('.menu-desplegable');
  69  |     await expect(menu).toBeVisible();
  70  |   });
  71  | 
  72  |   test('TC-010: Menú categorías muestra Tecnología, Electrodomésticos y Muebles', async ({ page }) => {
  73  |     await page.locator('.categorias-btn').click();
  74  |     const menu = page.locator('.menu-desplegable');
  75  |     await expect(menu).toContainText('Tecnología');
  76  |     await expect(menu).toContainText('Electrodomésticos');
  77  |     await expect(menu).toContainText('Muebles');
  78  |   });
  79  | 
  80  |   test('TC-011: Botón "Promociones" visible', async ({ page }) => {
  81  |     const btnPromo = page.locator('.promociones-btn');
  82  |     await expect(btnPromo).toBeVisible();
  83  |     await expect(btnPromo).toContainText('Promociones');
  84  |   });
  85  | 
  86  |   test('TC-012: Carrusel de imágenes visible cuando no hay búsqueda activa', async ({ page }) => {
  87  |     // mostrarCarrusel = true cuando no hay búsqueda ni categoría seleccionada
  88  |     const heroSection = page.locator('#hero-section');
  89  |     await expect(heroSection).toBeVisible();
  90  |   });
  91  | 
  92  |   test('TC-013: Botones de navegación del carrusel (prev/next) visibles', async ({ page }) => {
  93  |     await expect(page.locator('.carousel-btn.prev')).toBeVisible();
  94  |     await expect(page.locator('.carousel-btn.next')).toBeVisible();
  95  |   });
  96  | 
  97  |   test('TC-014: Click en botón siguiente del carrusel cambia la imagen activa', async ({ page }) => {
  98  |     const activeImg = page.locator('.carousel-image.active');
  99  |     await expect(activeImg).toBeVisible();
  100 |     await page.locator('.carousel-btn.next').click();
  101 |     // Esperar la transición CSS
  102 |     await page.waitForTimeout(500);
  103 |     await expect(page.locator('.carousel-image.active')).toBeVisible();
  104 |   });
  105 | });
  106 | 
  107 | test.describe('Home - Búsqueda de productos', () => {
  108 | 
  109 |   test.beforeEach(async ({ page }) => {
  110 |     await page.goto('/');
  111 |   });
  112 | 
  113 |   test('TC-015: Escribir en el buscador muestra el botón limpiar (✕)', async ({ page }) => {
  114 |     const input = page.locator('#search-container input');
  115 |     await input.fill('televisor');
  116 |     const clearBtn = page.locator('.clear-btn');
  117 |     await expect(clearBtn).toBeVisible();
  118 |   });
  119 | 
  120 |   test('TC-016: Botón buscar (lupa) se oculta cuando hay texto en la búsqueda', async ({ page }) => {
  121 |     const input = page.locator('#search-container input');
  122 |     await input.fill('nevera');
  123 |     const searchBtn = page.locator('.search-btn');
  124 |     await expect(searchBtn).toHaveCSS('display', 'none');
  125 |   });
  126 | 
  127 |   test('TC-017: Buscar un producto muestra el grid de resultados', async ({ page }) => {
  128 |     const input = page.locator('#search-container input');
  129 |     await input.fill('televisor');
  130 |     await input.press('Enter');
  131 | 
  132 |     // Esperar spinner y luego resultados
  133 |     await page.waitForTimeout(1500);
  134 | 
  135 |     // Puede aparecer el grid de productos o el mensaje de no resultados
  136 |     const grid = page.locator('.productos-grid');
  137 |     const noResult = page.locator('.no-result');
  138 |     const hayResultados = await grid.isVisible().catch(() => false);
  139 |     const hayNoResultado = await noResult.isVisible().catch(() => false);
> 140 |     expect(hayResultados || hayNoResultado).toBe(true);
      |                                             ^ Error: expect(received).toBe(expected) // Object.is equality
  141 |   });
  142 | 
  143 |   test('TC-018: Spinner de carga visible durante la búsqueda', async ({ page }) => {
  144 |     const input = page.locator('#search-container input');
  145 |     await input.fill('lavadora');
  146 |     await input.press('Enter');
  147 |     // El spinner aparece durante mínimo 800ms (minLoadingTime)
  148 |     const spinner = page.locator('.spinner-container');
  149 |     await expect(spinner).toBeVisible({ timeout: 2000 });
  150 |   });
  151 | 
  152 |   test('TC-019: Limpiar búsqueda vuelve a mostrar el carrusel', async ({ page }) => {
  153 |     const input = page.locator('#search-container input');
  154 |     await input.fill('televisor');
  155 |     await input.press('Enter');
  156 |     await page.waitForTimeout(2000);
  157 | 
  158 |     await page.locator('.clear-btn').click();
  159 | 
  160 |     await expect(page.locator('#hero-section')).toBeVisible();
  161 |   });
  162 | 
  163 |   test('TC-020: Filtros modal se abre al hacer click en botón filtros', async ({ page }) => {
  164 |     await page.locator('.filtros-toggle-btn').click();
  165 |     // FiltrosModal tiene isOpen=true → buscar el modal en el DOM
  166 |     const modal = page.locator('.filtros-modal, [class*="filtros-modal"]').first();
  167 |     await expect(modal).toBeVisible({ timeout: 3000 });
  168 |   });
  169 | });
  170 | 
  171 | test.describe('Home - Footer', () => {
  172 | 
  173 |   test.beforeEach(async ({ page }) => {
  174 |     await page.goto('/');
  175 |   });
  176 | 
  177 |   test('TC-021: Footer visible con "Dulce hogar del Norte S.A.S"', async ({ page }) => {
  178 |     const footer = page.locator('.simple-footer');
  179 |     await expect(footer).toBeVisible();
  180 |     await expect(footer).toContainText('Dulce hogar del Norte S.A.S');
  181 |   });
  182 | 
  183 |   test('TC-022: Iconos de redes sociales (Facebook, Instagram, WhatsApp) visibles', async ({ page }) => {
  184 |     const socialIcons = page.locator('.social-icon');
  185 |     await expect(socialIcons).toHaveCount(3);
  186 |   });
  187 | 
  188 |   test('TC-023: Link "Términos y Condiciones" en footer funciona', async ({ page }) => {
  189 |     await page.locator('.simple-footer-links a[href="/terminos-y-condiciones"]').click();
  190 |     await expect(page).toHaveURL(/\/terminos-y-condiciones/);
  191 |   });
  192 | 
  193 |   test('TC-024: Link "Preguntas Frecuentes" en footer funciona', async ({ page }) => {
  194 |     await page.locator('.simple-footer-links a[href="/preguntas-frecuentes"]').click();
  195 |     await expect(page).toHaveURL(/\/preguntas-frecuentes/);
  196 |   });
  197 | });
```