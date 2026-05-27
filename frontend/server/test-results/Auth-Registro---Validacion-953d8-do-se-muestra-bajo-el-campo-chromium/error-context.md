# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Auth.spec.ts >> Registro - Validaciones del formulario >> TC-059: Error de email inválido se muestra bajo el campo
- Location: tests\Auth.spec.ts:187:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.registro-error-message').filter({ hasText: /email|formato/i }).first()
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for locator('.registro-error-message').filter({ hasText: /email|formato/i }).first()

```

```yaml
- img "Dulce hogar logo"
- text: Dulce hogar Tradición y Calidad ?
- main:
  - heading "Crear Cuenta" [level=1]
  - text: "Email:"
  - textbox "Email:":
    - /placeholder: nombre@tucorreo.com
    - text: correo-invalido
  - text: "Cédula:"
  - textbox "Cédula:":
    - /placeholder: Solo números, máximo 10 dígitos
    - text: "1234567890"
  - text: "Nombre completo:"
  - textbox "Nombre completo:": Juan Perez
  - text: "Contraseña:"
  - textbox "Contraseña:": Clave1234!
  - text: Al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&)
  - checkbox "Acepto los términos y condiciones" [checked]
  - text: Acepto los términos y condiciones
  - button "Registrar"
- contentinfo:
  - heading "Redes sociales" [level=4]
  - link:
    - /url: https://www.facebook.com/dulce.hogar.3192479
    - img
  - link:
    - /url: https://www.instagram.com/dulcehogarcaicedonia?igsh=ZnA2MWVicnZod2ly
    - img
  - link:
    - /url: https://wa.me/573103749429?text=Hola,+quiero+más+información
    - img
  - paragraph: "Dulce hogar del Norte S.A.S NIT Ubicados en: Cra 16 #7-17"
  - link "Consejo de Seguridad":
    - /url: /consejo-de-seguridad
  - text: /
  - link "Términos y Condiciones":
    - /url: /terminos-y-condiciones
  - text: /
  - link "Preguntas Frecuentes":
    - /url: /preguntas-frecuentes
  - text: © 2025 FDO, todos los derechos reservados
- link "Contactar por WhatsApp":
  - /url: https://wa.me/573103749429?text=Hola,%20me%20gustaría%20obtener%20más%20información
  - img
```

# Test source

```ts
  100 |     await expect(btn).toBeDisabled({ timeout: 2000 });
  101 |   });
  102 | 
  103 |   test('TC-042: SimpleFooter visible en la página de login', async ({ page }) => {
  104 |     await expect(page.locator('.simple-footer')).toBeVisible();
  105 |   });
  106 | });
  107 | 
  108 | 
  109 | // ─────────────────────────────────────────────────────────────────────────────
  110 | // TESTS: Registro (/registro)
  111 | // Selectores basados en Registro.jsx con IDs: registro-email, registro-cedula, etc.
  112 | // ─────────────────────────────────────────────────────────────────────────────
  113 | 
  114 | test.describe('Registro - Estructura de la página', () => {
  115 | 
  116 |   test.beforeEach(async ({ page }) => {
  117 |     await page.goto('/registro');
  118 |   });
  119 | 
  120 |   test('TC-050: Página de registro carga correctamente', async ({ page }) => {
  121 |     await expect(page).toHaveURL(/\/registro/);
  122 |     await expect(page.locator('.registro-form-title')).toHaveText('Crear Cuenta');
  123 |   });
  124 | 
  125 |   test('TC-051: Campo Email con id "registro-email" visible', async ({ page }) => {
  126 |     const inputEmail = page.locator('#registro-email');
  127 |     await expect(inputEmail).toBeVisible();
  128 |     await expect(inputEmail).toHaveAttribute('placeholder', 'nombre@tucorreo.com');
  129 |   });
  130 | 
  131 |   test('TC-052: Campo Cédula con id "registro-cedula" visible', async ({ page }) => {
  132 |     const inputCedula = page.locator('#registro-cedula');
  133 |     await expect(inputCedula).toBeVisible();
  134 |     await expect(inputCedula).toHaveAttribute('placeholder', /números|dígitos/i);
  135 |   });
  136 | 
  137 |   test('TC-053: Campo Nombre completo con id "registro-nombre" visible', async ({ page }) => {
  138 |     await expect(page.locator('#registro-nombre')).toBeVisible();
  139 |   });
  140 | 
  141 |   test('TC-054: Campo Contraseña con id "registro-contrasena" visible', async ({ page }) => {
  142 |     const inputPass = page.locator('#registro-contrasena');
  143 |     await expect(inputPass).toBeVisible();
  144 |     await expect(inputPass).toHaveAttribute('type', 'password');
  145 |   });
  146 | 
  147 |   test('TC-055: Hint de contraseña visible ("Al menos 8 caracteres...")', async ({ page }) => {
  148 |     const hint = page.locator('.registro-password-hint');
  149 |     await expect(hint).toBeVisible();
  150 |     await expect(hint).toContainText(/8 caracteres/i);
  151 |   });
  152 | 
  153 |   test('TC-056: Checkbox de términos y condiciones visible', async ({ page }) => {
  154 |     const checkbox = page.locator('.registro-terminos-checkbox');
  155 |     await expect(checkbox).toBeVisible();
  156 |     await expect(checkbox).not.toBeChecked();
  157 |   });
  158 | 
  159 |   test('TC-057: Botón "Registrar" visible y habilitado', async ({ page }) => {
  160 |     const btn = page.locator('.registro-btn-registrar');
  161 |     await expect(btn).toBeVisible();
  162 |     await expect(btn).toBeEnabled();
  163 |     await expect(btn).toHaveText('Registrar');
  164 |   });
  165 | });
  166 | 
  167 | test.describe('Registro - Validaciones del formulario', () => {
  168 | 
  169 |   test.beforeEach(async ({ page }) => {
  170 |     await page.goto('/registro');
  171 |   });
  172 | 
  173 |   test('TC-058: Error al intentar registrar sin llenar ningún campo', async ({ page }) => {
  174 |     // Hacer clic en registrar sin llenar nada
  175 |     await page.locator('.registro-btn-registrar').click();
  176 |     
  177 |     // Tu app muestra errores en el formulario (no SweetAlert primero)
  178 |     // Los errores aparecen después de la validación
  179 |     const errores = page.locator('.registro-error-message');
  180 |     await expect(errores.first()).toBeVisible({ timeout: 3000 });
  181 |     
  182 |     // Verificar que hay múltiples errores (email, cédula, nombre, contraseña, términos)
  183 |     const cantidadErrores = await errores.count();
  184 |     expect(cantidadErrores).toBeGreaterThanOrEqual(3);
  185 |   });
  186 | 
  187 |   test('TC-059: Error de email inválido se muestra bajo el campo', async ({ page }) => {
  188 |     // Llenar todos los campos con datos válidos excepto el email
  189 |     await page.locator('#registro-email').fill('correo-invalido');
  190 |     await page.locator('#registro-cedula').fill('1234567890');
  191 |     await page.locator('#registro-nombre').fill('Juan Perez');
  192 |     await page.locator('#registro-contrasena').fill('Clave1234!');
  193 |     await page.locator('.registro-terminos-checkbox').check();
  194 |     
  195 |     // Intentar registrar
  196 |     await page.locator('.registro-btn-registrar').click();
  197 |     
  198 |     // Buscar el error específico de email
  199 |     const errorEmail = page.locator('.registro-error-message').filter({ hasText: /email|formato/i }).first();
> 200 |     await expect(errorEmail).toBeVisible({ timeout: 3000 });
      |                              ^ Error: expect(locator).toBeVisible() failed
  201 |   });
  202 | 
  203 |   test('TC-060: La cédula solo acepta números (se recortan letras automáticamente)', async ({ page }) => {
  204 |     const inputCedula = page.locator('#registro-cedula');
  205 |     // El handler handleCedulaChange usa .replace(/\D/g, '') 
  206 |     await inputCedula.fill('12abc34');
  207 |     await expect(inputCedula).toHaveValue('1234');
  208 |   });
  209 | 
  210 |   test('TC-061: La cédula acepta máximo 10 dígitos', async ({ page }) => {
  211 |     const inputCedula = page.locator('#registro-cedula');
  212 |     await inputCedula.fill('12345678901234');
  213 |     await expect(inputCedula).toHaveValue('1234567890');
  214 |   });
  215 | 
  216 |   test('TC-062: Error de contraseña débil se muestra bajo el campo', async ({ page }) => {
  217 |     // Llenar todos los campos con datos válidos excepto la contraseña
  218 |     await page.locator('#registro-email').fill('test@test.com');
  219 |     await page.locator('#registro-cedula').fill('1234567890');
  220 |     await page.locator('#registro-nombre').fill('Juan Perez');
  221 |     await page.locator('#registro-contrasena').fill('clave123');  // Contraseña débil (sin mayúscula, sin carácter especial)
  222 |     await page.locator('.registro-terminos-checkbox').check();
  223 |     
  224 |     // Intentar registrar
  225 |     await page.locator('.registro-btn-registrar').click();
  226 |     
  227 |     // Buscar error de contraseña
  228 |     const errorPass = page.locator('.registro-error-message').filter({ hasText: /contraseña|8 caracteres|mayúscula|minúscula|número|carácter especial/i }).first();
  229 |     await expect(errorPass).toBeVisible({ timeout: 3000 });
  230 |   });
  231 | 
  232 |   test('TC-063: Error si no acepta términos y condiciones', async ({ page }) => {
  233 |     // Llenar todos los campos correctamente
  234 |     await page.locator('#registro-email').fill('test@test.com');
  235 |     await page.locator('#registro-cedula').fill('1234567890');
  236 |     await page.locator('#registro-nombre').fill('Juan Perez');
  237 |     await page.locator('#registro-contrasena').fill('Clave1234!');
  238 |     // NO marcar el checkbox de términos
  239 |     
  240 |     // Intentar registrar
  241 |     await page.locator('.registro-btn-registrar').click();
  242 |     
  243 |     // Buscar error de términos
  244 |     const errorTerminos = page.locator('.registro-error-message').filter({ hasText: /términos|aceptar/i }).first();
  245 |     await expect(errorTerminos).toBeVisible({ timeout: 3000 });
  246 |   });
  247 | 
  248 |   test('TC-064: Click en "términos y condiciones" navega a la página correcta', async ({ page }) => {
  249 |     await page.locator('.registro-terminos-link').click();
  250 |     await expect(page).toHaveURL(/terminosycondiciones/i);
  251 |   });
  252 | });
```