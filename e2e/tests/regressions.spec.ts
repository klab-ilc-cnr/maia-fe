import { expect, Page, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { apiLogin, snap, uiLogin, watchPage } from './support';

/**
 * Regressioni segnalate durante il test manuale del checkpoint Angular 16 (2026-11-04).
 * Ognuna e' stata confrontata con un'istanza Angular 14 di riferimento.
 * Solo letture: la ricerca e' una query, nessun dato viene scritto.
 */

/** Apre il workspace "e2e-smoke" (id ricavato via API: la lista dell'interfaccia e' paginata). */
async function openSmokeWorkspace(page: Page, baseURL: string) {
  const { api, token, base } = await apiLogin(baseURL);
  const res = await api.get(`${base}/api/workspaces/workspaceChoiceList`, { headers: { Authorization: `Bearer ${token}` } });
  const ws = ((await res.json()) as Array<{ id: number; name: string }>).find((x) => x.name === 'e2e-smoke');
  await api.dispose();
  expect(ws, 'workspace e2e-smoke (lo crea lo smoke test)').toBeTruthy();
  await uiLogin(page);
  await page.goto(`#/workspace/${ws!.id}`);
  await expect(page.locator('#workspace-menu').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(3000);
}

/** Versione di PrimeNG installata nell'app (per i difetti noti legati alla versione). */
function primengVersion(): string {
  const p = path.join(__dirname, '..', '..', 'node_modules', 'primeng', 'package.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8')).version;
}

test('regressione: colori dei tab nel lexicon editor', async ({ page, baseURL }, testInfo) => {
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  await expect(page.locator('#lexiconTile')).toBeVisible();
  await page.locator('#lexiconTile tr', { hasText: '@' }).first().dblclick();
  // selettori ARIA: validi sia con TabView di PrimeNG <= 17 (li > a) sia con Tabs di PrimeNG 18+ (button.p-tab)
  const nav = page.locator('[role="tablist"]').first();
  await expect(nav).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);

  const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim());
  const tabs = await page.evaluate(() => [...document.querySelector('[role="tablist"]')!.querySelectorAll('[role="tab"]')]
    .map((t) => ({ text: (t as HTMLElement).innerText.trim(), selected: t.getAttribute('aria-selected') === 'true',
      disabled: t.getAttribute('aria-disabled') === 'true' || t.classList.contains('p-disabled') || (t.closest('li')?.classList.contains('p-disabled') ?? false),
      color: getComputedStyle(t).color })));
  testInfo.annotations.push({ type: 'tab', description: JSON.stringify(tabs.map((t) => `${t.text}:${t.color}`)) });

  // Difetto visto: la regola globale `a { color: var(--primary-color) }` colorava tutti i tab del rosso dell'app.
  const red = await page.evaluate((c) => { const d = document.createElement('div'); d.style.color = c; document.body.appendChild(d); const v = getComputedStyle(d).color; d.remove(); return v; }, primary);
  for (const t of tabs) expect(t.color, `tab "${t.text}" non deve avere il colore primario dell'app`).not.toBe(red);
  const active = tabs.find((t) => t.selected);
  const inactive = tabs.find((t) => !t.selected && !t.disabled);
  expect(active, 'un tab attivo').toBeTruthy();
  if (inactive) expect(active!.color, 'tab attivo e tab normale devono avere colori diversi').not.toBe(inactive.color);
  await nav.screenshot({ path: path.join(__dirname, '..', 'artifacts', 'screens', process.env.E2E_LABEL || 'run', 'r1-lexicon-tabs.png') });
  expect(w.pageErrors).toEqual([]);
});

test('regressione: tabella dei risultati del Search (colonne e KWIC)', async ({ page, baseURL }, testInfo) => {
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  await expect(page.locator('#searchTile')).toBeVisible();
  // selettori indipendenti dalla lingua (il test gira in it-IT): input con l'icona di ricerca, Invio = onSearch()
  const query = page.locator('#searchTile .pi-search ~ input[pinputtext], #searchTile p-iconfield input[pinputtext]').first();
  await query.fill('amore');
  await query.press('Enter');
  await expect(page.locator('#searchTile tbody tr').nth(1)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);

  const m = await page.evaluate(() => {
    const table = document.querySelector('#searchTile table') as HTMLElement;
    const ths = [...document.querySelectorAll('#searchTile thead tr:first-child th')].map((th) => th.getBoundingClientRect().width);
    const row = document.querySelector('#searchTile tbody tr')!;
    const tds = [...row.querySelectorAll('td')];
    // geometria del testo (indipendente da come e' ottenuto l'allineamento: flex in PrimeNG 14, text-align in 16)
    const textRect = (el: Element) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
    const cell = (td: Element) => { const r = td.getBoundingClientRect(); const cs = getComputedStyle(td); return { left: r.left + parseFloat(cs.paddingLeft), right: r.right - parseFloat(cs.paddingRight) }; };
    const left = textRect(tds[4].querySelector('.leftContext span') || tds[4]); const lc = cell(tds[4]);
    const kw = textRect(tds[5].querySelector('b') || tds[5]); const kc = cell(tds[5]);
    return { tableW: table.getBoundingClientRect().width, ths,
      leftGapRight: Math.round(lc.right - left.right), leftGapLeft: Math.round(left.left - lc.left),
      kwicOffCenter: Math.round(Math.abs((kw.left + kw.right) / 2 - (kc.left + kc.right) / 2)) };
  });
  testInfo.annotations.push({ type: 'search', description: JSON.stringify(m) });
  // Difetto visto: la colonna della checkbox occupava quasi tutta la tabella (riga vuota con width:100% senza colspan).
  expect(m.ths[0] / m.tableW, 'colonna checkbox stretta (< 10% della tabella)').toBeLessThan(0.1);
  // Difetto visto: con le celle native (PrimeNG 16) le classi flex non allineavano piu' la concordanza.
  expect(m.leftGapRight, 'contesto sinistro attaccato al bordo destro della cella (concordanza KWIC)').toBeLessThanOrEqual(4);
  expect(m.leftGapLeft, 'contesto sinistro non allineato a sinistra').toBeGreaterThan(m.leftGapRight);
  expect(m.kwicOffCenter, 'KWIC centrato nella cella').toBeLessThanOrEqual(4);
  await snap(page, 'r2-search-results');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: export PDF della scheda di anteprima del dizionario (pdfmake)', async ({ page, baseURL }, testInfo) => {
  // pdfmake 0.3 con il builder esbuild: i font si registrano con addVirtualFileSystem (gli import ES sono in sola lettura).
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  await w.settle();
  const row = page.locator('#dictionaryTile tbody tr').filter({ hasText: /\w/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  await w.settle();
  // pannello "Dictionary Editor - <voce>" (jsPanel) con i tab Entry / Sorting / Preview
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  const tabs = editor.locator('[role="tab"]');
  await expect(tabs.nth(2)).toBeVisible({ timeout: 30_000 });
  await tabs.nth(2).click(); // terzo tab: anteprima
  await w.settle();
  const exportBtn = editor.locator('button[aria-label="Export PDF"]').first();
  await expect(exportBtn).toBeVisible({ timeout: 30_000 });
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30_000 }), exportBtn.click()]);
  const file = await download.path();
  const head = fs.readFileSync(file).subarray(0, 5).toString();
  const size = fs.statSync(file).size;
  testInfo.annotations.push({ type: 'pdf', description: `${download.suggestedFilename()} ${size} byte` });
  expect(head, 'file PDF valido').toBe('%PDF-');
  expect(size, 'PDF con contenuto e font').toBeGreaterThan(10_000);
  expect(w.pageErrors).toEqual([]);
});

test('regressione: etichette dell\'albero delle sezioni nel pannello Text', async ({ page, baseURL }, testInfo) => {
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Corpus', { exact: true }).click();
  await expect(page.locator('#corpusExplorerTile')).toBeVisible();
  // .p-treenode-label fino a PrimeNG 17, .p-tree-node-label da PrimeNG 18
  await page.locator('#corpusExplorerTile .p-treenode-label, #corpusExplorerTile .p-tree-node-label').filter({ hasText: 'Decameron' }).first().dblclick();
  const first = page.locator('#sectionsTree .p-treenode-label, #sectionsTree .p-tree-node-label').first();
  await expect(first).toBeVisible({ timeout: 30_000 });
  const label = (await first.innerText()).trim();
  testInfo.annotations.push({ type: 'label', description: label });

  // Difetto di PrimeNG 16.8.0-16.9.x: il template predefinito stampa il numero dei figli dopo l'etichetta.
  // Nessuna versione 16 MIT ha sia questa correzione sia quella del ContextMenu: corretto da PrimeNG 17.
  const v = primengVersion();
  const knownBug = /^16\.(8|9)\./.test(v);
  if (knownBug && /\s\d+$/.test(label)) {
    testInfo.annotations.push({ type: 'difetto noto', description: `PrimeNG ${v}: numero dei figli nell'etichetta ("${label}")` });
  } else {
    expect(label, 'etichetta senza il numero dei figli').toBe('Decameron');
  }
  // Difetto visto (PrimeNG 20+): MultiSelect non ha piu' `defaultLabel`; senza `placeholder` l'etichetta vuota
  // del filtro "Visibility" dei layer era nascosta (classe p-multiselect-label-empty).
  const vis = page.locator('app-workspace-text-window .p-multiselect-label').first();
  await expect(vis, 'etichetta del filtro Visibility').toBeVisible();
  testInfo.annotations.push({ type: 'visibility', description: (await vis.innerText()).trim() });
  expect((await vis.innerText()).trim(), 'testo del filtro Visibility').not.toBe('');
  expect(await vis.innerText()).not.toContain('empty');
  await snap(page, 'r3-text-tree');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: marche del senso (etichette dei chip degli autocomplete)', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  const tile = page.locator('#lexiconTile');
  await expect(tile).toBeVisible();
  await tile.locator('#searchInput').fill('sonare'); await page.waitForTimeout(2500);
  await tile.locator('tr', { hasText: 'sonare@it' }).first().dblclick();
  const ed = page.locator('.jsPanel').filter({ has: page.locator('app-workspace-lexicon-edit-tile') }).last();
  await expect(ed).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);

  // Difetto visto (PrimeNG 20+): AutoComplete non ha piu' l'input `field`; l'attributo statico field="defaultLabel"
  // restava un attributo HTML e i chip mostravano "[object Object]". Ora optionLabel.
  const row = ed.locator('tr', { hasText: /^\s*sense \(\d+\)/ }).first();
  const n = Number(((await row.innerText()).match(/sense \((\d+)\)/) || [])[1] || 0);
  await row.locator('button').first().click(); await page.waitForTimeout(1000);
  const chips: string[] = [];
  for (let i = 1; i <= n; i++) {
    await row.locator(`xpath=following-sibling::tr[${i}]`).click(); await w.settle(); await page.waitForTimeout(1500);
    const core = ed.locator('app-sense-core-editor').last();
    for (const id of ['marksOfUse', 'grammaticalMarks', 'semanticMarks']) {
      const txt = (await core.locator(`p-autocomplete:has(#${id}), p-autoComplete:has(#${id})`).first().innerText()).trim();
      if (txt) chips.push(`${i}.${id}: ${txt.replace(/\s+/g, ' ')}`);
    }
  }
  testInfo.annotations.push({ type: 'marche', description: chips.join(' | ') });
  expect(chips.length, 'almeno un senso di sonare@it con marche (dati della VM di test)').toBeGreaterThan(0);
  for (const c of chips) expect(c, 'etichetta del chip').not.toContain('[object Object]');
  await snap(page, 'r5-sense-marks');
  expect(w.pageErrors).toEqual([]);
});
