import { APIRequestContext, expect, Page, TestInfo, request } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/** Credenziali lette da un file locale fuori dal repository (mai stampate). */
export function credentials(): { user: string; password: string } {
  const file = process.env.E2E_ENV_FILE || path.join(os.homedir(), '.config', 'maia', 'e2e.env');
  const env: Record<string, string> = {};
  for (const raw of fs.readFileSync(file, 'utf-8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  if (!env.MAIA_E2E_USER || !env.MAIA_E2E_PASSWORD || env.MAIA_E2E_PASSWORD === '__DA_INSERIRE__') {
    throw new Error(`Credenziali mancanti in ${file}`);
  }
  return { user: env.MAIA_E2E_USER, password: env.MAIA_E2E_PASSWORD };
}

/**
 * Base degli endpoint del back-end vista dal browser, con la stessa regola dell'app:
 *  - ng serve (localhost:42xx, es. 4200 sviluppo / 4201 riferimento Angular 14): proxy locale -> origin
 *  - installazione pubblicata:  <cartella UI>/maia  (es. https://klabsrv:19443/maia/maia)
 */
export function backendBase(baseURL: string): string {
  const u = new URL(baseURL);
  if (/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && /^42\d\d$/.test(u.port)) return u.origin;
  return `${u.origin}${u.pathname.replace(/\/+$/, '')}/maia`;
}

export async function apiLogin(baseURL: string): Promise<{ api: APIRequestContext; token: string; base: string }> {
  const base = backendBase(baseURL);
  const { user, password } = credentials();
  const api = await request.newContext({ ignoreHTTPSErrors: true });
  const res = await api.post(`${base}/api/authentication/authenticate`, { data: { username: user, password } });
  expect(res.status(), 'login via API').toBe(200);
  return { api, token: (await res.text()).trim(), base };
}

/** Registra errori della pagina: le eccezioni non gestite fanno fallire il test, il resto viene solo annotato. */
export function watchPage(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const httpErrors: string[] = [];
  let inflight = 0; // richieste al back-end ancora aperte
  const isBackend = (url: string) => /\/(api|lexo|texto)\//.test(url);
  page.on('request', (r) => { if (isBackend(r.url())) inflight++; });
  page.on('requestfinished', (r) => { if (isBackend(r.url())) inflight = Math.max(0, inflight - 1); });
  page.on('requestfailed', (r) => { if (isBackend(r.url())) inflight = Math.max(0, inflight - 1); });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
  page.on('response', (r) => {
    const url = r.url();
    if (r.status() >= 400 && /\/(api|lexo|texto)\//.test(url)) httpErrors.push(`${r.status()} ${r.request().method()} ${url.replace(/^https?:\/\/[^/]+/, '')}`);
  });
  return {
    pageErrors, consoleErrors, httpErrors,
    reset() { pageErrors.length = 0; consoleErrors.length = 0; httpErrors.length = 0; },
    /**
     * Aspetta che la pagina sia "ferma": nessuna chiamata al back-end aperta per 1 s
     * e loader dell'app (div.bg-loader) non visibile. Con l'hash routing networkidle non basta.
     */
    async settle(timeoutMs = 30_000) {
      const start = Date.now();
      let quietSince = 0;
      while (Date.now() - start < timeoutMs) {
        const loading = await page.locator('.bg-loader').count();
        if (inflight === 0 && loading === 0) {
          if (!quietSince) quietSince = Date.now();
          if (Date.now() - quietSince >= 1000) return;
        } else quietSince = 0;
        await page.waitForTimeout(100);
      }
      throw new Error(`pagina non stabile dopo ${timeoutMs} ms (richieste aperte: ${inflight})`);
    },
  };
}

export function annotate(testInfo: TestInfo, step: string, w: ReturnType<typeof watchPage>) {
  for (const e of w.consoleErrors) testInfo.annotations.push({ type: `console-error (${step})`, description: e });
  for (const e of w.httpErrors) testInfo.annotations.push({ type: `http-error (${step})`, description: e });
}

/** Login dall'interfaccia (pagina #/login). */
export async function uiLogin(page: Page) {
  const { user, password } = credentials();
  await page.goto('#/login');
  await page.locator('input[formcontrolname="username"]').fill(user);
  await page.locator('p-password input').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/#\/login/, { timeout: 30_000 });
}

/** Parte dell'URL dopo il '#', es. "/tagsets/5". */
export function hashPath(page: Page): string {
  return new URL(page.url()).hash.replace(/^#/, '');
}

/** Screenshot in artifacts/screens/<E2E_LABEL>/ per i confronti prima/dopo. */
export async function snap(page: Page, name: string) {
  const dir = path.join(__dirname, '..', 'artifacts', 'screens', process.env.E2E_LABEL || 'run');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

/**
 * Impedisce ai test di SCRIVERE sul back-end: le richieste di modifica vengono intercettate e rispondono 200 senza
 * arrivare al server. Da usare in ogni test che digita o modifica campi.
 *
 * Perche': molti editor dell'app salvano da soli (scheda della voce del dizionario, definizione dei sensi...: valueChanges
 * + debounce, senza pulsante) e la VM di test ha dati veri. Un test che digitava in un campo ha gia' modificato la voce
 * "abbaiare" e la definizione di un suo senso.
 * Bloccate: /lexo/(update|create|delete)/..., /texto/ con metodi di scrittura (annotation/create, ...), /api/ con PUT / PATCH / DELETE.
 * Non bloccate: il login e le POST di sola lettura (/lexo/data/..., /texto/util/... = ricerche e letture).
 */
export async function blockWrites(page: Page, testInfo?: TestInfo): Promise<string[]> {
  const blocked: string[] = [];
  await page.route((url) => /\/(lexo|texto|api)\//.test(url.pathname), async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const method = req.method();
    const write =
      (/\/lexo\/(update|create|delete)\//.test(path)) ||
      (/\/texto\//.test(path) && method !== 'GET' && !/\/texto\/util\//.test(path)) || // /texto/util/*: ricerche e letture (kwic, ais, annotations...)
      (/\/api\//.test(path) && ['PUT', 'PATCH', 'DELETE'].includes(method));
    if (!write) { await route.fallback(); return; }
    blocked.push(`${method} ${path}`);
    testInfo?.annotations.push({ type: 'scrittura-bloccata', description: `${method} ${path}` });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  return blocked;
}
