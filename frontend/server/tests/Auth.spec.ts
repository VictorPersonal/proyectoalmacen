import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// TESTS: Login (/login)
// Selectores basados en Login.jsx con clases: login-form, login-form-input, etc.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login - Estructura de la página', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('TC-030: Página de login carga correctamente', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.login-form-title')).toHaveText('Inicio de sesión');
  });

  test('TC-031: SimpleHeader visible en la página de login', async ({ page }) => {
    await expect(page.locator('.simple-header')).toBeVisible();
    await expect(page.getByAltText('Dulce hogar logo')).toBeVisible();
  });

  test('TC-032: Campo de correo con label "Correo:" visible', async ({ page }) => {
    await expect(page.locator('.login-form-label').first()).toContainText('Correo:');
    const inputEmail = page.locator('.login-form-input[type="email"]');
    await expect(inputEmail).toBeVisible();
    await expect(inputEmail).toHaveAttribute('placeholder', 'correo@ejemplo.com');
  });

  test('TC-033: Campo de contraseña con label "Contraseña:" visible', async ({ page }) => {
    const inputPass = page.locator('.login-password-input');
    await expect(inputPass).toBeVisible();
    await expect(inputPass).toHaveAttribute('placeholder', '********');
  });

  test('TC-034: Botón para mostrar/ocultar contraseña (ojo) visible', async ({ page }) => {
    const togglePass = page.locator('.login-toggle-password');
    await expect(togglePass).toBeVisible();
  });

  test('TC-035: Al hacer click en el ojo, el input de contraseña cambia a tipo text', async ({ page }) => {
    const inputPass = page.locator('.login-password-input');
    const togglePass = page.locator('.login-toggle-password');

    await expect(inputPass).toHaveAttribute('type', 'password');
    await togglePass.click();
    await expect(inputPass).toHaveAttribute('type', 'text');
  });

  test('TC-036: Botón "Ingresar" visible y habilitado', async ({ page }) => {
    const btn = page.locator('.login-btn-ingresar');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveText('Ingresar');
  });

  test('TC-037: Link "Regístrate aquí" navega a /registro', async ({ page }) => {
    await page.locator('.login-register-link a').click();
    await expect(page).toHaveURL(/\/registro/);
  });

  test('TC-038: Link "Recupérala aquí" navega a la página de recuperar contraseña', async ({ page }) => {
    await page.locator('.login-forgot-password a').click();
    await expect(page).toHaveURL(/recuperar/i);
  });
});

test.describe('Login - Validaciones', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('TC-039: No se puede hacer login con campos vacíos (SweetAlert2 de error)', async ({ page }) => {
    await page.locator('.login-btn-ingresar').click();
    // SweetAlert2 genera un popup con clase swal2-popup
    const swalPopup = page.locator('.swal2-popup');
    await expect(swalPopup).toBeVisible({ timeout: 3000 });
    await expect(swalPopup).toContainText(/obligatorios|correo|contraseña/i);
  });

  test('TC-040: Login con credenciales incorrectas muestra SweetAlert de error', async ({ page }) => {
    await page.locator('.login-form-input[type="email"]').fill('noexiste@test.com');
    await page.locator('.login-password-input').fill('ClaveIncorrecta1!');
    await page.locator('.login-btn-ingresar').click();

    const swalPopup = page.locator('.swal2-popup');
    await expect(swalPopup).toBeVisible({ timeout: 5000 });
    await expect(swalPopup).toContainText(/incorrectos|error/i);
  });

  test('TC-041: Botón "Ingresar" se deshabilita mientras carga', async ({ page }) => {
    await page.locator('.login-form-input[type="email"]').fill('test@test.com');
    await page.locator('.login-password-input').fill('Password1!');
    await page.locator('.login-btn-ingresar').click();

    // Durante la petición, el botón se deshabilita y muestra spinner
    const btn = page.locator('.login-btn-ingresar');
    await expect(btn).toBeDisabled({ timeout: 2000 });
  });

  test('TC-042: SimpleFooter visible en la página de login', async ({ page }) => {
    await expect(page.locator('.simple-footer')).toBeVisible();
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// TESTS: Registro (/registro)
// Selectores basados en Registro.jsx con IDs: registro-email, registro-cedula, etc.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Registro - Estructura de la página', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/registro');
  });

  test('TC-050: Página de registro carga correctamente', async ({ page }) => {
    await expect(page).toHaveURL(/\/registro/);
    await expect(page.locator('.registro-form-title')).toHaveText('Crear Cuenta');
  });

  test('TC-051: Campo Email con id "registro-email" visible', async ({ page }) => {
    const inputEmail = page.locator('#registro-email');
    await expect(inputEmail).toBeVisible();
    await expect(inputEmail).toHaveAttribute('placeholder', 'nombre@tucorreo.com');
  });

  test('TC-052: Campo Cédula con id "registro-cedula" visible', async ({ page }) => {
    const inputCedula = page.locator('#registro-cedula');
    await expect(inputCedula).toBeVisible();
    await expect(inputCedula).toHaveAttribute('placeholder', /números|dígitos/i);
  });

  test('TC-053: Campo Nombre completo con id "registro-nombre" visible', async ({ page }) => {
    await expect(page.locator('#registro-nombre')).toBeVisible();
  });

  test('TC-054: Campo Contraseña con id "registro-contrasena" visible', async ({ page }) => {
    const inputPass = page.locator('#registro-contrasena');
    await expect(inputPass).toBeVisible();
    await expect(inputPass).toHaveAttribute('type', 'password');
  });

  test('TC-055: Hint de contraseña visible ("Al menos 8 caracteres...")', async ({ page }) => {
    const hint = page.locator('.registro-password-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText(/8 caracteres/i);
  });

  test('TC-056: Checkbox de términos y condiciones visible', async ({ page }) => {
    const checkbox = page.locator('.registro-terminos-checkbox');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
  });

  test('TC-057: Botón "Registrar" visible y habilitado', async ({ page }) => {
    const btn = page.locator('.registro-btn-registrar');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveText('Registrar');
  });
});

test.describe('Registro - Validaciones del formulario', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/registro');
  });

  test('TC-058: Error al intentar registrar sin llenar ningún campo', async ({ page }) => {
    // Hacer clic en registrar sin llenar nada
    await page.locator('.registro-btn-registrar').click();
    
    // Tu app muestra errores en el formulario (no SweetAlert primero)
    // Los errores aparecen después de la validación
    const errores = page.locator('.registro-error-message');
    await expect(errores.first()).toBeVisible({ timeout: 3000 });
    
    // Verificar que hay múltiples errores (email, cédula, nombre, contraseña, términos)
    const cantidadErrores = await errores.count();
    expect(cantidadErrores).toBeGreaterThanOrEqual(3);
  });

  test('TC-059: Error de email inválido se muestra bajo el campo', async ({ page }) => {
    // Llenar todos los campos con datos válidos excepto el email
    await page.locator('#registro-email').fill('correo-invalido');
    await page.locator('#registro-cedula').fill('1234567890');
    await page.locator('#registro-nombre').fill('Juan Perez');
    await page.locator('#registro-contrasena').fill('Clave1234!');
    await page.locator('.registro-terminos-checkbox').check();
    
    // Intentar registrar
    await page.locator('.registro-btn-registrar').click();
    
    // Buscar el error específico de email
    const errorEmail = page.locator('.registro-error-message').filter({ hasText: /email|formato/i }).first();
    await expect(errorEmail).toBeVisible({ timeout: 3000 });
  });

  test('TC-060: La cédula solo acepta números (se recortan letras automáticamente)', async ({ page }) => {
    const inputCedula = page.locator('#registro-cedula');
    // El handler handleCedulaChange usa .replace(/\D/g, '') 
    await inputCedula.fill('12abc34');
    await expect(inputCedula).toHaveValue('1234');
  });

  test('TC-061: La cédula acepta máximo 10 dígitos', async ({ page }) => {
    const inputCedula = page.locator('#registro-cedula');
    await inputCedula.fill('12345678901234');
    await expect(inputCedula).toHaveValue('1234567890');
  });

  test('TC-062: Error de contraseña débil se muestra bajo el campo', async ({ page }) => {
    // Llenar todos los campos con datos válidos excepto la contraseña
    await page.locator('#registro-email').fill('test@test.com');
    await page.locator('#registro-cedula').fill('1234567890');
    await page.locator('#registro-nombre').fill('Juan Perez');
    await page.locator('#registro-contrasena').fill('clave123');  // Contraseña débil (sin mayúscula, sin carácter especial)
    await page.locator('.registro-terminos-checkbox').check();
    
    // Intentar registrar
    await page.locator('.registro-btn-registrar').click();
    
    // Buscar error de contraseña
    const errorPass = page.locator('.registro-error-message').filter({ hasText: /contraseña|8 caracteres|mayúscula|minúscula|número|carácter especial/i }).first();
    await expect(errorPass).toBeVisible({ timeout: 3000 });
  });

  test('TC-063: Error si no acepta términos y condiciones', async ({ page }) => {
    // Llenar todos los campos correctamente
    await page.locator('#registro-email').fill('test@test.com');
    await page.locator('#registro-cedula').fill('1234567890');
    await page.locator('#registro-nombre').fill('Juan Perez');
    await page.locator('#registro-contrasena').fill('Clave1234!');
    // NO marcar el checkbox de términos
    
    // Intentar registrar
    await page.locator('.registro-btn-registrar').click();
    
    // Buscar error de términos
    const errorTerminos = page.locator('.registro-error-message').filter({ hasText: /términos|aceptar/i }).first();
    await expect(errorTerminos).toBeVisible({ timeout: 3000 });
  });

  test('TC-064: Click en "términos y condiciones" navega a la página correcta', async ({ page }) => {
    await page.locator('.registro-terminos-link').click();
    await expect(page).toHaveURL(/terminosycondiciones/i);
  });
});