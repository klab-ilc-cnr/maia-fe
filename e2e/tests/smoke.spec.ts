import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { annotate, apiLogin, credentials, snap, watchPage } from './support';

/** Versione dell'app nel package.json del repo: il footer deve mostrare la stessa (si sa quale build si sta testando). */
const APP_VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8')).version as string;

/** Workspace dedicato ai test: creato al primo giro e poi riutilizzato. */
const WORKSPACE_NAME = 'e2e-smoke';

/**
 * Pagine principali da aprire dopo il login (hash routing).
 * withRows: la pagina mostra una tabella che sulla VM di test ha dati -> deve avere righe.
 */
const PAGES: Array<{ name: string; hash: string; withRows?: boolean }> = [
  { name: '02-workspaces', hash: '#/workspaces', withRows: true },
  { name: '03-lexicon', hash: '#/lexicon' },
  // pagina segnaposto nell'app (template "languages-list works!"): solo apertura, nessun dato
  { name: '04-lexicon-languages', hash: '#/lexicon/languages' },
  { name: '05-lexicon-namespaces', hash: '#/lexicon/namespaces' },
  { name: '06-tagsets', hash: '#/tagsets', withRows: true },
  { name: '07-layers', hash: '#/layers', withRows: true },
  { name: '08-users', hash: '#/usersManagement/users', withRows: true },
];

test.describe.configure({ mode: 'serial' });

test('smoke: titolo, login, pagine principali, workspace', async ({ page, baseURL }, testInfo) => {
  const w = watchPage(page);

  await test.step('pagina di login e titolo', async () => {
    await page.goto('#/login');
    const card = page.locator('p-card .p-card-title');
    await expect(card).toBeVisible();
    const title = (await card.innerText()).trim();
    testInfo.annotations.push({ type: 'titolo', description: title });
    if (process.env.E2E_EXPECT_TITLE) expect(title).toBe(process.env.E2E_EXPECT_TITLE);
    else expect(title).toMatch(/^MAIA - /);
    await snap(page, '01-login');
  });

  await test.step('login dall\'interfaccia', async () => {
    const { user, password } = credentials();
    await page.locator('input[formcontrolname="username"]').fill(user);
    await page.locator('p-password input').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).not.toHaveURL(/#\/login/, { timeout: 30_000 });
    await w.settle();
    expect(w.pageErrors, 'eccezioni JS durante il login').toEqual([]);
    annotate(testInfo, 'login', w); w.reset();
  });

  await test.step(`versione nel footer (v. ${APP_VERSION})`, async () => {
    await expect(page.locator('app-footer').first()).toContainText(`v. ${APP_VERSION}`);
    testInfo.annotations.push({ type: 'versione', description: APP_VERSION });
  });

  for (const p of PAGES) {
    await test.step(`pagina ${p.hash}`, async () => {
      await page.goto(p.hash);
      await w.settle();
      await expect(page).toHaveURL(new RegExp(p.hash.replace(/[/#]/g, '\\$&')));
      await expect(page.locator('app-root')).not.toBeEmpty();
      if (p.withRows) {
        // riga di intestazione + almeno una riga di dati (ruolo ARIA: indipendente dalle classi PrimeNG)
        await expect.poll(async () => page.getByRole('row').count(), { message: `righe in ${p.hash}` }).toBeGreaterThan(1);
        testInfo.annotations.push({ type: 'righe', description: `${p.hash}: ${(await page.getByRole('row').count()) - 1}` });
      }
      expect(w.pageErrors, `eccezioni JS su ${p.hash}`).toEqual([]);
      annotate(testInfo, p.hash, w); w.reset();
      await snap(page, p.name);
    });
  }

  await test.step(`workspace "${WORKSPACE_NAME}"`, async () => {
    const { api, token, base } = await apiLogin(baseURL!);
    const auth = { Authorization: `Bearer ${token}` };
    const list = await api.get(`${base}/api/workspaces/workspaceChoiceList`, { headers: auth });
    expect(list.status()).toBe(200);
    let ws = ((await list.json()) as Array<{ id: number; name: string }>).find((x) => x.name === WORKSPACE_NAME);
    if (!ws) {
      const created = await api.post(`${base}/api/workspaces`, { headers: auth, data: { name: WORKSPACE_NAME, note: 'Workspace dei test automatici (upgrade Angular). Si puo\' cancellare.' } });
      expect(created.status(), 'creazione workspace di test').toBeLessThan(300);
      ws = await created.json();
      testInfo.annotations.push({ type: 'workspace', description: `creato id=${ws!.id}` });
    } else {
      testInfo.annotations.push({ type: 'workspace', description: `riutilizzato id=${ws.id}` });
    }
    await api.dispose();

    await page.goto(`#/workspace/${ws!.id}`);
    await w.settle();
    await expect(page).toHaveURL(new RegExp(`#/workspace/${ws!.id}`));
    expect(w.pageErrors, 'eccezioni JS aprendo il workspace').toEqual([]);
    const restored = await page.locator('.jsPanel').count();
    testInfo.annotations.push({ type: 'pannelli ripristinati dal DB', description: String(restored) });
    annotate(testInfo, 'workspace', w); w.reset();
    await snap(page, '09-workspace');
  });

  // Pannelli jsPanel con componenti Angular dentro (integrazione delicata per l'upgrade).
  // Se il pannello esiste gia' (layout ripristinato dal DB), il menu lo porta in primo piano.
  for (const tile of [
    { menu: 'Corpus', id: 'corpusExplorerTile', shot: '10-tile-corpus' },
    { menu: 'Lexicon', id: 'lexiconTile', shot: '11-tile-lexicon' },
  ]) {
    await test.step(`pannello ${tile.menu}`, async () => {
      await page.locator('#workspace-menu').getByText(tile.menu, { exact: true }).click();
      await w.settle();
      const panel = page.locator(`#${tile.id}`);
      await expect(panel, `pannello ${tile.id}`).toBeVisible();
      await expect(panel.locator('.jsPanel-content'), `contenuto Angular in ${tile.id}`).not.toBeEmpty();
      expect(w.pageErrors, `eccezioni JS nel pannello ${tile.menu}`).toEqual([]);
      annotate(testInfo, `pannello ${tile.menu}`, w); w.reset();
      await snap(page, tile.shot);
    });
  }

  // Il layout si salva uscendo dal workspace (canDeactivate -> PUT /api/workspaces/layout)
  // e si ripristina rientrando (jsPanel.layout.restoreId sui tileConfig salvati nel DB).
  await test.step('salvataggio e ripristino del layout', async () => {
    const wsUrl = page.url();
    const saved = page.waitForResponse((r) => /\/api\/workspaces\/layout$/.test(r.url()) && r.request().method() === 'PUT', { timeout: 30_000 });
    await page.goto('#/workspaces');
    const res = await saved;
    expect(res.status(), 'salvataggio layout').toBeLessThan(300);
    await w.settle();

    await page.goto(wsUrl);
    await w.settle();
    for (const id of ['corpusExplorerTile', 'lexiconTile']) {
      await expect(page.locator(`#${id}`), `pannello ${id} ripristinato`).toBeVisible();
      await expect(page.locator(`#${id} .jsPanel-content`)).not.toBeEmpty();
    }
    expect(w.pageErrors, 'eccezioni JS nel ripristino').toEqual([]);
    annotate(testInfo, 'ripristino layout', w); w.reset();
    await snap(page, '12-layout-ripristinato');
  });

  // AutoComplete: da PrimeNG 16 onSelect emette { originalEvent, value } invece dell'elemento.
  // Il dialogo "Upload CoNLL" del Lexicon: scegliendo un Prefix, onSelectPrefixBaseIRI compila il Base IRI.
  // Se l'handler ricevesse l'evento sbagliato, il Base IRI resterebbe vuoto. Nessun dato viene scritto.
  await test.step('autocomplete: scelta di un prefisso compila il Base IRI', async () => {
    const { api, token, base } = await apiLogin(baseURL!);
    const res = await api.get(`${base}/lexo/repository/namespaces`, { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status(), 'namespaces da LexO').toBe(200);
    const namespaces = (await res.json()) as Array<{ prefix: string; base: string }>;
    await api.dispose();
    const ns = namespaces.find((n) => n.prefix && n.base && n.prefix.length >= 2);
    expect(ns, 'almeno un namespace sulla VM').toBeTruthy();
    testInfo.annotations.push({ type: 'namespace', description: `${ns!.prefix} -> ${ns!.base}` });

    await page.locator('#lexiconTile button:has(i.pi-file-import)').click();
    const prefix = page.locator('p-autoComplete[name="prefix"] input');
    const baseIri = page.locator('p-autoComplete[name="baseIRI"] input');
    await expect(prefix).toBeVisible();
    await expect(baseIri).toHaveValue('');
    await prefix.pressSequentially(ns!.prefix.slice(0, 2), { delay: 80 });
    await page.getByRole('option', { name: ns!.prefix, exact: true }).first().click();
    await expect(baseIri, 'Base IRI compilato da onSelect').toHaveValue(ns!.base);
    await snap(page, '13-autocomplete-prefix');
    await page.locator('p-dialog .btn-secondary').filter({ visible: true }).first().click();
    expect(w.pageErrors, 'eccezioni JS nel dialogo di upload').toEqual([]);
    annotate(testInfo, 'autocomplete', w); w.reset();
  });
});
