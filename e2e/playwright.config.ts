import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke test e2e di maia-fe.
 *
 * Variabili d'ambiente (tutte opzionali):
 *   E2E_BASE_URL      URL dell'app. Default: http://localhost:4200/ (ng serve con proxy verso klabsrv:19443)
 *                     Esempio installazione di test: https://klabsrv:19443/maia/
 *   E2E_LABEL         etichetta della cartella degli screenshot (es. ng14, ng16...). Default: run
 *   E2E_EXPECT_TITLE  titolo atteso nella card di login (es. "MAIA - VocaBO - DEV UPGRADE")
 *   E2E_ENV_FILE      file con le credenziali. Default: ~/.config/maia/e2e.env
 *                     (MAIA_E2E_USER, MAIA_E2E_PASSWORD) - fuori dal repo, permessi 600
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './artifacts/test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { outputFolder: './artifacts/report', open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4200/',
    ignoreHTTPSErrors: true, // certificato self-signed della VM di test
    viewport: { width: 1600, height: 1000 },
    locale: 'it-IT',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } } }],
});
