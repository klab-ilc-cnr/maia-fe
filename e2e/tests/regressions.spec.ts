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

test('regressione: maschera di input del Search (altezze, distanze, larghezza di Pos)', async ({ page, baseURL }, testInfo) => {
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const tile = page.locator('#searchTile');
  await expect(tile).toBeVisible();
  await page.waitForTimeout(1500);
  const label = (await tile.locator('p-treeselect').first().innerText()).trim().replace(/\s+/g, ' ');
  testInfo.annotations.push({ type: 'testo', description: label });

  // "Cerca" senza valore: compare l'errore del campo obbligatorio sotto il campo di ricerca
  await tile.locator('button.p-button-success').first().click();
  await expect(tile.locator('.search-error-icon')).toBeVisible();
  expect(await tile.locator('small.p-error').count(), 'nessun messaggio sotto il campo (sposterebbe il layout)').toBe(0);
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const r = (el: Element | null) => { const b = el!.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, height: b.height, width: b.width }; };
    const t = document.querySelector('#searchTile');
    return {
      tree: r(t!.querySelector('p-treeselect')), mode: r(t!.querySelector('p-selectbutton')),
      input: r(t!.querySelector('p-iconfield input')), pos: r(t!.querySelector('p-multiselect')),
      layer: r(t!.querySelector('p-select, p-dropdown')),
    };
  });
  testInfo.annotations.push({ type: 'search-form', description: JSON.stringify(m) });
  // Difetto visto (PrimeNG 18+): i campi della riga si allungavano all'altezza del messaggio d'errore.
  for (const k of ['tree', 'mode', 'pos'] as const) expect(m[k].height, `altezza di ${k} con l'errore visibile`).toBeLessThan(45);
  expect(Math.abs(m.tree.top - m.input.top), 'campi allineati in alto').toBeLessThan(3);
  expect(m.input.left - m.mode.right, 'distanza tra il selettore forma/lemma e il campo di ricerca').toBeGreaterThanOrEqual(6);
  expect(m.pos.width, 'Pos non piu\' largo degli altri select').toBeLessThanOrEqual(m.layer.width + 2);
  await snap(page, 'r6-search-form');

  // Larghezza minima del pannello (830px, come da configurazione) e oltre: i campi si restringono insieme
  // al campo di ricerca, "lunghezza contesto: N" non tocca il bordo destro.
  const widths = async (w: number) => {
    await page.evaluate((px) => { (document.querySelector('#searchTile')!.closest('.jsPanel') as HTMLElement).style.width = px + 'px'; }, w);
    await page.waitForTimeout(500);
    return page.evaluate(() => {
      const t = document.querySelector('#searchTile')!;
      const w = (e: Element | null) => e!.getBoundingClientRect().width;
      const panel = t.closest('.jsPanel')!.getBoundingClientRect();
      return { tree: w(t.querySelector('p-treeselect')), pos: w(t.querySelector('p-multiselect')), input: w(t.querySelector('p-iconfield input')),
        sliderGap: panel.right - t.querySelector('.slider-input label')!.getBoundingClientRect().right };
    });
  };
  const min = await widths(830);
  const narrow = await widths(700);
  testInfo.annotations.push({ type: 'larghezze', description: JSON.stringify({ min, narrow }) });
  expect(min.input, 'campo di ricerca leggibile alla larghezza minima').toBeGreaterThan(110);
  expect(min.sliderGap, 'spazio a destra di "lunghezza contesto"').toBeGreaterThan(8);
  expect(narrow.tree, 'il selettore dei testi si restringe').toBeLessThan(min.tree);
  expect(narrow.pos, 'Pos si restringe').toBeLessThan(min.pos);
  expect(narrow.tree, 'il selettore dei testi non scende sotto il minimo').toBeGreaterThanOrEqual(109);
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Search - errore del campo vuoto e avvisi del pulsante Annota', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const tile = page.locator('#searchTile');
  await expect(tile).toBeVisible();
  await page.waitForTimeout(1500);
  const input = tile.locator('p-iconfield input[pinputtext]').first();
  const icon = tile.locator('.search-error-icon');
  const border = () => input.evaluate((e) => getComputedStyle(e).borderTopColor);
  const normal = await border();
  const top = () => tile.locator('p-divider').first().evaluate((e) => e.getBoundingClientRect().top);
  const top0 = await top();

  // 1) nessun errore finche' non si preme "Cerca": ne' scrivendo e cancellando, ne' uscendo dal campo
  await input.fill('a'); await input.fill(''); await input.blur(); await page.waitForTimeout(300);
  await expect(icon).toHaveCount(0);
  expect(await border(), 'cornice normale senza "Cerca"').toBe(normal);

  // 2) "Cerca" con il campo vuoto: cornice rossa + icona, il layout non si sposta, il campo ha il focus
  await tile.locator('button.p-button-success').first().click(); await page.waitForTimeout(400);
  await expect(icon).toBeVisible();
  expect(await border(), 'cornice rossa').not.toBe(normal);
  expect(Math.abs((await top()) - top0), 'il layout non si sposta').toBeLessThan(2);
  await expect(input).toBeFocused();
  await snap(page, 'r7-search-empty-error');

  // 3) scrivendo l'errore sparisce; cancellando non ricompare
  await input.pressSequentially('am'); await expect(icon).toHaveCount(0);
  await input.fill(''); await page.waitForTimeout(300);
  await expect(icon).toHaveCount(0);

  // 4) avvisi del pulsante "Annota", dal primo requisito mancante
  const annotate = tile.locator('p-splitbutton').first().locator('xpath=ancestor::span[1]');
  const hint = async () => { await annotate.hover(); await page.waitForTimeout(500); return (await page.locator('.p-tooltip').filter({ visible: true }).last().innerText().catch(() => '')).trim(); };
  const h1 = await hint(); testInfo.annotations.push({ type: 'avviso-1', description: h1 });
  expect(h1, 'senza risultati').toMatch(/ricerca/i);
  await input.fill('amore'); await input.press('Enter');
  await expect(tile.locator('tbody tr').nth(1)).toBeVisible({ timeout: 30_000 });
  await page.mouse.move(0, 0); await page.waitForTimeout(300);
  const h2 = await hint(); testInfo.annotations.push({ type: 'avviso-2', description: h2 });
  expect(h2, 'risultati ma ricerca senza layer').toMatch(/layer/i);
  await expect(tile.getByText(/layer/i).filter({ has: page.locator('.pi-info-circle') })).toBeVisible();
  await snap(page, 'r7-search-annotate-hint');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Text - filtro Visibility (chip non tagliato, checkbox solo "deseleziona tutto")', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Corpus', { exact: true }).click();
  await page.locator('#corpusExplorerTile .p-treenode-label, #corpusExplorerTile .p-tree-node-label').filter({ hasText: 'Decameron' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  const ms = tile.locator('p-multiselect').first();
  await expect(ms).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  const header = () => page.locator('.p-multiselect-overlay .p-multiselect-header .p-checkbox').first();
  const chips = () => ms.locator('.layer-item-value');

  // centratura verticale (box ad altezza fissa): segnaposto prima, chip del layer poi
  const offCenter = (sel: string) => ms.evaluate((e, q) => {
    const box = e.getBoundingClientRect(); const el = e.querySelector(q)!;
    const r = document.createRange(); r.selectNodeContents(el); const b = q.includes('layer-item') ? el.getBoundingClientRect() : r.getBoundingClientRect();
    return Math.abs((b.top + b.height / 2) - (box.top + box.height / 2));
  }, sel);
  expect(await offCenter('.p-multiselect-label'), 'segnaposto centrato in verticale').toBeLessThan(1.5);

  // checkbox dell'intestazione senza layer scelti: "seleziona tutti" non ha effetto (troppe richieste al backend)
  await ms.click();
  await expect(header()).toBeVisible();
  await header().click({ force: true }); await page.waitForTimeout(800);
  await expect(chips(), 'seleziona tutti inibito').toHaveCount(0);

  // un layer scelto: il chip non e' tagliato in basso (altezza fissa del campo)
  await page.locator('.p-multiselect-option').first().click(); await page.waitForTimeout(1000);
  await expect(chips()).toHaveCount(1);
  const over = await ms.evaluate((e) => e.querySelector('.layer-item-value')!.getBoundingClientRect().bottom - (e.getBoundingClientRect().bottom - 1));
  expect(over, 'chip del layer tagliato in basso').toBeLessThanOrEqual(0.5);
  expect(await offCenter('.layer-item-value'), 'chip del layer centrato in verticale').toBeLessThan(1.5);
  await snap(page, 'r8-text-visibility');

  // la checkbox ora deseleziona tutto
  await expect(header()).toHaveClass(/p-checkbox-checked/);
  await header().click(); await page.waitForTimeout(800);
  await expect(chips(), 'deseleziona tutto').toHaveCount(0);
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Text - evidenziazione del testo selezionato (colori e contrasto)', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Corpus', { exact: true }).click();
  await page.locator('#corpusExplorerTile .p-treenode-label, #corpusExplorerTile .p-tree-node-label').filter({ hasText: 'Decameron' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile.locator('#gText tspan tspan').nth(12)).toBeVisible({ timeout: 30_000 });
  // la selezione si evidenzia solo con un layer scelto
  await tile.locator('p-select').first().click();
  await page.locator('.p-select-option').first().click();
  await page.waitForTimeout(800);
  const word = tile.locator('#gText tspan tspan').nth(12);
  const b = (await word.boundingBox())!;
  await page.mouse.dblclick(b.x + b.width / 2, b.y + b.height / 2);
  const rect = page.locator('#selectionHighlightg rect').first();
  await expect(rect).toBeVisible();
  const a = await rect.evaluate((e) => ({ fill: e.getAttribute('fill'), stroke: e.getAttribute('stroke'), so: e.getAttribute('stroke-opacity'), fo: Number(e.getAttribute('fill-opacity')) }));
  // riempimento azzurro chiaro, bordo blu scuro pieno (contrasto del bordo >= 3:1, WCAG 1.4.11)
  expect(a.fill?.toLowerCase()).toBe('#9ccbff');
  expect(a.stroke?.toLowerCase()).toBe('#0050a8');
  expect(a.so, 'bordo pieno').toBeNull();
  expect(a.fo).toBeGreaterThan(0.5);
  // stessa geometria della cornice delle annotazioni: padding di 1px per lato e stessa altezza
  // (prima la selezione col mouse usava il box dei glifi: piu' stretta e alta di 1px)
  const g = await page.evaluate(() => {
    const r = document.querySelector('[id^="textTile_"] #selectionHighlightg rect')!.getBoundingClientRect();
    const ann = document.querySelector('[id^="textTile_"] g.highlight rect');
    let word: DOMRect | null = null; let best = 1e9;
    for (const e of Array.from(document.querySelectorAll('[id^="textTile_"] #gText tspan tspan'))) {
      const b = e.getBoundingClientRect(); const c = (r.left + r.right) / 2;
      if (b.width && b.left <= c && b.right >= c && Math.abs(b.top - r.top) < best) { best = Math.abs(b.top - r.top); word = b; }
    }
    return { h: r.height, annH: ann ? ann.getBoundingClientRect().height : null, left: word ? word.left - r.left : null };
  });
  if (g.annH) expect(g.h, 'stessa altezza della cornice delle annotazioni').toBeCloseTo(g.annH, 0);
  expect(g.left, 'padding a sinistra (1px)').toBeGreaterThan(0.5);
  await snap(page, 'r9-text-selection');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Text - cornice della parola aperta dai risultati del Search (padding simmetrico)', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const t = page.locator('#searchTile');
  const input = t.locator('p-iconfield input[pinputtext]').first();
  await input.fill('casa'); await input.press('Enter');
  await expect(t.locator('tbody tr').nth(1)).toBeVisible({ timeout: 30_000 });
  const kwic = (await t.locator('tbody tr').nth(1).locator('td').nth(5).innerText()).trim();
  await t.locator('tbody tr').nth(1).dblclick();
  const rect = page.locator('[id^="textTile_"] #selectionHighlightg rect').first();
  await expect(rect).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  // margini tra la cornice e la parola (solo le lettere della parola, senza lo spazio che segue)
  const m = await page.evaluate((kw) => {
    const r = document.querySelector('[id^="textTile_"] #selectionHighlightg rect')!.getBoundingClientRect();
    let best: DOMRect | null = null;
    for (const el of Array.from(document.querySelectorAll('[id^="textTile_"] #gText tspan tspan'))) {
      if ((el.textContent || '').trim().toLowerCase() !== kw.toLowerCase() || !el.firstChild) continue;
      const rg = document.createRange(); rg.setStart(el.firstChild, 0); rg.setEnd(el.firstChild, kw.length);
      const b = rg.getBoundingClientRect();
      if (!best || Math.abs(b.top - r.top) < Math.abs(best.top - r.top)) best = b;
    }
    return best ? { left: best.left - r.left, right: r.right - best.right } : null;
  }, kwic);
  testInfo.annotations.push({ type: 'margini', description: JSON.stringify(m) });
  expect(m, 'parola trovata sotto la cornice').not.toBeNull();
  // Difetto visto: la cornice finiva stretta sul lato destro (larghezza senza il +2 delle annotazioni)
  expect(Math.abs(m!.left - m!.right), 'cornice simmetrica a sinistra e a destra').toBeLessThan(1);
  expect(m!.right, 'padding a destra').toBeGreaterThan(0.5);
  await snap(page, 'r10-kwic-selection');
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
