import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 15000,

  // 👇 IMPORTANTE: Configuración GLOBAL
  use: {
    baseURL: 'http://localhost:5173',  // ← Sin barra al final
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // 👇 Para asegurar que el servidor esté corriendo
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,  // Usa el servidor que ya tienes
    timeout: 120000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});