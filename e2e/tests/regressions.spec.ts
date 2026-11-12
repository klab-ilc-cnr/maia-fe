import { expect, Page, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { apiLogin, blockWrites, hashPath, snap, uiLogin, watchPage } from './support';

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

test('regressione: Lexicon Editor - albero a sinistra senza barra orizzontale, icone ancorate a destra', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  await expect(page.locator('#lexiconTile')).toBeVisible();
  await page.locator('#lexiconTile tr', { hasText: '@' }).nth(1).dblclick();
  const ed = page.locator('.jsPanel').filter({ has: page.locator('app-workspace-lexicon-edit-tile') }).last();
  await expect(ed.locator('p-treetable tbody tr').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  const measure = async (width: number) => {
    await ed.evaluate((e, px) => { (e as HTMLElement).style.width = px + 'px'; }, width);
    await page.waitForTimeout(600);
    return ed.evaluate((e) => {
      const tree = e.querySelector('p-treetable')!;
      const body = tree.querySelector('.p-treetable-scrollable-body') as HTMLElement;
      const tds = [...tree.querySelectorAll('tbody tr:first-child td')].map((td) => td.getBoundingClientRect().width);
      const add = tree.querySelector('button.add-node-button')?.getBoundingClientRect();
      return { panel: tree.getBoundingClientRect().width, overflowX: body.scrollWidth - body.clientWidth, name: tds[0], icons: tds.slice(1).map(Math.round), add: add ? Math.round(add.width * 10) / 10 : null };
    });
  };
  // larghezza minima del pannello (600px: la colonna sinistra scendeva a ~236px e compariva la barra) e piu' largo
  const narrow = await measure(600);
  const wide = await measure(1300);
  testInfo.annotations.push({ type: 'albero', description: JSON.stringify({ narrow, wide }) });
  // Difetto visto (PrimeNG 20+): la classe dei pannelli dello splitter e' cambiata e la larghezza minima di 265px andava persa
  expect(narrow.panel, 'colonna sinistra: larghezza minima').toBeGreaterThanOrEqual(264);
  expect(narrow.overflowX, 'nessuna barra orizzontale nell\'albero').toBeLessThanOrEqual(0);
  expect(wide.overflowX).toBeLessThanOrEqual(0);
  // colonne delle icone a larghezza fissa: non si allargano con il pannello (le icone restano vicine, a destra)
  expect(wide.icons, 'colonne delle icone invariate allargando il pannello').toEqual(narrow.icons);
  // la colonna delle note non c'e' piu' (l'icona sta accanto al nome): restano autore/"+" e stato, e il nome ha piu' spazio
  expect(narrow.icons.length, 'solo le colonne autore e stato').toBe(2);
  // i "+" di form/sense: piccoli come quelli dei fieldset (1.5rem), non i pulsanti grandi di prima
  expect(narrow.add, 'pulsante + presente').not.toBeNull();
  expect(narrow.add!, 'pulsante + piccolo (1.5rem = 19.5px)').toBeLessThanOrEqual(21);
  expect(narrow.name, 'spazio per il nome a pannello stretto').toBeGreaterThan(170);
  await snap(page, 'r11-lexicon-editor-tree');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Text - apertura senza errori in console, pannelli 24/52/24', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  w.reset();
  await page.locator('#workspace-menu').getByText('Corpus', { exact: true }).click();
  await page.locator('#corpusExplorerTile .p-treenode-label, #corpusExplorerTile .p-tree-node-label').filter({ hasText: 'Decameron' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile.locator('#gText tspan tspan').nth(12)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  // Difetto visto: il workaround "fixPrimeNgSplitterPanelInitialSize" cercava la classe .p-splitter-panel (rinominata
  // .p-splitterpanel in PrimeNG 20) e lanciava "annotationPanel is undefined" a ogni apertura del pannello Text.
  expect(w.consoleErrors.filter((e) => /annotationPanel|is undefined|TypeError/.test(e)), 'errori in console all\'apertura').toEqual([]);
  // dimensioni iniziali dei tre pannelli (sezioni / testo / annotazione) senza il workaround
  const pct = await tile.evaluate((e) => {
    const sp = e.querySelector('p-splitter')!; const tot = sp.getBoundingClientRect().width;
    return [...sp.querySelectorAll('.p-splitterpanel, .p-splitter-panel')].map((x) => Math.round((100 * x.getBoundingClientRect().width) / tot));
  });
  expect(pct).toEqual([24, 52, 24]);
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Lexicon Explorer - niente colonna delle note, icone a larghezza fissa', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(120_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  const tile = page.locator('#lexiconTile');
  await expect(tile.locator('tbody tr').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  const m = await tile.evaluate((e) => {
    const tables = [...e.querySelectorAll('p-treetable table')]; const body = tables[tables.length - 1];
    const tds = [...body.querySelectorAll('tbody tr:first-child td')].map((td) => Math.round(td.getBoundingClientRect().width));
    const sb = e.querySelector('.p-treetable-scrollable-body') as HTMLElement;
    return { tds, overflowX: sb.scrollWidth - sb.clientWidth };
  });
  testInfo.annotations.push({ type: 'colonne', description: JSON.stringify(m) });
  // come nel Lexicon Editor: la colonna delle note (10%) e' vuota quasi sempre e toglie spazio al nome;
  // l'icona sta accanto al nome. Restano componente, autore e stato, a larghezza fissa.
  expect(m.tds.length, 'nome + 3 colonne di icone').toBe(4);
  expect(m.tds.slice(1).every((x) => x >= 30 && x <= 36), 'colonne delle icone a larghezza fissa (~2.5rem)').toBe(true);
  expect(m.tds[0], 'spazio per il nome').toBeGreaterThan(200);
  expect(m.overflowX).toBeLessThanOrEqual(0);
  await snap(page, 'r12-lexicon-explorer');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Dictionary Explorer - pulsante "+" piccolo e non tagliato', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(120_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  const btn = tile.locator('tbody button[aria-label="Add lemma"]').first();
  await expect(btn).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  const m = await tile.evaluate((e) => {
    const b = e.querySelector('tbody button[aria-label="Add lemma"]')!; const r = b.getBoundingClientRect(); const c = b.closest('td')!.getBoundingClientRect();
    const sb = e.querySelector('.p-treetable-scrollable-body') as HTMLElement;
    return { w: r.width, h: r.height, left: r.left - c.left, right: c.right - r.right, overflowX: sb.scrollWidth - sb.clientWidth, bg: getComputedStyle(b).backgroundColor };
  });
  testInfo.annotations.push({ type: 'pulsante', description: JSON.stringify(m) });
  // Difetto visto: bottone da 2.5rem+ nella colonna da 10%: tagliato sul bordo destro; ora 1.5rem come il "+" dei fieldset
  expect(m.w, 'pulsante piccolo (1.5rem = 19.5px)').toBeLessThanOrEqual(21);
  expect(m.h).toBeLessThanOrEqual(21);
  expect(m.left, 'non tagliato a sinistra').toBeGreaterThanOrEqual(0);
  expect(m.right, 'non tagliato a destra').toBeGreaterThanOrEqual(0);
  expect(Math.abs(m.left - m.right), 'centrato nella cella').toBeLessThan(1.5);
  expect(m.overflowX, 'nessuna barra orizzontale').toBeLessThanOrEqual(0);
  expect(m.bg, 'colore invariato (blu)').toBe('rgb(33, 150, 243)');
  await snap(page, 'r13-dictionary-explorer');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Dictionary Editor - anteprima: tabelle delle occorrenze visibili senza clic', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  await w.settle();
  const row = page.locator('#dictionaryTile tbody tr').filter({ hasText: /\w/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  await w.settle();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  const tabs = editor.locator('[role="tab"]');
  await expect(tabs.nth(2)).toBeVisible({ timeout: 30_000 });
  await tabs.nth(2).click(); // anteprima
  // Difetto visto (PrimeNG 20+, nodi dell'albero OnPush): le tabelle delle occorrenze (esempi) di ogni accezione
  // comparivano solo dopo un clic nell'albero: i figli del nodo erano sostituiti sul posto.
  // Nessun clic: le tabelle devono comparire da sole.
  const tables = editor.locator('.custom-leaf p-table');
  await expect(tables.first(), 'tabella delle occorrenze visibile senza clic').toBeVisible({ timeout: 20_000 });
  testInfo.annotations.push({ type: 'tabelle', description: String(await tables.count()) });
  await expect(editor.locator('.custom-leaf thead').first()).toBeVisible();
  await snap(page, 'r14-dictionary-preview');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: campi numerici - le frecce su/giu della tastiera non cambiano il valore', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await blockWrites(page, testInfo); // la scheda della voce del dizionario salva da sola: nessuna scrittura deve arrivare al server
  await openSmokeWorkspace(page, baseURL!);
  // 1) Dictionary Editor, scheda della voce: "N. occorrenze nel Decameron" e "Occ. altre opere"
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  await w.settle();
  const row = page.locator('#dictionaryTile tbody tr').filter({ hasText: /\w/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  await w.settle();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  await expect(editor.locator('[role="tab"]').first()).toBeVisible({ timeout: 30_000 });
  await editor.locator('[role="tab"]').first().click();
  const fields = editor.locator('p-inputnumber input').filter({ visible: true });
  await expect(fields.first()).toBeVisible({ timeout: 30_000 });
  const n = await fields.count();
  testInfo.annotations.push({ type: 'campi-dizionario', description: String(n) });
  expect(n, 'campi numerici nella scheda della voce').toBeGreaterThan(0);
  // Difetto: ArrowUp/ArrowDown cambiavano il numero (inavvertitamente, muovendosi nella pagina con la tastiera)
  for (let i = 0; i < n; i++) {
    const f = fields.nth(i);
    const before = await f.inputValue();
    await f.click();
    for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowUp']) await f.press(k);
    expect(await f.inputValue(), `campo numerico #${i} invariato con le frecce`).toBe(before);
  }
  // (le scritture sono bloccate da blockWrites: la scheda della voce salva da sola)
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Search - modifica massiva delle annotazioni: lemma (lessico) con la POS', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const tile = page.locator('#searchTile');
  await expect(tile).toBeVisible();
  await page.waitForTimeout(1500);
  await tile.locator('p-select').first().click();
  await page.locator('.p-select-option').filter({ hasText: /^\s*Lemma\s*$/ }).first().click();
  const input = tile.locator('p-iconfield input[pinputtext]').first();
  await input.fill('villano'); await input.press('Enter');
  await expect(tile.locator('tbody tr').nth(1)).toBeVisible({ timeout: 30_000 });
  await tile.locator('thead .p-checkbox').first().click();
  await tile.locator('p-splitbutton button').nth(1).click();
  await page.locator('[role="menuitem"]', { hasText: /Edit annotations|Modifica annotazioni/ }).first().click();
  const dialog = page.locator('.p-dialog').filter({ visible: true }).first();
  const lexical = dialog.locator('app-generic-autocomplete input').last();
  await expect(lexical).toBeVisible({ timeout: 15_000 });
  await lexical.click(); await lexical.fill('villano');
  const options = page.locator('.p-autocomplete-option');
  // aspetta l'elenco filtrato (prima puo' vedersi quello della ricerca precedente, ancora vuota)
  await expect(options.filter({ hasText: /villano/i }).first()).toBeVisible({ timeout: 15_000 });
  await expect(options).toHaveCount(2, { timeout: 15_000 });
  const texts = (await options.allInnerTexts()).map((t) => t.trim());
  testInfo.annotations.push({ type: 'opzioni', description: JSON.stringify(texts) });
  // Prima: due "villano" identici (aggettivo e sostantivo omografi): scelta alla cieca. Ora la POS tra parentesi quadre accanto al lemma (come nell'annotazione singola).
  expect(texts.length, 'almeno due lessemi omografi (dati della VM di test)').toBeGreaterThan(1);
  for (const t of texts) expect(t, 'etichetta con la POS tra parentesi quadre').toMatch(/^villano \[\w+\]$/);
  expect(new Set(texts).size, 'etichette tutte diverse').toBe(texts.length);
  await snap(page, 'r15-lemma-lessico-pos');
  // nessun salvataggio: si chiude il dialogo senza applicare
  await page.keyboard.press('Escape');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Text - annotazione singola: la POS del lemma (lessico) compare una volta sola', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const tile = page.locator('#searchTile');
  await expect(tile).toBeVisible();
  await page.waitForTimeout(1500);
  await tile.locator('p-select').first().click();
  await page.locator('.p-select-option').filter({ hasText: /^\s*Lemma\s*$/ }).first().click();
  const input = tile.locator('p-iconfield input[pinputtext]').first();
  await input.fill('villano'); await input.press('Enter');
  await expect(tile.locator('tbody tr').nth(1)).toBeVisible({ timeout: 30_000 });
  await tile.locator('tbody tr').nth(1).dblclick();
  const text = page.locator('[id^="textTile_"]').first();
  const sel = text.locator('#selectionHighlightg rect').first();
  await expect(sel).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  // annotazione "Lemma" piu' vicina alla parola selezionata
  const target = await text.evaluate((e) => {
    const s = e.querySelector('#selectionHighlightg rect')!.getBoundingClientRect(); let best: { x: number; y: number } | null = null; let bd = 1e9;
    for (const t of Array.from(e.querySelectorAll('#svg g.span text'))) {
      if (!/^\s*Lemma/.test(t.textContent || '')) continue;
      const b = t.getBoundingClientRect(); const d = Math.abs(b.x + b.width / 2 - (s.x + s.width / 2)) + Math.abs(b.y - s.y);
      if (d < bd) { bd = d; best = { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
    }
    return best;
  });
  expect(target, 'annotazione Lemma vicino alla parola').not.toBeNull();
  await page.mouse.click(target!.x, target!.y);
  const lexical = text.locator('app-generic-autocomplete input').first();
  await expect(lexical).toBeVisible({ timeout: 15_000 });
  await expect(lexical, 'valore del lemma (lessico) caricato').not.toHaveValue('', { timeout: 15_000 });
  const value = await lexical.inputValue();
  testInfo.annotations.push({ type: 'lemma-lessico', description: value });
  // Difetto visto: "villano [adjective] (adjective)": l'editor singolo aggiunge gia' "[pos]", la POS non va ripetuta
  expect(value, 'etichetta "lemma [pos]" con la POS una sola volta').toMatch(/^[^\[\]()]+ \[\w+\]$/);
  await snap(page, 'r16-annotazione-singola-lessico');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: editor di testo - barra ridotta, caratteri speciali, incolla pulita', async ({ page, baseURL, context }, testInfo) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  // I test che digitano NON devono scrivere sul back-end (molti editor salvano da soli, senza pulsante): scritture bloccate.
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseURL!).origin });
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  await expect(page.locator('#lexiconTile')).toBeVisible();
  await page.locator('#lexiconTile tr', { hasText: '@' }).nth(1).dblclick();
  const editor = page.locator('.jsPanel').filter({ has: page.locator('app-workspace-lexicon-edit-tile') }).last();
  await editor.locator('.jsPanel-btn-maximize').click().catch(() => undefined);
  // si apre la definizione di un senso (editor di testo "definition"); salva solo con il pulsante di salvataggio
  const row = editor.locator('tr', { hasText: /^\s*sense \(\d+\)/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.locator('button').first().click();
  await row.locator('xpath=following-sibling::tr[1]').click();
  const rte = editor.locator('app-rich-text-editor').first();
  await expect(rte).toBeVisible({ timeout: 30_000 });
  const toolbar = rte.locator('.ql-toolbar');

  // 1) barra: solo gli strumenti scelti (niente tipo di testo, font, colori, elenchi, immagine, codice)
  const tools = await toolbar.evaluate((t) => [...t.querySelectorAll('button, select')].map((b) => [...b.classList].find((c) => c.startsWith('ql-') || c.startsWith('rte-')) || '?'));
  testInfo.annotations.push({ type: 'strumenti', description: tools.join(' ') });
  expect(tools, 'strumenti della barra').toEqual(['ql-bold', 'ql-italic', 'ql-underline', 'ql-align', 'ql-link', 'rte-menu-button', 'rte-menu-button', 'ql-clean']);

  // 2) caratteri speciali dal menu "Ω": inseriti al cursore
  const area = rte.locator('.ql-editor');
  const changes = await area.evaluateHandle((el) => { const host = el.closest('app-rich-text-editor')!; const c = { n: 0 }; host.addEventListener('change', () => c.n++); return c; });
  await area.click(); await area.press('Control+A'); await area.press('Delete');
  await area.pressSequentially('Parola ');
  for (const ch of ['«', 'È', '–', '»']) {
    await toolbar.locator('.rte-menu-button').first().click();
    await page.locator('.rte-char', { hasText: new RegExp(`^${ch}$`) }).click();
  }
  expect(await area.innerText(), 'caratteri inseriti al cursore').toContain('Parola «È–»');
  // le modifiche dell'utente fanno scattare il "change" DOM (come prima faceva la barra), usato da onPendingChanges()
  expect(await changes.evaluate((c) => c.n), 'evento change alle modifiche').toBeGreaterThan(0);

  // 3) "Altri formati": apice sul testo selezionato
  await area.press('Control+A');
  await toolbar.locator('.rte-menu-button').nth(1).click();
  await page.locator('.rte-format').first().click();
  expect(await area.innerHTML(), 'apice applicato').toContain('<sup>');

  // 4) incolla da Word/web: colori, sfondi, font, titoli, immagini e dimensioni vengono scartati; restano corsivo, grassetto, link
  const html = '<p style="color:red;font-family:Arial;font-size:14pt">Testo <span style="background:yellow;color:#0563c1">colorato</span> <b>grassetto</b> <i>corsivo</i> <a href="https://example.org">link</a></p><h1>Titolo</h1><img src="data:image/png;base64,iVBORw0KGgo=">';
  await page.evaluate(async (h) => { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }), 'text/plain': new Blob(['x'], { type: 'text/plain' }) })]); }, html);
  await area.press('Control+A'); await area.press('Control+V');
  await expect(area.locator('a')).toHaveCount(1);
  const pasted = await area.innerHTML();
  testInfo.annotations.push({ type: 'incollato', description: pasted.slice(0, 300) });
  for (const bad of ['style=', 'color:', 'background', 'font-', '<img', '<h1', '<span']) expect(pasted, `incolla senza "${bad}"`).not.toContain(bad);
  for (const good of ['<strong>grassetto</strong>', '<em>corsivo</em>', '<a href="https://example.org/"']) expect(pasted, `incolla con ${good}`).toContain(good);
  await snap(page, 'r17-editor-testo');
  expect(w.pageErrors).toEqual([]);
});

test('regressione: Dictionary Editor - anteprima: numerazione a tre livelli ed errore dei contesti', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const w = watchPage(page);
  // Si simula il guasto del servizio dei contesti solo per la seconda parte del test.
  let failContexts = false;
  await page.route('**/texto/util/ais', async (route) => (failContexts ? route.fulfill({ status: 500, body: 'errore simulato' }) : route.fallback()));
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  await w.settle();
  const openPreview = async () => {
    const filter = page.locator('#dictionaryTile input[type="text"]').first();
    await filter.fill('padre');
    await filter.press('Enter');
    const row = page.locator('#dictionaryTile tbody tr', { hasText: /^\s*padre/ }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.dblclick();
    const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
    await expect(editor.locator('[role="tab"]').nth(2)).toBeVisible({ timeout: 30_000 });
    await editor.locator('[role="tab"]').nth(2).click();
    return editor;
  };
  // 1) "padre" ha accezioni di terzo livello: devono avere il numero 1.1.1, 1.1.2 (prima mostravano solo il punto)
  let editor = await openPreview();
  const labels = editor.locator('app-dictionary-preview p-tree .p-tree-node-content b');
  await expect(labels.first()).toBeVisible({ timeout: 30_000 });
  await expect(editor.locator('app-dictionary-preview p-tree').getByText('1.1.1', { exact: true })).toBeVisible();
  await expect(editor.locator('app-dictionary-preview p-tree').getByText('1.1.2', { exact: true })).toBeVisible();
  const texts = (await labels.allInnerTexts()).map(t => t.trim());
  expect(texts.filter(t => t === ''), 'accezione senza numero').toEqual([]);
  await snap(page, 'r15-dictionary-preview-numbering');
  // 2) se il servizio dei contesti fallisce, la tabella lo dice (non "Nessun risultato")
  await page.keyboard.press('Escape');
  await editor.locator('.jsPanel-btn-close').click();
  failContexts = true;
  editor = await openPreview();
  await expect(editor.locator('.custom-leaf').getByText(/Impossibile recuperare le occorrenze/).first()).toBeVisible({ timeout: 30_000 });
  await expect(editor.locator('.custom-leaf').getByText('Nessun risultato')).toHaveCount(0);
  failContexts = false;
  expect(w.pageErrors).toEqual([]);
});

// Sessione scaduta: il back-end risponde 500 senza messaggio su /texto e /lexo (maia-be gira il token a TexO/LexO, che
// rispondono 401, e lo trasforma in 500): l'app restava "viva" ma con ogni chiamata in errore e in silenzio.
const SESSION_EXPIRED = /Sessione scaduta|Session expired/;

/** Imposta la scadenza salvata dall'app (localStorage, chiave "..._token_expiration"). */
async function setStoredExpiration(page: Page, inMs: number) {
  const n = await page.evaluate((delta) => {
    let count = 0;
    for (const k of Object.keys(localStorage)) {
      if (k.endsWith('_token_expiration')) { localStorage.setItem(k, String(Date.now() + delta)); count++; }
    }
    return count;
  }, inMs);
  expect(n, 'chiave della scadenza nel localStorage').toBeGreaterThan(0);
}

/** Apre il Dictionary Explorer (se non e' gia' aperto dal layout salvato) e lo ricarica: parte una chiamata a LexO. */
async function openDictionaryAndRefresh(page: Page) {
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const refresh = page.locator('#dictionaryTile p-button[icon="pi pi-spinner"] button, #dictionaryTile button:has(.pi-spinner)').first();
  await expect(refresh).toBeVisible({ timeout: 30_000 });
  await refresh.click();
}

test('regressione: sessione - 401 dal server riporta al login con un messaggio', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await openSmokeWorkspace(page, baseURL!);
  // da ora TexO rifiuta il token (401), come con un token scaduto
  await page.route('**/texto/**', (route) => route.fulfill({ status: 401, body: '' }));
  await page.reload();
  await expect(page.locator('.swal2-popup').getByText(SESSION_EXPIRED)).toBeVisible({ timeout: 30_000 });
  await page.locator('.swal2-confirm').click();
  await expect(page).toHaveURL(/#\/login/, { timeout: 15_000 });
});

test('regressione: sessione - 500 senza messaggio con il token scaduto riporta al login', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await openSmokeWorkspace(page, baseURL!);
  // il token scade mentre si lavora; il server (maia-be) risponde 500 generico sulle chiamate a LexO
  await setStoredExpiration(page, -1000);
  await page.route('**/lexo/**', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"status":500,"error":"Internal Server Error"}' }));
  await openDictionaryAndRefresh(page);
  await expect(page.locator('.swal2-popup').getByText(SESSION_EXPIRED)).toBeVisible({ timeout: 30_000 });
  await page.locator('.swal2-confirm').click();
  await expect(page).toHaveURL(/#\/login/, { timeout: 15_000 });
});

test('regressione: sessione - un 500 con il token ancora valido NON porta al login', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await openSmokeWorkspace(page, baseURL!);
  await page.route('**/lexo/**', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"status":500,"error":"Internal Server Error"}' }));
  await openDictionaryAndRefresh(page);
  await page.waitForTimeout(4000);
  await expect(page.locator('.swal2-popup').getByText(SESSION_EXPIRED)).toHaveCount(0);
  expect(hashPath(page)).not.toMatch(/^\/login/);
});

test('regressione: sessione - l\'avviso di disconnessione compare anche dopo un ricaricamento della pagina', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await openSmokeWorkspace(page, baseURL!);
  // il timer dell'avviso era solo in memoria: dopo F5 non esisteva piu' e la sessione scadeva senza avvisare
  await setStoredExpiration(page, 36_000); // scade fra 36 s: l'avviso (30 s prima) deve comparire entro ~6 s
  await page.reload();
  await expect(page.locator('.swal2-popup').getByText(/about to be disconnected/i)).toBeVisible({ timeout: 20_000 });
});

test('regressione: sessione - il layout del workspace si salva prima della scadenza (e senza avvisi al ritorno al login)', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  // Difetto visto: al ritorno al login partiva il salvataggio del layout con il token gia' tolto/scaduto: 401 e avviso
  // "Error saving workspace status" sulla pagina di login. Ora il layout si salva 30 s prima della scadenza, quando il token
  // vale ancora, e dopo la fine della sessione non si prova piu' a salvare.
  const saves: string[] = [];
  page.on('response', (r) => { if (r.url().endsWith('/layout') && r.request().method() === 'PUT') saves.push(String(r.status())); });
  await openSmokeWorkspace(page, baseURL!);
  saves.length = 0;
  await setStoredExpiration(page, 36_000);
  await page.reload();
  await expect(page.locator('.swal2-popup').getByText(/about to be disconnected/i)).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => saves.length, { timeout: 10_000, message: 'layout salvato all\'avviso di disconnessione' }).toBeGreaterThan(0);
  await page.locator('.swal2-cancel').click();
  await expect(page).toHaveURL(/#\/login/, { timeout: 15_000 });
  await page.waitForTimeout(2500);
  testInfo.annotations.push({ type: 'salvataggi', description: saves.join(',') });
  expect(saves.every(s => s === '200'), 'nessun salvataggio fallito: ' + saves).toBe(true);
  await expect(page.locator('.p-toast-message'), 'nessun avviso sul login').toHaveCount(0);

  // sessione gia' scaduta (token scaduto, il server risponde 500): niente tentativo di salvataggio, nessun avviso sul login
  await openSmokeWorkspace(page, baseURL!);
  saves.length = 0;
  await setStoredExpiration(page, -1000);
  await page.route('**/lexo/**', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"status":500,"error":"Internal Server Error"}' }));
  await openDictionaryAndRefresh(page);
  await expect(page.locator('.swal2-popup').getByText(SESSION_EXPIRED)).toBeVisible({ timeout: 30_000 });
  await page.locator('.swal2-confirm').click();
  await expect(page).toHaveURL(/#\/login/, { timeout: 15_000 });
  await page.waitForTimeout(2500);
  expect(saves, 'nessun salvataggio dopo la scadenza').toEqual([]);
  await expect(page.locator('.p-toast-message'), 'nessun avviso sul login (scaduta)').toHaveCount(0);
});

test('regressione: elenco workspace - "Last access" aggiornato dopo essere usciti da un workspace', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  // Difetto visto: l'elenco dei workspace e' condiviso e tenuto per tutta la sessione (shareReplay): veniva richiesto una
  // volta sola e "Last access" restava quello del primo caricamento, anche dopo aver salvato uscendo da un workspace.
  const { api, token, base } = await apiLogin(baseURL!);
  const fromDb = async () => {
    const list = (await (await api.get(`${base}/api/workspaces/workspaceChoiceList`, { headers: { Authorization: `Bearer ${token}` } })).json()) as Array<{ name: string; updated: string }>;
    return list.find((x) => x.name === 'e2e-smoke')!;
  };
  const ws = await fromDb();
  await uiLogin(page); // atterra sull'elenco: primo caricamento
  await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 30_000 });
  await page.goto(`#/workspace/${(await (await api.get(`${base}/api/workspaces/workspaceChoiceList`, { headers: { Authorization: `Bearer ${token}` } })).json() as any[]).find((x) => x.name === 'e2e-smoke').id}`);
  await expect(page.locator('#workspace-menu').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => { location.hash = '#/workspaces'; }); // si esce: il layout viene salvato
  await expect.poll(async () => (await fromDb()).updated, { timeout: 15_000, message: 'il salvataggio uscendo aggiorna la data' }).not.toBe(ws.updated);
  const saved = (await fromDb()).updated; // es. 2026-11-09T13:37:27.091304
  const shown = saved.replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2}).*$/, '$3-$2-$1 $4');
  await page.locator('.p-paginator-next').click();
  await expect(page.locator('tr', { hasText: 'e2e-smoke' }).first(), 'la data mostrata e\' quella aggiornata').toContainText(shown, { timeout: 15_000 });
  await api.dispose();
});

test('regressione: Text - annotazioni sovrapposte sullo stesso layer (anche a capo): handle impilati, etichetta solo sul primo frammento, clic sulla parola', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  // II.8.48 "dare la Giannetta al loro / figliuolo per isposa": tre annotazioni semantiche sovrapposte (nel DB del test):
  // 25388541 tutta la frase (va a capo), 25385421 "figliuolo", 25388398 "isposa".
  const LONG = 25388541, FIGLIUOLO = 25385421, ISPOSA = 25388398;
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (/textTile_|searchTile/.test(x.id)) x.close(); } });
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
  await input.fill('isposa'); await input.press('Enter');
  await expect(page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  await tile.locator('p-multiselect').first().click();
  await page.locator('.p-multiselect-option', { hasText: 'Semantica' }).first().click();
  await page.keyboard.press('Escape');
  const handle = (id: number) => tile.locator(`svg rect[id="${id}"]`);
  await expect(handle(ISPOSA)).toHaveCount(1, { timeout: 30_000 });
  await page.waitForTimeout(1000);

  // 1) nessuna coppia di handle si sovrappone (prima i tre erano disegnati nello stesso punto e si poteva cliccare solo l'ultimo)
  const boxes = await tile.evaluate((e) => [...e.querySelectorAll('.span rect')].filter((r) => !(r.getAttribute('id') ?? '').startsWith('h-')).map((r) => { const b = r.getBoundingClientRect(); return { id: r.getAttribute('id'), x: b.x, y: b.y, w: b.width, h: b.height }; }));
  const overlaps: string[] = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1) overlaps.push(`${a.id}/${b.id}`);
  }
  testInfo.annotations.push({ type: 'handle', description: `${boxes.length} handle, sovrapposti: ${overlaps.join(',') || 'nessuno'}` });
  expect(overlaps, 'handle sovrapposti').toEqual([]);
  // la frase lunga ha un handle per riga; gli altri due stanno sotto (piu' vicini al testo) quello della seconda riga
  await expect(handle(LONG)).toHaveCount(2);
  const lastLine = await tile.evaluate((e, ids) => {
    const y = (id: number) => (e.querySelector(`svg rect[id="${id}"]`) as Element).getBoundingClientRect().y;
    return { fig: y(ids[0]), isp: y(ids[1]), longs: [...e.querySelectorAll(`svg rect[id="${ids[2]}"]`)].map((r) => r.getBoundingClientRect().y) };
  }, [FIGLIUOLO, ISPOSA, LONG]);
  expect(Math.min(...lastLine.longs.filter((y) => y > Math.min(...lastLine.longs) + 5)), 'handle lungo (seconda riga) sopra quelli delle parole').toBeLessThan(Math.min(lastLine.fig, lastLine.isp));

  // 2) etichetta solo sul primo frammento
  const labels = await tile.evaluate((e, id) => [...e.querySelectorAll(`svg rect[id="${id}"]`)].map((r) => r.nextElementSibling?.textContent?.trim() ?? ''), LONG);
  expect(labels.filter((t) => t !== ''), 'etichetta della frase lunga: una sola volta').toHaveLength(1);

  // 3) il mouse sull'handle evidenzia il testo dell'annotazione
  await handle(ISPOSA).hover();
  await expect(tile.locator(`svg rect[id="h-${ISPOSA}"]`)).toHaveClass(/over/);
  await expect(tile.locator(`svg rect[id="h-${FIGLIUOLO}"]`)).not.toHaveClass(/over/);
  await page.mouse.move(5, 5);
  await expect(tile.locator(`svg rect[id="h-${ISPOSA}"]`)).not.toHaveClass(/over/);

  // 4) clic sulla parola: si apre l'annotazione piu' interna (isposa -> la sua; per -> la frase lunga)
  const openedId = () => tile.evaluate((e) => (window as any).ng?.getComponent(e.closest('app-workspace-text-window') ?? e.querySelector('app-workspace-text-window'))?.textoAnnotation?.id);
  if (await page.evaluate(() => !!(window as any).ng?.getComponent)) {
    const clickWord = async (re: RegExp) => { const line = tile.locator('#gText > text > tspan').filter({ hasText: 'figliuolo per isposa' }).first(); await line.locator('tspan').filter({ hasText: re }).first().click({ position: { x: 4, y: 6 } }); };
    await clickWord(/^isposa/);
    await expect.poll(openedId, { timeout: 10_000, message: 'clic su "isposa"' }).toBe(ISPOSA);
    await clickWord(/^figliuolo/);
    await expect.poll(openedId, { timeout: 10_000, message: 'clic su "figliuolo"' }).toBe(FIGLIUOLO);
    await clickWord(/^per\s*$/);
    await expect.poll(openedId, { timeout: 10_000, message: 'clic su "per"' }).toBe(LONG);
    // il doppio clic seleziona la parola per annotarla: non apre prima l'annotazione esistente
    const line = tile.locator('#gText > text > tspan').filter({ hasText: 'figliuolo per isposa' }).first();
    await line.locator('tspan').filter({ hasText: /^isposa/ }).first().dblclick({ position: { x: 4, y: 6 } });
    await page.waitForTimeout(900);
    expect(await openedId(), 'doppio clic: nessuna annotazione esistente aperta').toBeFalsy();
  }
});

test('regressione: Text - albero delle sezioni: tooltip con il luogo del testo (es. II.8.48)', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (/textTile_|searchTile/.test(x.id)) x.close(); } });
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
  await input.fill('isposa'); await input.press('Enter');
  await expect(page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  // un clic su una parola del testo apre nell'albero i rami fino alla sezione di quella riga (qui la novella II.8)
  await tile.locator('#gText tspan tspan').filter({ hasText: /^gentile\s*$/ }).first().click();
  const label = (re: RegExp) => tile.locator('#sectionsTree .section-label').filter({ hasText: re }).first();
  await expect(label(/^Novella 8$/)).toBeVisible({ timeout: 15_000 });
  const tip = page.locator('.p-tooltip');
  // ogni tipo di elemento: giornata, novella, paragrafo (solo il luogo del testo, il titolo e' gia' nel nodo), radice (senza luogo: il titolo)
  for (const [re, text] of [[/^Giornata II$/, 'II'], [/^Novella 8$/, 'II.8'], [/^Paragrafo 3$/, 'II.8.3'], [/^Decameron$/, 'Decameron']] as Array<[RegExp, string]>) {
    await label(re).hover();
    await expect(tip, 'tooltip di ' + text).toHaveText(text, { timeout: 5000 });
    await page.mouse.move(5, 5);
    await expect(tip).toHaveCount(0);
  }
});

test('regressione: Text - cliccare su un\'annotazione non rifa le chiamate di configurazione (layer, campi, tagset, elenco dei sensi)', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  const ISPOSA = 25388398, FIGLIUOLO = 25385421;
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (/textTile_|searchTile/.test(x.id)) x.close(); } });
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
  await input.fill('isposa'); await input.press('Enter');
  await expect(page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  // due layer visibili insieme: Semantica e il primo degli altri
  await tile.locator('p-multiselect').first().click();
  await page.locator('.p-multiselect-option', { hasText: 'Semantica' }).first().click();
  await page.locator('.p-multiselect-option').filter({ hasNotText: 'Semantica' }).first().click();
  await page.keyboard.press('Escape');
  await expect(tile.locator(`svg rect[id="${ISPOSA}"]`)).toHaveCount(1, { timeout: 30_000 });
  await page.waitForTimeout(2500); // il caricamento in background della configurazione dei layer visibili

  const calls: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (/\/texto\/layer\/\d+(\/features)?$/.test(u) || /\/texto\/tagset\/\d+\/items$/.test(u) || /filteredSenses|lexicalSense|lexicalEntry\?|\/data\/form\?/.test(u)) calls.push(`${r.method()} ${u.replace(/^.*\/(texto|lexo)\//, '/$1/').replace(/id=.*/, 'id=…')}`);
  });
  const click = async (id: number | string) => { calls.length = 0; await tile.locator(`svg rect[id="${id}"]`).first().click(); await page.waitForTimeout(1800); return [...calls]; };
  const first = await click(ISPOSA);
  const second = await click(FIGLIUOLO);
  const third = await click(ISPOSA);
  // un'annotazione dell'altro layer (un handle che non sia uno dei tre semantici della frase)
  const otherId = await tile.evaluate((e) => [...e.querySelectorAll('.span rect')].map((r) => r.getAttribute('id') ?? '').find((id) => id && !id.startsWith('h-') && ![25388541, 25385421, 25388398].includes(Number(id)) && Number(id) > 25000000) ?? '');
  const other = otherId ? await click(otherId) : [];
  testInfo.annotations.push({ type: 'chiamate', description: JSON.stringify({ first, second, third, other }) });
  const heavy = (l: string[]) => l.filter((c) => /filteredSenses|\/texto\/layer\/|\/texto\/tagset\//.test(c));
  // Difetto visto: a ogni clic partivano GET del layer, dei suoi campi, dei valori del tagset e l'elenco di 887 sensi (ricerca a vuoto)
  expect(heavy(first), 'primo clic: nessuna chiamata di configurazione (gia\' pre-caricata)').toEqual([]);
  expect(heavy(second), 'secondo clic').toEqual([]);
  expect(heavy(third), 'terzo clic').toEqual([]);
  expect(heavy(other), 'clic su un altro layer').toEqual([]);
  // resta al piu' l'etichetta del senso (una per annotazione)
  expect(first.length, 'primo clic: al piu\' l\'etichetta del senso').toBeLessThanOrEqual(1);
  expect(third.length).toBeLessThanOrEqual(1);
});

test('regressione: Text - il campo "Text" dell\'editor di annotazione mostra il testo selezionato / dell\'annotazione cliccata (non resta indietro)', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const ISPOSA = 25388398, FIGLIUOLO = 25385421;
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (/textTile_|searchTile/.test(x.id)) x.close(); } });
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
  await input.fill('isposa'); await input.press('Enter');
  await expect(page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  await tile.locator('p-multiselect').first().click();
  await page.locator('.p-multiselect-option', { hasText: 'Semantica' }).first().click();
  await page.keyboard.press('Escape');
  await expect(tile.locator(`svg rect[id="${ISPOSA}"]`)).toHaveCount(1, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  const textField = tile.locator('app-text-annotation-editor input[formcontrolname="text"]');
  const line = tile.locator('#gText > text > tspan').filter({ hasText: 'figliuolo per isposa' }).first();
  const word = (re: RegExp) => line.locator('tspan').filter({ hasText: re }).first();

  // 1) nuova annotazione: si sceglie il layer e si seleziona (doppio clic) una parola, poi un'altra
  await tile.locator('p-select').first().click();
  await page.locator('.p-select-option', { hasText: 'Semantica' }).first().click();
  await word(/^per\s*$/).dblclick({ position: { x: 4, y: 6 } });
  await expect(textField, 'parola selezionata col doppio clic').toHaveValue('per', { timeout: 10_000 });
  await word(/^figliuolo/).dblclick({ position: { x: 4, y: 6 } });
  await expect(textField, 'seconda parola (prima restava la precedente)').toHaveValue('figliuolo', { timeout: 10_000 });

  // 2) annotazione esistente: il campo mostra il testo di quella cliccata
  await tile.locator(`svg rect[id="${ISPOSA}"]`).first().click();
  await expect(textField, 'annotazione "isposa"').toHaveValue('isposa', { timeout: 10_000 });
  await tile.locator(`svg rect[id="${FIGLIUOLO}"]`).first().click();
  await expect(textField, 'annotazione "figliuolo" (prima restava "isposa")').toHaveValue('figliuolo', { timeout: 10_000 });
});

test('regressione: Text - aprendo da un risultato della Search una sola richiesta di righe/annotazioni e il form dell\'editor non si ricostruisce', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(240_000);
  await openSmokeWorkspace(page, baseURL!);

  const openFromSearch = async (word: string, reference: string, withLayer: boolean) => {
    await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (/textTile_|searchTile/.test(x.id)) x.close(); } });
    await page.waitForTimeout(500);
    await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
    if (withLayer) {
      await page.locator('#searchTile p-select').filter({ hasText: /Layer/ }).first().click();
      await page.locator('.p-select-option').filter({ hasText: /^\s*Semantica\s*$/ }).first().click();
    }
    const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
    await input.fill(word); await input.press('Enter');
    const row = page.locator('#searchTile tbody tr', { hasText: reference }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(800);
    const calls: string[] = [];
    const onReq = (r: any) => { const u = r.url(); if (/\/resource\/123\/(rows|annotations)$/.test(u) || /lexicalSense/.test(u) || /resource\/123\/rowCount|\/layer\/list/.test(u)) calls.push(u.replace(/^.*\/(resource|data)\//, '').replace(/id=.*/, 'id') + (r.method() === 'POST' ? ' ' + (r.postData() ?? '').slice(0, 70) : '')); };
    page.on('request', onReq);
    await row.dblclick();
    const tile = page.locator('[id^="textTile_"]').first();
    await expect(tile).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(5000);
    page.off('request', onReq);
    return { tile, calls };
  };
  // posizione (in px, dall'alto del riquadro del testo) della riga col riferimento
  const rowTop = (tile: any, reference: string) => tile.evaluate((e: Element, ref: string) => {
    const box = e.querySelector('.text-container')!.getBoundingClientRect();
    const label = [...e.querySelectorAll('.sentnum text')].find((t) => (t.textContent ?? '').trim() === ref);
    return label ? Math.round(label.getBoundingClientRect().top - box.top) : null;
  }, reference);

  // 1) al centro del testo, con il layer semantico: l'annotazione si apre
  const mid = await openFromSearch('isposa', 'II.8.48', true);
  testInfo.annotations.push({ type: 'centro', description: mid.calls.join(' | ') });
  expect(mid.calls.filter((c) => /rowCount/.test(c)), 'il numero di righe del testo non si chiede piu\' prima del primo caricamento (lo da la risposta delle righe)').toEqual([]);
  expect(mid.calls.filter((c) => c.startsWith('123/rows') || c === 'rows').length, 'richieste di righe').toBe(1);
  expect(mid.calls.filter((c) => /annotations/.test(c)).length, 'richieste di annotazioni').toBe(1);
  expect(mid.calls.filter((c) => /lexicalSense/.test(c)).length, 'etichetta del senso').toBe(1);
  const top = await rowTop(mid.tile, 'II.8.48');
  expect(top, 'la riga cercata e\' visibile in alto nel riquadro').not.toBeNull();
  expect(top!, 'riga cercata vicino all\'inizio del riquadro').toBeLessThan(120);
  expect(top!).toBeGreaterThanOrEqual(-5);

  // 1b) con l'annotazione aperta si cambia un campo (senza salvare) e si scorre il testo: caricando altre righe il form non si ricostruisce
  // (prima si perdeva la modifica e ripartiva la richiesta dell'etichetta del senso)
  const editor = mid.tile.locator('app-text-annotation-editor');
  const tipo = editor.locator('p-select').first();
  await expect(tipo).toBeVisible({ timeout: 15_000 });
  const initial = (await tipo.innerText()).trim();
  await tipo.click();
  const option = page.locator('.p-select-option').filter({ hasNotText: initial }).first();
  await expect(option).toBeVisible();
  await option.click();
  const changed = (await tipo.innerText()).trim();
  expect(changed, 'campo modificato').not.toBe(initial);
  const senseCalls: string[] = [];
  const onSense = (r: any) => { if (/lexicalSense/.test(r.url())) senseCalls.push(r.url()); };
  page.on('request', onSense);
  await mid.tile.locator('.text-container').evaluate((e: Element) => { e.scrollTop = e.scrollHeight; });
  await page.waitForTimeout(3500);
  await mid.tile.locator('.text-container').evaluate((e: Element) => { e.scrollTop = 0; });
  await page.waitForTimeout(3500);
  page.off('request', onSense);
  expect((await tipo.innerText()).trim(), 'la modifica non salvata resta dopo aver scorso il testo').toBe(changed);
  expect(senseCalls, 'nessuna nuova richiesta dell\'etichetta del senso').toEqual([]);

  // 2) inizio e fine del testo: l'allargamento si limita, la riga cercata resta visibile e una sola richiesta di righe
  for (const [reference, label] of [['Pr.1', 'prima riga'], ['X.ConclAut.30', 'ultima riga']]) {
    const r = await openFromSearch('cognominato', reference, false);
    testInfo.annotations.push({ type: label, description: r.calls.join(' | ') });
    expect(r.calls.filter((c) => c.startsWith('123/rows')).length, label + ': richieste di righe').toBe(1);
    expect(r.calls.filter((c) => /rowCount|layer\/list/.test(c)), label + ': niente rowCount e (riapertura) niente elenco layer').toEqual([]);
    const t = await rowTop(r.tile, reference);
    expect(t, label + ': riga visibile').not.toBeNull();
    expect(t!, label + ': nel riquadro').toBeGreaterThanOrEqual(-5);
    expect(t!, label + ': nel riquadro').toBeLessThan(700);
  }
});

test('regressione: Text - prima apertura con il font del testo non ancora caricato: evidenziazioni e handle allineati alle parole', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const ISPOSA = 25388398;
  await openSmokeWorkspace(page, baseURL!);
  // Difetto visto: le posizioni si calcolano misurando il testo su un canvas col font del testo (@font-face lazy: si scarica quando
  // il testo viene disegnato). Alla prima apertura il font non c'e' ancora, la misura usa un font di ripiego e le evidenziazioni e gli
  // handle risultano spostati rispetto alle parole. Un font solo-web (nessuna copia di sistema) rende il caso riproducibile.
  await page.addStyleTag({ content: '@font-face { font-family: "CousineWeb"; src: url("assets/fonts/cousine/Cousine-Regular.ttf"); } :root { --text-font-family: "CousineWeb"; }' });
  expect(await page.evaluate(() => document.fonts.check('15px CousineWeb')), 'il font non e\' ancora caricato').toBe(false);
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (/textTile_|searchTile/.test(x.id)) x.close(); } });
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  // come dalla ricerca dell'utente: layer Semantica scelto nella Search, l'annotazione compare al primo disegno
  await page.locator('#searchTile p-select').filter({ hasText: /Layer/ }).first().click();
  await page.locator('.p-select-option').filter({ hasText: /^\s*Semantica\s*$/ }).first().click();
  const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
  await input.fill('isposa'); await input.press('Enter');
  await expect(page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await expect(tile.locator(`svg rect[id="${ISPOSA}"]`)).toHaveCount(1, { timeout: 30_000 });
  // alla prima apertura i riquadri si calcolano sul font "giusto": si riapre con la finestra chiusa e il font caricato non conta,
  // si controlla subito il primo disegno: estensione della parola "isposa" nel testo e quella dell'handle/evidenziazione
  const m = await tile.evaluate((e, id) => {
    const handle = e.querySelector(`svg rect[id="${id}"]`)!.getBoundingClientRect();
    const high = e.querySelector(`svg rect[id="h-${id}"]`)!.getBoundingClientRect();
    // la parola "isposa" disegnata subito sotto l'handle (la riga puo' andare a capo in punti diversi)
    const words = [...e.querySelectorAll('#gText tspan tspan')].filter((t) => (t.textContent ?? '').startsWith('isposa'));
    const word = words.sort((a, b) => Math.abs(a.getBoundingClientRect().top - handle.bottom) - Math.abs(b.getBoundingClientRect().top - handle.bottom))[0];
    const node = word.firstChild as Text;
    const range = document.createRange(); range.setStart(node, 0); range.setEnd(node, 6);
    const w = range.getBoundingClientRect();
    return { wordLeft: w.left, wordWidth: w.width, handleLeft: handle.left, handleWidth: handle.width, highLeft: high.left, highWidth: high.width };
  }, ISPOSA);
  expect(Math.abs(m.handleLeft - m.wordLeft), 'handle: inizio uguale a quello della parola').toBeLessThan(3);
  expect(Math.abs(m.handleWidth - m.wordWidth), 'handle: larghezza uguale a quella della parola').toBeLessThan(4);
  expect(Math.abs(m.highLeft - m.wordLeft), 'evidenziazione: inizio').toBeLessThan(3);
  expect(Math.abs(m.highWidth - m.wordWidth), 'evidenziazione: larghezza').toBeLessThan(4);
});

test('regressione: Text - il puntatore e\' una mano sopra il testo annotato (e non sul testo normale)', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const ISPOSA = 25388398;
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (/textTile_|searchTile/.test(x.id)) x.close(); } });
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  await page.locator('#searchTile p-select').filter({ hasText: /Layer/ }).first().click();
  await page.locator('.p-select-option').filter({ hasText: /^\s*Semantica\s*$/ }).first().click();
  const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
  await input.fill('isposa'); await input.press('Enter');
  await expect(page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile.locator(`svg rect[id="${ISPOSA}"]`)).toHaveCount(1, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  // cursore calcolato dell'elemento sotto il mouse
  const cursorAt = async (x: number, y: number) => {
    await page.mouse.move(x, y); await page.waitForTimeout(250);
    return page.evaluate(([px, py]) => getComputedStyle(document.elementFromPoint(px, py)!).cursor, [x, y]);
  };
  // al centro della parola annotata "isposa" e al centro di una parola senza annotazione
  const pts = await tile.evaluate((e) => {
    const mid = (el: Element, from: number, to: number) => { const n = el.firstChild as Text; const r = document.createRange(); r.setStart(n, from); r.setEnd(n, to); const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; };
    const words = [...e.querySelectorAll('#gText tspan tspan')];
    const handleBottom = e.querySelector('svg rect[id="25388398"]')!.getBoundingClientRect().bottom;
    const annotated = words.filter((t) => (t.textContent ?? '').startsWith('isposa')).sort((a, b) => Math.abs(a.getBoundingClientRect().top - handleBottom) - Math.abs(b.getBoundingClientRect().top - handleBottom))[0];
    // una parola senza evidenziazione sotto: la prima parola lunga della prima riga visibile che non tocca nessuna evidenziazione
    const highs = [...e.querySelectorAll('svg rect[id^="h-"]')].map((r) => r.getBoundingClientRect());
    const box = e.querySelector('.text-container')!.getBoundingClientRect();
    const plain = words.find((t) => { const b = t.getBoundingClientRect(); return (t.textContent ?? '').trim().length >= 4 && b.top > box.top + 5 && b.bottom < box.bottom - 5 && b.left > box.left + 40 && b.right < box.right - 5 && !highs.some((h) => b.left < h.right && b.right > h.left && b.top < h.bottom && b.bottom > h.top); })!;
    return { annotated: mid(annotated, 1, 4), plain: mid(plain, 1, 3) };
  });
  expect(await cursorAt(pts.annotated.x, pts.annotated.y), 'sopra il testo annotato').toBe('pointer');
  expect(await cursorAt(pts.plain.x, pts.plain.y), 'sopra il testo normale').not.toBe('pointer');
  // lasciando il testo annotato il puntatore torna normale
  expect(await cursorAt(pts.annotated.x, pts.annotated.y), 'di nuovo sopra l\'annotazione').toBe('pointer');
  expect(await cursorAt(pts.plain.x, pts.plain.y), 'di nuovo sopra il testo normale').not.toBe('pointer');
});

test('regressione: ontologia disabilitata - nessun menu Ontology nel workspace', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await openSmokeWorkspace(page, baseURL!);
  await expect(page.locator('#workspace-menu').first().getByText('Lexicon', { exact: true })).toBeVisible();
  await expect(page.locator('#workspace-menu').getByText('Ontology', { exact: true })).toHaveCount(0);
  await expect(page.locator('#ontologyExplorerTile')).toHaveCount(0);
});

test('regressione: errori del server su chiamate secondarie - avviso unico invece del silenzio', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').first().getByText('Lexicon', { exact: true }).click();
  const tile = page.locator('#lexiconTile');
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await expect(tile.locator('tbody tr').nth(2)).toBeVisible({ timeout: 30_000 });
  // "la voce e' descritta nel dizionario?" e' interrogato solo dopo aver tolto una voce dal dizionario (azione che scrive):
  // qui si richiama direttamente il metodo del componente (strumenti di debug di Angular: solo con ng serve).
  const hasNg = await page.evaluate(() => typeof (window as any).ng?.getComponent === 'function');
  test.skip(!hasNg, 'servono gli strumenti di debug di Angular (ng serve)');
  await page.route('**/lexo/data/dictionaryEntryByLexicalEntry*', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"status":500,"error":"Internal Server Error"}' }));
  await page.evaluate(() => {
    const comp = (window as any).ng.getComponent(document.querySelector('app-workspace-lexicon-tile'));
    const id = comp.results.find((n: any) => n.data?.instanceName)?.data.instanceName;
    // piu' chiamate di seguito (come piu' voci in errore): l'avviso deve essere uno solo
    for (let i = 0; i < 3; i++) comp.updateIsDescribedByLexicographicComponent(id);
  });
  // (il tile del lessico ha un suo <p-toast> senza chiave che mostra gli stessi messaggi del <p-toast> del layout: si conta quello del layout)
  const toast = page.locator('app-workspace-layout p-toast').first().locator('.p-toast-message').getByText(/Errore del server|Server error/);
  await expect(toast.first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  expect(await toast.count(), 'un solo avviso, non uno per chiamata').toBe(1);
});

/** Apre la finestra Search "da zero" (chiude quella eventualmente ripristinata dal layout salvato) e fa la ricerca. */
async function openFreshSearch(page: Page, query: string) {
  const old = page.locator('#searchTile .jsPanel-btn-close');
  if (await old.count()) { await old.first().click(); await expect(page.locator('#searchTile')).toHaveCount(0); }
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  await expect(page.locator('#searchTile')).toBeVisible();
  const input = page.locator('#searchTile .pi-search ~ input[pinputtext], #searchTile p-iconfield input[pinputtext]').first();
  await input.fill(query);
  await input.press('Enter');
  await expect(page.locator('#searchTile tbody tr').nth(9)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
}

test('regressione: finestra Search - dimensione iniziale: 10 risultati senza ridimensionare, larga almeno 1000px', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await openSmokeWorkspace(page, baseURL!);
  await openFreshSearch(page, 'amore');
  const m = await page.evaluate(() => {
    const panel = document.querySelector('#searchTile')!.getBoundingClientRect();
    const sc = document.querySelector('#searchTile .p-datatable-table-container')!;
    const container = document.querySelector('#panelsContainer')!.getBoundingClientRect();
    return { w: Math.round(panel.width), h: Math.round(panel.height), top: Math.round(panel.top), bottom: Math.round(panel.bottom), containerBottom: Math.round(container.bottom),
      overflow: sc.scrollHeight - sc.clientHeight, rows: document.querySelectorAll('#searchTile tbody tr').length };
  });
  expect(m.rows).toBe(10);
  expect(m.w, 'larghezza iniziale').toBeGreaterThanOrEqual(1000);
  expect(m.h, 'altezza iniziale').toBeGreaterThanOrEqual(700);
  expect(m.overflow, 'le 10 righe devono entrare senza scorrere').toBeLessThanOrEqual(1);
  expect(m.bottom, 'la finestra sta dentro lo spazio del workspace').toBeLessThanOrEqual(m.containerBottom);
});

test('regressione: finestra Search - su uno schermo piccolo resta dentro lo spazio disponibile', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).waitFor();
  const old = page.locator('#searchTile .jsPanel-btn-close');
  if (await old.count()) { await old.first().click(); await expect(page.locator('#searchTile')).toHaveCount(0); }
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  await expect(page.locator('#searchTile')).toBeVisible();
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => {
    const panel = document.querySelector('#searchTile')!.getBoundingClientRect();
    const container = document.querySelector('#panelsContainer')!.getBoundingClientRect();
    return { h: Math.round(panel.height), w: Math.round(panel.width), bottom: Math.round(panel.bottom), right: Math.round(panel.right), cb: Math.round(container.bottom), cr: Math.round(container.right) };
  });
  expect(m.h, 'altezza limitata allo spazio disponibile').toBeLessThan(705);
  expect(m.bottom, 'sotto non esce dallo spazio').toBeLessThanOrEqual(m.cb);
  expect(m.right, 'a destra non esce dallo spazio').toBeLessThanOrEqual(m.cr);
});

test('regressione: Lexicon Editor aperto da una forma o da un senso - espandere l\'altro ramo non svuota quello gia\' aperto', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  await openSmokeWorkspace(page, baseURL!);
  // chiude gli editor eventualmente ripristinati dal layout salvato
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (x.querySelector?.('app-workspace-lexicon-edit-tile')) x.close(); } });
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  const tile = page.locator('#lexiconTile');
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await tile.locator('#searchInput').fill('brigata'); await page.waitForTimeout(2500);
  await tile.locator('tr', { hasText: 'brigata@it' }).first().locator('button').first().click();
  const root = (re: RegExp) => tile.locator('tr', { hasText: re }).first();
  await expect(root(/^\s*form \(\d+\)/)).toBeVisible({ timeout: 15_000 });
  const edRows = (ed: any) => ed.locator('p-treetable tbody tr, p-treeTable tbody tr');
  const rowsText = async (ed: any) => (await edRows(ed).allInnerTexts()).map((t: string) => t.replace(/\s+/g, ' ').trim());

  // Difetto visto: aprendo l'editor da una forma e poi espandendo "sense", le forme sparivano e comparivano le righe
  // segnaposto "No definition provided": l'albero arrivava gia' caricato e veniva sovrascritto dal segnaposto.
  // 1) da una FORMA, poi si espande "sense"
  await root(/^\s*form \(\d+\)/).locator('button').first().click();
  await page.waitForTimeout(1500);
  await tile.locator('tr', { hasText: /^\s*brigate\b/ }).first().dblclick();
  let ed = page.locator('.jsPanel').filter({ has: page.locator('app-workspace-lexicon-edit-tile') }).last();
  await expect(ed).toBeVisible({ timeout: 30_000 });
  await expect(edRows(ed).filter({ hasText: /^\s*brigate\b/ })).toHaveCount(1, { timeout: 15_000 });
  await edRows(ed).filter({ hasText: /^\s*sense \(\d+\)/ }).first().locator('button').first().click();
  await page.waitForTimeout(2500);
  let rows = await rowsText(ed);
  expect(rows.filter(r => /^brigate\b/.test(r)), 'le forme restano visibili dopo aver espanso sense').toHaveLength(1);
  expect(rows.filter(r => /^brigata\b(?! noun)/.test(r)), 'la forma "brigata" resta visibile').toHaveLength(1);
  expect(rows.some(r => /No definition provided|Nessuna definizione/i.test(r)), 'nessun segnaposto al posto delle forme').toBe(false);
  await ed.locator('.jsPanel-btn-close').click();

  // 2) da un SENSO, poi si espande "form"
  await root(/^\s*sense \(\d+\)/).locator('button').first().click();
  await page.waitForTimeout(1500);
  const senseRow = tile.locator('tr', { hasText: /^\s*sense \(\d+\)/ }).first().locator('xpath=following-sibling::tr[1]');
  await senseRow.dblclick();
  ed = page.locator('.jsPanel').filter({ has: page.locator('app-workspace-lexicon-edit-tile') }).last();
  await expect(ed).toBeVisible({ timeout: 30_000 });
  const senseCount = Number(((await rowsText(ed)).find(r => /^sense \(\d+\)/.test(r)) ?? '').match(/\((\d+)\)/)?.[1] ?? 0);
  await expect(edRows(ed).nth(3), 'i sensi sono elencati').toBeVisible({ timeout: 15_000 });
  await edRows(ed).filter({ hasText: /^\s*form \(\d+\)/ }).first().locator('button').first().click();
  await page.waitForTimeout(2500);
  rows = await rowsText(ed);
  const senseIdx = rows.findIndex(r => /^sense \(\d+\)/.test(r));
  expect(rows.length - 1 - senseIdx, 'i sensi restano visibili dopo aver espanso form').toBe(senseCount);
  expect(rows.some(r => /No definition provided|Nessuna definizione/i.test(r)), 'nessun segnaposto al posto dei sensi').toBe(false);
});

/**
 * Le risposte di `layer/{id}/features` con il tagset "Tipo lessicale" (25364628) che ha come valore predefinito "Parola monorematica"
 * (25364633), come quando e' impostato dalla pagina dei tagset: cosi' il test non dipende da cosa c'e' nei dati della VM.
 */
async function mockTipoLessicaleDefault(page: Page, defaultItem: { id: number } | null = { id: 25364633 }) {
  await page.route(/\/texto\/layer\/\d+\/features$/, async (route) => {
    const response = await route.fetch();
    if (response.status() !== 200) { return route.fulfill({ response }); }
    const features = (await response.json()) as any[];
    for (const f of features) { if (f.tagset?.id === 25364628) f.tagset.defaultItem = defaultItem; }
    return route.fulfill({ response, json: features });
  });
}

test('regressione: annotazione semantica nuova - il valore predefinito del tagset e\' preselezionato (Tipo lessicale = Parola monorematica)', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(240_000);
  await blockWrites(page, testInfo);
  await mockTipoLessicaleDefault(page); // non si salva nulla: si apre solo l'editor e si guarda il campo
  await openSmokeWorkspace(page, baseURL!);
  // finestra Search "da zero" (quella ripristinata dal layout salvato puo' avere ricerche e filtri precedenti)
  const oldSearch = page.locator('#searchTile .jsPanel-btn-close');
  if (await oldSearch.count()) { await oldSearch.first().click(); await expect(page.locator('#searchTile')).toHaveCount(0); }
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const tile = page.locator('#searchTile');
  await expect(tile).toBeVisible();
  await page.waitForTimeout(1500);
  // livello Semantica (il secondo select e' "Layer"), poi la ricerca
  await tile.locator('p-select').filter({ hasText: /Layer/ }).first().click();
  await page.locator('.p-select-option').filter({ hasText: /^\s*Semantica\s*$/ }).first().click();
  const input = tile.locator('p-iconfield input[pinputtext]').first();
  await input.fill('paura'); await input.press('Enter');
  await expect(tile.locator('tbody tr').nth(1)).toBeVisible({ timeout: 90_000 });
  await tile.locator('thead .p-checkbox').first().click();
  await tile.locator('p-splitbutton button').first().click(); // "Annota": crea nuove annotazioni
  const dialog = page.locator('.p-dialog').filter({ visible: true }).first();
  const field = dialog.locator('p-select').filter({ hasText: /Parola monorematica|Select a value|Seleziona/ }).first();
  await expect(field).toBeVisible({ timeout: 15_000 });
  // (il testo del campo "Tipo lessicale" e' l'opzione preselezionata)
  await expect(dialog.locator('p-select').filter({ hasText: 'Parola monorematica' }), 'Tipo lessicale preselezionato').toHaveCount(1, { timeout: 15_000 });
  // resta modificabile: si puo' svuotare
  await dialog.locator('p-select').filter({ hasText: 'Parola monorematica' }).locator('.p-select-clear-icon').click();
  await expect(dialog.locator('p-select').filter({ hasText: 'Parola monorematica' })).toHaveCount(0);
  await snap(page, 'r16-annotazione-default');
});

async function openSingleAnnotationEditor(page: Page, baseURL: string) {
  await openSmokeWorkspace(page, baseURL);
  for (const id of ['searchTile']) { const c = page.locator(`#${id} .jsPanel-btn-close`); if (await c.count()) { await c.first().click(); } }
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const t = page.locator('#searchTile');
  await expect(t).toBeVisible();
  const input = t.locator('p-iconfield input[pinputtext]').first();
  await input.fill('casa'); await input.press('Enter');
  await expect(t.locator('tbody tr').nth(1)).toBeVisible({ timeout: 30_000 });
  await t.locator('tbody tr').nth(1).dblclick(); // apre la finestra del testo
  const text = page.locator('[id^="textTile_"]').first();
  await expect(text).toBeVisible({ timeout: 30_000 });
  await text.locator('p-select').filter({ hasText: /Select a layer|Seleziona/ }).first().click();
  await page.locator('.p-select-option').filter({ hasText: /^\s*Semantica\s*$/ }).first().click();
  return text.locator('app-text-annotation-editor');
}

test('regressione: annotazione semantica singola (finestra del testo) - il valore predefinito del tagset e\' preselezionato', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await blockWrites(page, testInfo);
  await mockTipoLessicaleDefault(page);
  const editor = await openSingleAnnotationEditor(page, baseURL!);
  await expect(editor.locator('p-select').filter({ hasText: 'Parola monorematica' }), 'Tipo lessicale preselezionato (annotazione nuova)').toHaveCount(1, { timeout: 15_000 });
  await snap(page, 'r17-annotazione-singola-default');
});

test('regressione: annotazione semantica singola - senza valore predefinito nel tagset non si preseleziona nulla', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await blockWrites(page, testInfo);
  await mockTipoLessicaleDefault(page, null);
  const editor = await openSingleAnnotationEditor(page, baseURL!);
  await expect(editor.locator('p-select').first(), 'editor aperto').toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(2000);
  await expect(editor.locator('p-select').filter({ hasText: 'Parola monorematica' }), 'nessuna preselezione senza predefinito').toHaveCount(0);
});

test('regressione: tagset - il valore predefinito si imposta, si cambia, si toglie e sopravvive alla modifica del tagset', async ({ page, baseURL }) => {
  // Scrive davvero sul backend, su un tagset creato dal test e rimosso alla fine. Il backend salva ogni versione del tagset
  // con l'istante al secondo: due modifiche dello stesso tagset nello stesso secondo danno 500 (e il tagset non si puo' piu'
  // modificare). Per questo tra una scrittura e l'altra si aspetta piu' di un secondo.
  test.setTimeout(240_000);
  const PAUSE = 1400;
  const { api, token, base } = await apiLogin(baseURL!);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const call = async (method: string, url: string, data?: unknown) => {
    const r = await api.fetch(`${base}/texto${url}`, { method, headers, data: data as any });
    const text = await r.text();
    return { status: r.status(), json: text.startsWith('{') || text.startsWith('[') ? JSON.parse(text) : text };
  };
  const name = `e2e-default-${Date.now()}`;
  const tagset = (await call('POST', '/tagset/create', { name, description: 'test e2e' })).json;
  const [a, b] = [(await call('POST', '/tagsetItem/create', { name: 'Alfa', tagset: { id: tagset.id } })).json, (await call('POST', '/tagsetItem/create', { name: 'Beta', tagset: { id: tagset.id } })).json];
  const readDefault = async () => (await call('GET', `/tagset/${tagset.id}`)).json.defaultItem?.id ?? null;
  const row = (n: string) => page.locator('p-table tbody tr', { hasText: n });
  try {
    await uiLogin(page);
    await page.goto(`#/tagsets/${tagset.id}`);
    await expect(row('Alfa')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#tagset-default-value'), 'nessun predefinito all\'inizio').toHaveText('–');

    await page.waitForTimeout(PAUSE);
    await row('Alfa').locator('button.default-toggle').click();
    await expect(page.locator('#tagset-default-value')).toHaveText('Alfa', { timeout: 15_000 });
    await expect(row('Alfa').locator('button.default-toggle')).toHaveAttribute('aria-pressed', 'true');
    expect(await readDefault(), 'impostato sul backend').toBe(a.id);

    await page.waitForTimeout(PAUSE);
    await row('Beta').locator('button.default-toggle').click();
    await expect(page.locator('#tagset-default-value')).toHaveText('Beta', { timeout: 15_000 });
    await expect(row('Alfa').locator('button.default-toggle')).toHaveAttribute('aria-pressed', 'false');
    expect(await readDefault(), 'cambiato sul backend').toBe(b.id);
    await snap(page, 'r-tagset-default');

    // la modifica di nome e descrizione dalla lista non lo toglie
    await page.waitForTimeout(PAUSE);
    await page.goto('#/tagsets');
    const listRow = page.locator('p-table tbody tr', { hasText: name });
    await expect(page.locator('p-table tbody tr').first()).toBeVisible({ timeout: 30_000 });
    await page.locator('.p-paginator-last').click(); // la lista e' paginata e il tagset nuovo e' l'ultimo
    await expect(listRow).toBeVisible({ timeout: 15_000 });
    await listRow.locator('button[aria-label="Edit tagset"]').click();
    const dialog = page.locator('.p-dialog').filter({ visible: true });
    await dialog.locator('#description').fill('descrizione modificata');
    await page.waitForTimeout(PAUSE);
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).toHaveCount(0, { timeout: 15_000 });
    await expect.poll(async () => (await call('GET', `/tagset/${tagset.id}`)).json.description, { timeout: 15_000 }).toBe('descrizione modificata');
    expect(await readDefault(), 'il predefinito resta dopo la modifica del tagset').toBe(b.id);

    // un clic sul predefinito lo toglie
    await page.goto(`#/tagsets/${tagset.id}`);
    await expect(row('Beta').locator('button.default-toggle')).toHaveAttribute('aria-pressed', 'true', { timeout: 30_000 });
    await page.waitForTimeout(PAUSE);
    await row('Beta').locator('button.default-toggle').click();
    await expect(page.locator('#tagset-default-value')).toHaveText('–', { timeout: 15_000 });
    expect(await readDefault(), 'tolto sul backend').toBeNull();

    // cancellare il valore predefinito: il backend lo rifiuta, la pagina prima toglie il predefinito
    await page.waitForTimeout(PAUSE);
    await row('Alfa').locator('button.default-toggle').click();
    await expect(page.locator('#tagset-default-value')).toHaveText('Alfa', { timeout: 15_000 });
    await page.waitForTimeout(PAUSE);
    await row('Alfa').locator('button[aria-label="Delete tagset item"]').click();
    await expect(page.locator('.swal2-popup'), 'l\'avviso dice che il predefinito viene tolto').toContainText(/predefinito|default/i);
    await page.locator('.swal2-confirm').click();
    await expect(row('Alfa')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator('#tagset-default-value')).toHaveText('–');
    expect(await readDefault(), 'predefinito tolto insieme al valore').toBeNull();
    expect((await call('GET', `/tagset/${tagset.id}/items`)).json.map((i: any) => i.name)).toEqual(['Beta']);
  } finally {
    // pulizia (con le pause: lo storico del tagset non regge due scritture nello stesso secondo)
    for (const step of [
      async () => call('POST', '/tagset/update', { id: tagset.id, name, description: 'x', defaultItem: null }),
      async () => call('DELETE', `/tagsetItem/${a.id}/remove`),
      async () => call('DELETE', `/tagsetItem/${b.id}/remove`),
      async () => call('DELETE', `/tagset/${tagset.id}/remove`),
    ]) { await new Promise((r) => setTimeout(r, PAUSE)); await step().catch(() => undefined); } // setTimeout: dopo un timeout del test page.waitForTimeout non funziona piu'
  }
});

test('regressione: Layer - nuovo layer con colore gia\' scelto, Add sempre coerente e un errore del backend non rompe la lista', async ({ page, baseURL }, testInfo) => {
  // Difetti visti: (1) il selettore mostrava un colore ma il campo era vuoto e Add restava spento senza dire perche';
  // (2) alla riapertura della finestra Add era acceso con nome e colore vuoti (setValidators sostituiva `required`) e il backend
  // rispondeva 500; (3) l'errore terminava lo stream della lista (console: "ERROR Error: [object Object]") e la lista non si
  // aggiornava piu'. Le scritture sono finte (`/texto/layer/create` risponde 500 o 200 a comando): non si crea nulla.
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' && /Error: \[object Object\]/.test(m.text())) errors.push(m.text()); });
  const created: any[] = [];
  let answer500 = true;
  await page.route(/\/texto\/layer\/create$/, async (route) => {
    created.push(JSON.parse(route.request().postData() ?? '{}'));
    if (answer500) return route.fulfill({ status: 500, json: { status: 500, error: 'Internal Server Error' } });
    return route.fulfill({ json: { id: 999999, ...created[created.length - 1] } });
  });
  await uiLogin(page);
  await page.goto('#/layers');
  await expect(page.locator('p-table tbody tr').first()).toBeVisible({ timeout: 30_000 });
  const dlg = page.locator('.p-dialog').filter({ visible: true });
  const add = dlg.locator('button[type="submit"]');
  const component = () => page.evaluate(() => { const c = (window as any).ng?.getComponent(document.querySelector('app-layers-list')); return c ? { color: c.color.value, valid: c.tlayerForm.valid } : null; });

  // prima apertura: il colore mostrato e' il colore del campo, basta il nome
  await page.getByRole('button', { name: /New layer/i }).click();
  await expect(add).toBeDisabled();
  const first = await component();
  if (first) expect(first.color, 'il campo colore ha gia\' un colore libero').toMatch(/^#[0-9a-f]{6}$/);
  await dlg.locator('input[formControlName="name"]').fill('e2e-layer-prova');
  await expect(add, 'nome scritto: Add acceso').toBeEnabled();

  // chiudo e riapro: nome vuoto -> Add spento (prima: acceso)
  await dlg.locator('button.btn-secondary').click();
  await page.getByRole('button', { name: /New layer/i }).click();
  await expect(add, 'senza nome Add resta spento anche alla riapertura').toBeDisabled();
  await dlg.locator('input[formControlName="name"]').fill('   ');
  await expect(add, 'solo spazi: Add spento').toBeDisabled();
  await dlg.locator('input[formControlName="name"]').fill('e2e-layer-prova');
  await expect(add).toBeEnabled();

  // il backend risponde 500: avviso con il motivo (non "undefined"), nessun errore in console, la finestra e' chiusa
  await add.click();
  await expect(page.locator('.p-toast-message').filter({ hasText: /failed/i }).first()).toContainText(/server error 500/, { timeout: 15_000 });
  expect(created.length).toBe(1);
  expect(created[0].color, 'il colore inviato non e\' vuoto').toMatch(/^#[0-9a-f]{6}$/);
  expect(errors, 'nessun "ERROR Error: [object Object]"').toEqual([]);

  // la lista e' ancora viva: un secondo tentativo (ora il backend risponde) parte e aggiorna la lista
  answer500 = false;
  await page.getByRole('button', { name: /New layer/i }).click();
  await dlg.locator('input[formControlName="name"]').fill('e2e-layer-prova');
  await add.click();
  await expect.poll(() => created.length, { timeout: 15_000 }).toBe(2);
  await expect(page.locator('.p-toast-message').filter({ hasText: /added/i }).first()).toBeVisible({ timeout: 15_000 });
  expect(errors).toEqual([]);
  testInfo.annotations.push({ type: 'richieste', description: JSON.stringify(created) });
});

test('regressione: finestre "nuovo" di tagset, workspace e valori del tagset - Add resta spento senza nome anche alla riapertura', async ({ page }) => {
  // stesso difetto del nuovo layer: setValidators sostituiva `required` e gli spazi, e alla seconda apertura Add era acceso
  test.setTimeout(120_000);
  await uiLogin(page);
  const dlg = page.locator('.p-dialog').filter({ visible: true });
  const add = dlg.locator('button[type="submit"]');
  const nameInput = dlg.locator('input[type="text"]').first();
  const check = async (what: string, open: () => Promise<void>) => {
    for (const round of ['prima apertura', 'riapertura']) {
      await open();
      await expect(add, `${what}: ${round}, senza nome`).toBeDisabled();
      await nameInput.fill('   ');
      await expect(add, `${what}: ${round}, solo spazi`).toBeDisabled();
      await nameInput.fill('nome-prova');
      await expect(add, `${what}: ${round}, con nome`).toBeEnabled();
      await dlg.locator('button.btn-secondary').click();
      await expect(dlg).toHaveCount(0);
    }
  };
  await page.goto('#/tagsets');
  await expect(page.locator('p-table tbody tr').first()).toBeVisible({ timeout: 30_000 });
  await check('nuovo tagset', async () => { await page.locator('button[aria-label="New tagset"]').click(); });
  await page.goto('#/workspaces');
  await expect(page.locator('p-table tbody tr').first()).toBeVisible({ timeout: 30_000 });
  await check('nuovo workspace', async () => { await page.getByRole('button', { name: /New workspace/i }).click(); });
  await page.goto('#/tagsets/25364628');
  await expect(page.locator('p-table tbody tr').first()).toBeVisible({ timeout: 30_000 });
  await check('nuovo valore del tagset', async () => { await page.locator('button[aria-label="New value"]').click(); });
});

test('regressione: finestre "modifica" di layer, feature, tagset, valore del tagset e workspace - Update acceso con il nome invariato', async ({ page }) => {
  // il controllo dei nomi doppi non deve contare il nome dell'elemento che si sta modificando; si apre e si annulla, non si salva
  test.setTimeout(120_000);
  await uiLogin(page);
  const dlg = page.locator('.p-dialog').filter({ visible: true });
  const pages: Array<[string, string]> = [['#/layers', 'layer'], ['#/layers/20077428', 'feature'], ['#/tagsets', 'tagset'], ['#/tagsets/25364628', 'valore del tagset'], ['#/workspaces', 'workspace']];
  for (const [hash, what] of pages) {
    await page.goto(hash);
    const edit = page.locator('p-table tbody tr button.p-button-success').first();
    await expect(edit, what).toBeVisible({ timeout: 30_000 });
    await edit.click();
    const submit = dlg.locator('button[type="submit"]');
    await expect(submit, `${what}: Update acceso con il nome invariato`).toBeEnabled({ timeout: 10_000 });
    await expect(dlg.locator('.invalid-feedback'), `${what}: nessun errore di nome doppio`).toHaveCount(0);
    await dlg.locator('button.btn-secondary').click();
    await expect(dlg).toHaveCount(0);
  }
});

test('regressione: finestra di dialogo chiusa durante il trascinamento - la selezione del testo non resta spenta', async ({ page, baseURL }, testInfo) => {
  // Difetto visto: il p-dialog mette user-select:none sul body mentre si trascina e lo toglie al rilascio; se si chiude prima del
  // rilascio resta cosi' e nella finestra del testo non si seleziona piu' nulla (doppio clic e trascinamento) fino a un F5.
  // Lo stato si ricrea a mano; al primo rilascio del mouse la pagina deve tornare a posto.
  test.setTimeout(180_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (/textTile_|searchTile/.test(x.id)) x.close(); } });
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  await page.locator('#searchTile p-select').filter({ hasText: /Layer/ }).first().click();
  await page.locator('.p-select-option').filter({ hasText: /^\s*Semantica\s*$/ }).first().click();
  const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
  await input.fill('isposa'); await input.press('Enter');
  await expect(page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile.locator('#gText tspan tspan').first()).toBeAttached({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  const bodyState = () => page.evaluate(() => ({ style: document.body.style.userSelect, attr: document.body.getAttribute('data-p-unselectable-text'), computed: getComputedStyle(document.body).userSelect }));
  const pickWord = (skip: number) => tile.evaluate((e, k) => {
    const box = e.querySelector('.text-container')!.getBoundingClientRect();
    const highs = [...e.querySelectorAll('svg rect[id^="h-"]')].map((r) => r.getBoundingClientRect());
    const ws = [...e.querySelectorAll('#gText tspan tspan')].filter((t) => { const b = t.getBoundingClientRect(); return (t.textContent ?? '').trim().length >= 5 && b.top > box.top + 20 && b.bottom < box.bottom - 20 && b.left > box.left + 40 && b.right < box.right - 5 && !highs.some((h) => b.left < h.right && b.right > h.left && b.top < h.bottom && b.bottom > h.top); });
    const w = ws[k]; const n = w.firstChild as Text; const r = document.createRange(); r.setStart(n, 1); r.setEnd(n, 3); const b = r.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, word: (w.textContent ?? '').trim().replace(/[,.;:]$/, '') };
  }, skip);
  const editorText = () => tile.locator('app-text-annotation-editor input').nth(1).inputValue().catch(() => '');

  // situazione di partenza: la selezione funziona
  const first = await pickWord(0);
  await page.mouse.dblclick(first.x, first.y);
  await expect.poll(editorText, { timeout: 10_000 }).toBe(first.word);

  // stato lasciato dal dialog: selezione spenta in tutta la pagina
  await page.evaluate(() => { document.body.setAttribute('data-p-unselectable-text', 'true'); document.body.style.userSelect = 'none'; });
  expect((await bodyState()).computed).toBe('none');
  const blank = await tile.locator('.text-container').boundingBox();
  await page.mouse.click(blank!.x + blank!.width - 6, blank!.y + 60); // un clic qualunque: al rilascio la pagina torna a posto
  await expect.poll(bodyState, { timeout: 5_000 }).toEqual({ style: '', attr: null, computed: 'auto' });

  // e la selezione funziona di nuovo
  const second = await pickWord(3);
  await page.mouse.dblclick(second.x, second.y);
  await expect.poll(editorText, { timeout: 10_000 }).toBe(second.word);
});

test('regressione: Text - i ritorni a capo dentro le righe non arrivano al disegno (Firefox impaginava il testo due volte)', async ({ page, baseURL }, testInfo) => {
  // Difetto visto in Firefox (anche in Angular 14): le righe del testo contengono ritorni a capo ("’ntelletto:\nné"); Chromium li
  // disegna come uno spazio, Firefox spezza davvero la riga nel testo SVG e il resto finisce sopra le righe precedenti. Si disegnano
  // come spazio (un carattere per un carattere: gli offset non cambiano). Qui si controlla il DOM, che e' uguale in tutti i browser.
  test.setTimeout(150_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (/textTile_|searchTile/.test(x.id)) x.close(); } });
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
  await input.fill('’ntelletto'); await input.press('Enter');
  const row = page.locator('#searchTile tbody tr', { hasText: 'I.Concl.19' }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await row.dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile.locator('#gText tspan tspan', { hasText: 'veggio' }).first()).toBeAttached({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  const r = await tile.evaluate((e) => {
    const lines = [...e.querySelectorAll('#gText > text > tspan')];
    const bad = lines.filter((l) => /[\r\n\u2028\u2029]/.test(l.textContent ?? ''));
    const words = [...e.querySelectorAll('#gText tspan tspan')].map((w) => w.textContent ?? '');
    return { lines: lines.length, bad: bad.map((l) => JSON.stringify((l.textContent ?? '').slice(0, 50))).slice(0, 3), joined: words.join('').includes('’ntelletto: né') };
  });
  expect(r.lines).toBeGreaterThan(5);
  expect(r.bad, 'nessuna parola disegnata contiene un ritorno a capo').toEqual([]);
  expect(r.joined, 'il testo "’ntelletto: né" e\' disegnato con uno spazio').toBe(true);
});

/** Chiude (se aperti) i pannelli indicati, cosi' si riaprono con le dimensioni di default e non con quelle del layout salvato. */
async function closePanels(page: Page, ids: string[]) {
  await page.evaluate((list) => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) if (list.includes(x.id) || list.some((i: string) => x.id.startsWith(i))) x.close(); }, ids);
  await page.waitForTimeout(500);
}

test('regressione: dimensioni di apertura - explorer >= 350px, Lexicon Editor >= 800px, splitter 300px, tooltip del senso', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['lexiconTile', 'dictionaryTile', 'lexiconEditTile']);
  for (const m of ['Lexicon', 'Dictionary']) { await page.locator('#workspace-menu').first().getByText(m, { exact: true }).click(); await page.waitForTimeout(1500); }
  const w = async (sel: string) => Math.round((await page.locator(sel).boundingBox())!.width);
  const lex = await w('#lexiconTile'), dict = await w('#dictionaryTile');
  testInfo.annotations.push({ type: 'larghezze', description: JSON.stringify({ lex, dict }) });
  expect(lex, 'Lexicon Explorer: larghezza di apertura').toBeGreaterThanOrEqual(350);
  expect(dict, 'Dictionary Explorer: larghezza di apertura').toBeGreaterThanOrEqual(350);

  await page.locator('#workspace-menu').first().getByText('Lexicon', { exact: true }).click(); // in primo piano (le due finestre si aprono nello stesso punto)
  const tile = page.locator('#lexiconTile');
  await tile.locator('#searchInput').fill('brigata'); await page.waitForTimeout(2500);
  await tile.locator('tr', { hasText: 'brigata@it' }).first().dblclick();
  const ed = page.locator('.jsPanel').filter({ has: page.locator('app-workspace-lexicon-edit-tile') }).last();
  await expect(ed).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  expect((await ed.boundingBox())!.width, 'Lexicon Editor: larghezza di apertura').toBeGreaterThanOrEqual(799);
  const split = await ed.evaluate((e) => parseFloat(getComputedStyle(e.querySelector('.p-splitterpanel:first-of-type')!).minWidth));
  expect(split, 'larghezza minima del pannello di sinistra (albero)').toBe(300);

  // tooltip con la definizione intera del senso, passando col mouse sul senso nell'albero
  await ed.locator('tr', { hasText: /^\s*sense \(\d+\)/ }).first().locator('button').first().click();
  const sense = ed.locator('tr', { hasText: /Gruppo di persone che si raduna/ }).first();
  await expect(sense).toBeVisible({ timeout: 15_000 });
  await sense.locator('.name-cell span').first().hover();
  const tip = page.locator('.p-tooltip.sense-definition-tooltip');
  await expect(tip, 'tooltip con la definizione intera').toContainText('gruppo legato da vincolo amicale', { timeout: 10_000 });
  await snap(page, 'r18-lexicon-editor-tooltip');
});

test('regressione: Dictionary Editor, scheda Ordinamento - la card occupa tutto lo spazio', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await openSmokeWorkspace(page, baseURL!);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const row = page.locator('#dictionaryTile tbody tr').filter({ hasText: /\w/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  const tabs = editor.locator('[role="tab"]');
  await expect(tabs.nth(1)).toBeVisible({ timeout: 30_000 });
  await tabs.nth(1).click();
  await expect(editor.locator('app-dictionary-sorting-editor .card')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1000);
  const m = await editor.evaluate((e) => {
    const panel = e.querySelector('p-tabpanel[data-p-active="true"]')!.getBoundingClientRect();
    const card = e.querySelector('app-dictionary-sorting-editor .card')!.getBoundingClientRect();
    const buttons = e.querySelector('app-dictionary-sorting-editor .sorting-button')!.getBoundingClientRect();
    return { panel: Math.round(panel.height), card: Math.round(card.height), buttonsBottom: Math.round(buttons.bottom), panelBottom: Math.round(panel.bottom) };
  });
  testInfo.annotations.push({ type: 'altezze', description: JSON.stringify(m) });
  expect(m.card, 'la card riempie il pannello della scheda').toBeGreaterThanOrEqual(m.panel - 4);
  expect(m.buttonsBottom, 'Save/Restore in fondo al pannello').toBeGreaterThanOrEqual(m.panelBottom - 20);
});

test('regressione: Dictionary Editor, scheda Ordinamento - l\'albero dei sensi non e\' tagliato (voce "sonare")', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['dictionaryEditTile']);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  const filter = tile.locator('input[type="text"]').first();
  await filter.fill('sonare'); await filter.press('Enter');
  const row = tile.locator('tbody tr', { hasText: /^\s*sonare/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  await expect(editor.locator('[role="tab"]').nth(1)).toBeEnabled({ timeout: 30_000 });
  await editor.locator('[role="tab"]').nth(1).click();
  // Difetto visto: la lista interna del p-orderlist aveva un'altezza massima di 14rem (scrollHeight di default): con
  // molti sensi l'albero restava tagliato dopo ~180px anche se la card era alta tutto il pannello.
  const last = editor.locator('app-dictionary-sorting-editor').getByText('Colpire, picchiare', { exact: false });
  await expect(last, 'ultimo senso di "sonare" visibile senza scorrere').toBeInViewport({ ratio: 1, timeout: 20_000 });
});

test('regressione: voce del dizionario - la lista delle opere si chiede una sola volta (non una per riga)', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['dictionaryEditTile']);
  const calls: Record<string, number> = {};
  page.on('request', (r) => { const m = r.url().match(/\/lexo\/dictionary\/(otherDocuments|authorDocuments)/); if (m) calls[m[1]] = (calls[m[1]] || 0) + 1; });
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  const filter = tile.locator('input[type="text"]').first();
  await filter.fill('amore'); await filter.press('Enter');
  const row = tile.locator('tbody tr', { hasText: /^\s*amore\s*noun\s*$/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick(); // scheda della voce: una riga "occ. in altre opere" per ogni opera (19 per "amore")
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  await expect(editor.locator('app-dropdown-plus-number').nth(5), 'righe delle altre opere').toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  await editor.locator('[role="tab"]').nth(2).click(); // anteprima: legge le stesse opere per le etichette
  await expect(editor.locator('app-dictionary-preview p-fieldset').filter({ hasText: /Filostrato: 239/ })).toBeVisible({ timeout: 30_000 });
  testInfo.annotations.push({ type: 'richieste', description: JSON.stringify(calls) });
  expect(calls['otherDocuments'] ?? 0, 'otherDocuments: una sola richiesta').toBeLessThanOrEqual(1);
  expect(calls['authorDocuments'] ?? 0, 'authorDocuments: una sola richiesta').toBeLessThanOrEqual(1);
});

test('regressione: anteprima - i contesti dei sottosensi non si perdono se arrivano prima di quelli del senso padre', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['dictionaryEditTile']);
  // Difetto visto: le richieste dei contesti (una per senso) partono tutte insieme; se la risposta di un sottosenso (1.1, 1.2)
  // arrivava prima di quella del senso padre (1), la risposta del padre rimetteva i vecchi figli e cancellava le tabelle
  // gia' inserite (ricomparivano solo chiudendo e riaprendo il nodo). Per renderlo deterministico la PRIMA risposta (il
  // senso di primo livello, che e' il primo ad essere richiesto) viene ritardata.
  let n = 0;
  await page.route('**/texto/util/ais', async (route) => {
    if (n++ === 0) await new Promise((r) => setTimeout(r, 3000));
    await route.fallback();
  });
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  const filter = tile.locator('input[type="text"]').first();
  await filter.fill('sentire'); await filter.press('Enter');
  const row = tile.locator('tbody tr', { hasText: /^\s*sentire\s*verb\s*$/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  await expect(editor.locator('[role="tab"]').nth(2)).toBeVisible({ timeout: 30_000 });
  await editor.locator('[role="tab"]').nth(2).click();
  const preview = editor.locator('app-dictionary-preview');
  // ogni senso (con o senza occorrenze) ha la sua tabella dei contesti
  const meanings = preview.locator('p-tree .p-tree-node-content').filter({ has: page.locator('b') });
  await expect(meanings.nth(10), 'i sensi di "sentire"').toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => await preview.locator('.custom-leaf p-table').count(), { timeout: 30_000, message: 'una tabella per ogni senso' })
    .toBe(await meanings.count());
  testInfo.annotations.push({ type: 'sensi', description: `${await meanings.count()} sensi, ${await preview.locator('.custom-leaf p-table').count()} tabelle` });
});

test('regressione: anteprima - doppio clic su un contesto apre il testo alla riga, col layer semantico attivo', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['dictionaryEditTile', 'textTile_123']);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  const filter = tile.locator('input[type="text"]').first();
  await filter.fill('sonare'); await filter.press('Enter');
  const row = tile.locator('tbody tr', { hasText: /^\s*sonare/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  await expect(editor.locator('[role="tab"]').nth(2)).toBeVisible({ timeout: 30_000 });
  await editor.locator('[role="tab"]').nth(2).click();
  const rows = editor.locator('app-dictionary-preview .custom-leaf p-table tbody tr.context-row');
  await expect(rows.first(), 'contesti nell\'anteprima').toBeVisible({ timeout: 30_000 });

  expect(await rows.first().evaluate((e) => getComputedStyle(e).cursor), 'manina sulle righe dei contesti').toBe('pointer');

  const openRow = async (i: number) => {
    const sentence = (await rows.nth(i).locator('td').last().innerText()).trim().slice(0, 25);
    // dispatchEvent: la finestra del testo, una volta aperta, copre l'anteprima
    await rows.nth(i).dispatchEvent('dblclick');
    return sentence;
  };
  const text = page.locator('#textTile_123');
  const first = await openRow(0);
  await expect(text, 'finestra del testo aperta').toBeVisible({ timeout: 30_000 });
  await expect(text.locator('p-multiselect .layer-item-value'), 'layer semantico attivo').toHaveCount(1, { timeout: 30_000 });
  await expect(text.locator('p-multiselect .layer-item-value').first()).toContainText(/semantic/i);
  await expect(text, 'riga del contesto visibile').toContainText(first.slice(0, 12), { timeout: 30_000 });
  // nessuna parola selezionata: e' solo il posizionamento
  await expect(text.locator('#selectionHighlightg rect')).toHaveCount(0);

  // finestra gia' aperta: un altro contesto la riposiziona (altra riga, es. del libro II)
  const n = await rows.count();
  let other = -1;
  for (let i = 1; i < n; i++) { if (!(await rows.nth(i).locator('td').last().innerText()).startsWith(first.slice(0, 12))) { other = i; break; } }
  expect(other, 'serve un secondo contesto').toBeGreaterThan(0);
  const second = await openRow(other);
  await expect(text, 'finestra riposizionata').toContainText(second.slice(0, 12), { timeout: 30_000 });
  testInfo.annotations.push({ type: 'righe', description: `${first} / ${second}` });
});

test('regressione: Lexicon Editor - albero a sinistra: barra di scorrimento verticale quando le liste riempiono la colonna (sonare verb)', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (x.querySelector?.('app-workspace-lexicon-edit-tile')) x.close(); } });
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  const tile = page.locator('#lexiconTile');
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await tile.locator('#searchInput').fill('sonare'); await page.waitForTimeout(2500);
  const sonare = tile.locator('tr', { hasText: 'sonare@it' }).first();
  await expect(sonare, 'voce "sonare" (verb) nel Lexicon').toBeVisible({ timeout: 30_000 });
  await sonare.dblclick();
  const ed = page.locator('.jsPanel').filter({ has: page.locator('app-workspace-lexicon-edit-tile') }).last();
  const rows = ed.locator('p-treetable tbody tr, p-treeTable tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  const metrics = () => ed.evaluate((e) => {
    const tree = e.querySelector('p-treetable, p-treeTable')!;
    const body = tree.querySelector('.p-treetable-scrollable-body') as HTMLElement;
    const column = e.querySelector('.p-splitterpanel') as HTMLElement;
    return { column: column.clientHeight, body: body.clientHeight, content: body.scrollHeight, overflowY: getComputedStyle(body).overflowY };
  });
  // "sonare verb" ha 12 forme e 7 sensi: espansi riempiono piu' della colonna
  for (const re of [/^\s*form \(\d+\)/, /^\s*sense \(\d+\)/]) {
    await rows.filter({ hasText: re }).first().locator('button').first().click();
    await page.waitForTimeout(2000);
  }
  // Difetto visto: l'altezza dell'albero (scrollHeight di PrimeNG) era "-40px" (il componente e' inline: clientHeight 0);
  // l'albero cresceva col contenuto e la colonna (overflow hidden) lo tagliava senza barra di scorrimento verticale.
  let m = await metrics();
  testInfo.annotations.push({ type: 'albero', description: JSON.stringify(m) });
  expect(m.content, 'le liste sono piu\' alte della colonna').toBeGreaterThan(m.column);
  expect(m.body, 'l\'albero non e\' piu\' alto della colonna').toBeLessThanOrEqual(m.column);
  expect(m.body, 'l\'albero riempie la colonna').toBeGreaterThanOrEqual(m.column - 2);
  expect(m.overflowY).toMatch(/auto|scroll/);
  await ed.screenshot({ path: testInfo.outputPath('lexed-scroll.png') });
  // si arriva all'ultima riga scorrendo
  const lastVisible = await ed.evaluate((e) => {
    const body = e.querySelector('.p-treetable-scrollable-body') as HTMLElement;
    const col = e.querySelector('.p-splitterpanel') as HTMLElement;
    body.scrollTop = body.scrollHeight;
    const rowsEl = e.querySelectorAll('p-treetable tbody tr, p-treeTable tbody tr');
    const last = rowsEl[rowsEl.length - 1].getBoundingClientRect();
    return last.bottom <= col.getBoundingClientRect().bottom + 1;
  });
  expect(lastVisible, 'ultima riga raggiungibile scorrendo').toBe(true);
  // ridimensionando il pannello l'albero segue la colonna
  await ed.evaluate((e) => { (e as HTMLElement).style.height = '400px'; });
  await page.waitForTimeout(800);
  m = await metrics();
  expect(m.column, 'colonna ridotta').toBeLessThan(450);
  expect(m.body, 'l\'albero segue la colonna ridotta').toBeLessThanOrEqual(m.column);
  expect(m.body).toBeGreaterThanOrEqual(m.column - 2);
});

test('regressione: Lexicon/Dictionary Explorer - con poche voci le righe non si allungano per riempire il tile', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['lexiconTile', 'dictionaryTile']);
  // Difetto visto (PrimeNG 20+): il contenuto del virtual scroll e' una <table> con min-height 100% (CSS di p-scroller):
  // con poche voci la tabella si allungava e le righe si dividevano lo spazio (88px invece di 40px).
  const heights = (tileId: string) => page.locator('#' + tileId).evaluate((e) =>
    [...e.querySelectorAll('p-treetable tbody tr, p-treeTable tbody tr')].map(r => Math.round(r.getBoundingClientRect().height)));
  const space = (tileId: string) => page.locator('#' + tileId).evaluate((e) => {
    const body = e.querySelector('.p-treetable-scrollable-body') as HTMLElement;
    const rows = [...e.querySelectorAll('p-treetable tbody tr, p-treeTable tbody tr')];
    return { body: Math.round(body.getBoundingClientRect().height), rows: Math.round(rows.reduce((a, r) => a + r.getBoundingClientRect().height, 0)) };
  });
  const check = async (tileId: string, label: string) => {
    await expect.poll(async () => { const h = await heights(tileId); return h.length > 0 && h.length <= 6; }, { timeout: 30_000, message: label + ': elenco filtrato' }).toBe(true);
    const h = await heights(tileId);
    const sp = await space(tileId);
    testInfo.annotations.push({ type: label, description: JSON.stringify({ h, sp }) });
    expect(Math.max(...h), label + ': righe alte come quando l\'elenco e\' lungo').toBeLessThanOrEqual(50);
    expect(sp.rows, label + ': resta spazio bianco sotto le righe').toBeLessThan(sp.body - 20);
  };
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  const lex = page.locator('#lexiconTile');
  await expect(lex).toBeVisible({ timeout: 30_000 });
  await lex.locator('#searchInput').fill('sonag'); await lex.locator('#searchInput').press('Enter');
  await check('lexiconTile', 'Lexicon Explorer');
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const dic = page.locator('#dictionaryTile');
  await expect(dic).toBeVisible({ timeout: 30_000 });
  const filter = dic.locator('input[type="text"]').first();
  await filter.fill('sonar'); await filter.press('Enter');
  await check('dictionaryTile', 'Dictionary Explorer');
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

test('regressione: Search - qualsiasi apice digitato trova le parole con l\'apice del testo (\'ntelletto → ’ntelletto)', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await openSmokeWorkspace(page, baseURL!);
  const sent: string[] = [];
  page.on('request', r => { if (r.url().includes('/texto/util/kwic') && r.method() === 'POST') { try { sent.push(r.postDataJSON()?.filters?.searchValue); } catch { /* ignora */ } } });
  const old = page.locator('#searchTile .jsPanel-btn-close');
  if (await old.count()) { await old.first().click(); await expect(page.locator('#searchTile')).toHaveCount(0); }
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  await expect(page.locator('#searchTile')).toBeVisible();
  const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
  // 1) apice ASCII: la richiesta parte con l'apice del testo e i risultati ci sono; il campo resta com'e' stato digitato
  await input.fill("'ntelletto"); await input.press('Enter');
  await expect(page.locator('#searchTile tbody tr').first()).toBeVisible({ timeout: 30_000 });
  expect(sent.at(-1)).toBe('\u2019ntelletto');
  await expect(input).toHaveValue("'ntelletto");
  const kwics = await page.locator('#searchTile tbody tr').first().innerText();
  expect(kwics).toContain('\u2019ntelletto');
  // 2) apice di Word a inizio parola (U+2018) e altre varianti
  for (const v of ['\u2018ntelletto', '\u02BCntelletto', '`ntelletto', '\u00B4ntelletto']) {
    await input.fill(v); await input.press('Enter');
    await expect.poll(() => sent.at(-1), { timeout: 15_000, message: v }).toBe('\u2019ntelletto');
  }
});

test('barra delle finestre: voci, clic come in Windows, menu, chiusura e spazio sotto la barra', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(150_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  const bar = page.locator('app-workspace-taskbar');
  const item = (id: string) => bar.locator(`[data-window-id="${id}"]`);
  await expect(bar).toBeVisible();
  await expect(bar.locator('.taskbar-item')).toHaveCount(0);
  const menu = page.locator('#workspace-menu');
  await menu.getByText('Search', { exact: true }).click();
  await expect(page.locator('#searchTile')).toBeVisible();
  await menu.getByText('Lexicon', { exact: true }).click();
  await expect(page.locator('#lexiconTile')).toBeVisible();
  await menu.getByText('Dictionary', { exact: true }).click();
  await expect(page.locator('#dictionaryTile')).toBeVisible();
  // 1) una voce per finestra, nell'ordine di apertura, con titolo e icona; l'ultima aperta e' attiva
  await expect(bar.locator('.taskbar-item')).toHaveCount(3);
  await expect(bar.locator('.taskbar-item .taskbar-title')).toHaveText(['Search', 'Lexicon Explorer', 'Dictionary Explorer']);
  await expect(bar.locator('.taskbar-item .taskbar-icon').first()).toHaveClass(/pi-search/);
  await expect(item('dictionaryTile')).toHaveClass(/active/);
  await expect(bar.locator('.taskbar-item.active')).toHaveCount(1);
  // la barra sta in fondo e il contenitore delle finestre non ci passa sotto
  const geo = await page.evaluate(() => {
    const b = document.querySelector('app-workspace-taskbar')!.getBoundingClientRect();
    const c = document.querySelector('#panelsContainer')!.getBoundingClientRect();
    return { barBottom: Math.round(b.bottom), barTop: Math.round(b.top), containerBottom: Math.round(c.bottom), h: window.innerHeight };
  });
  expect(geo.barBottom).toBe(geo.h);
  expect(geo.containerBottom).toBeLessThanOrEqual(geo.barTop);
  await snap(page, 'barra-finestre');
  // 2) clic su una finestra dietro: la porta davanti
  await item('searchTile').click();
  await expect(item('searchTile')).toHaveClass(/active/);
  await expect(item('dictionaryTile')).not.toHaveClass(/active/);
  // 3) clic sulla finestra davanti: la minimizza (e diventa attiva la successiva)
  await item('searchTile').click();
  await expect(item('searchTile')).toHaveClass(/minimized/);
  await expect(page.locator('#searchTile')).not.toBeInViewport();
  await expect(item('dictionaryTile')).toHaveClass(/active/);
  // 4) clic su una minimizzata: la ripristina davanti
  await item('searchTile').click();
  await expect(item('searchTile')).not.toHaveClass(/minimized/);
  await expect(item('searchTile')).toHaveClass(/active/);
  await expect(page.locator('#searchTile')).toBeInViewport();
  // niente contenitore di jsPanel in basso a sinistra con i minimizzati
  expect(await page.locator('#jsPanel-replacement-container .jsPanel-replacement').count()).toBe(0);
  // 5) menu al tasto destro: minimizza, ingrandisci, chiudi
  await item('lexiconTile').click({ button: 'right' });
  await expect(page.locator('.p-contextmenu .p-contextmenu-item-label', { hasText: 'Ingrandisci' })).toBeVisible();
  await page.locator('.p-contextmenu .p-contextmenu-item-label', { hasText: 'Ingrandisci' }).click();
  await expect.poll(() => page.evaluate(() => (document.getElementById('lexiconTile') as any).status)).toBe('maximized');
  const max = await page.evaluate(() => {
    const p = document.getElementById('lexiconTile')!.getBoundingClientRect();
    return { bottom: Math.round(p.bottom), barTop: Math.round(document.querySelector('app-workspace-taskbar')!.getBoundingClientRect().top) };
  });
  expect(max.bottom, 'finestra ingrandita non sotto la barra').toBeLessThanOrEqual(max.barTop);
  await snap(page, 'barra-finestre-ingrandita');
  await item('lexiconTile').click({ button: 'right' });
  await page.locator('.p-contextmenu .p-contextmenu-item-label', { hasText: 'Chiudi' }).click();
  await expect(item('lexiconTile')).toHaveCount(0);
  await expect(page.locator('#lexiconTile')).toHaveCount(0);
  await expect(bar.locator('.taskbar-item')).toHaveCount(2);
  // 6) una finestra ingrandita e minimizzata torna ingrandita
  await menu.getByText('Lexicon', { exact: true }).click();
  await expect(item('lexiconTile')).toBeVisible();
  await item('dictionaryTile').click({ button: 'right' });
  await page.locator('.p-contextmenu .p-contextmenu-item-label', { hasText: 'Ingrandisci' }).click();
  await item('dictionaryTile').click();
  await expect(item('dictionaryTile')).toHaveClass(/minimized/);
  await item('dictionaryTile').click();
  await expect.poll(() => page.evaluate(() => (document.getElementById('dictionaryTile') as any).status)).toBe('maximized');
});

test('barra delle finestre: una finestra minimizzata si salva e si ripristina minimizzata, e torna dov\'era', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(120_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  await expect(page.locator('#searchTile')).toBeVisible();
  const before = await page.evaluate(() => { const r = document.getElementById('searchTile')!.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; });
  const item = page.locator('app-workspace-taskbar [data-window-id="searchTile"]');
  await item.click(); // e' la sola finestra, quindi e' davanti: minimizza
  await expect(item).toHaveClass(/minimized/);
  // salvataggio come fa il workspace (layout.save) e ricreazione come fa il ripristino (layout.restoreId)
  const saved = await page.evaluate(() => JSON.parse((window as any).jsPanel.layout.save({ selector: '.jsPanel-standard', storagename: 'e2e-taskbar' })));
  expect(saved[0].status).toBe('minimized');
  expect(String(saved[0].left), 'posizione salvata non fuori schermo').not.toContain('-9999');
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await expect(page.locator('app-workspace-taskbar .taskbar-item')).toHaveCount(0);
  await page.evaluate(() => (window as any).jsPanel.layout.restoreId({ id: 'searchTile', storagename: 'e2e-taskbar', config: { id: 'searchTile', container: '#panelsContainer', headerTitle: 'Search', content: '<p>x</p>' } }));
  await expect(item).toHaveClass(/minimized/);
  await item.click();
  await expect(item).not.toHaveClass(/minimized/);
  await expect(item).toHaveClass(/active/);
  const after = await page.evaluate(() => { const r = document.getElementById('searchTile')!.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; });
  expect(after).toEqual(before);
  await page.evaluate(() => localStorage.removeItem('e2e-taskbar'));
});

test('barra delle finestre: nella voce gli editor sono abbreviati (LexE, DictE) e «Text - » non compare; il tooltip ha il titolo completo', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(120_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  // finestre con gli stessi id e titoli che crea il workspace (senza aprire i dati veri)
  await page.evaluate(() => {
    const mk = (id: string, headerTitle: string) => (window as any).jsPanel.create({ id, container: '#panelsContainer', headerTitle, content: '<p>x</p>', panelSize: '300 150' });
    mk('lexiconEditTile_1', 'Lexicon Editor - abbaiare@it');
    mk('dictionaryEditTile_2', 'Dictionary Editor - abbaiare');
    mk('textTile_3', 'Text - decameron');
    mk('searchTile', 'Search');
  });
  const labels = page.locator('app-workspace-taskbar .taskbar-item .taskbar-title');
  await expect(labels).toHaveText(['LexE - abbaiare@it', 'DictE - abbaiare', 'decameron', 'Search']);
  await expect(page.locator('app-workspace-taskbar [data-window-id="lexiconEditTile_1"]')).toHaveAttribute('title', 'Lexicon Editor - abbaiare@it');
  await expect(page.locator('app-workspace-taskbar [data-window-id="textTile_3"]')).toHaveAttribute('title', 'Text - decameron');
  await snap(page, 'barra-finestre-sigle');
});

test('regressione: login - la versione in basso a destra non tocca il bordo destro', async ({ page }) => {
  await page.goto('#/login');
  const footer = page.locator('app-footer').first();
  await expect(footer).toContainText('v. ');
  const m = await page.evaluate(() => {
    const span = document.querySelector('app-footer span')!.getBoundingClientRect();
    return { gap: Math.round(window.innerWidth - span.right) };
  });
  expect(m.gap, 'distanza dal bordo destro').toBeGreaterThanOrEqual(12);
  await snap(page, 'login-versione');
});

test('regressione: finestra del testo - il titolo è il nome del testo, senza «Text - » (finestra e barra)', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(120_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => { for (const x of (window as any).jsPanel?.getPanels?.() ?? []) { if (/textTile_|searchTile/.test(x.id)) x.close(); } });
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const input = page.locator('#searchTile p-iconfield input[pinputtext]').first();
  await input.fill('isposa'); await input.press('Enter');
  await expect(page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.locator('#searchTile tbody tr', { hasText: 'II.8.48' }).first().dblclick();
  const tile = page.locator('[id^="textTile_"]').first();
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await expect(tile.locator('.jsPanel-title')).toHaveText('decameron');
  await expect(page.locator('app-workspace-taskbar [data-window-id^="textTile_"] .taskbar-title')).toHaveText('decameron');
});

test('regressione: login - la maschera ha una larghezza standard (non si allarga col contenuto)', async ({ page }) => {
  await page.goto('#/login');
  const card = page.locator('app-login p-card, p-card').first();
  await expect(card).toBeVisible();
  const w = Math.round((await card.boundingBox())!.width);
  expect(w, 'larghezza della maschera').toBeGreaterThanOrEqual(360);
  expect(w, 'larghezza della maschera').toBeLessThanOrEqual(440);
  // titolo su una riga e campi dentro la card
  const inner = await page.evaluate(() => {
    const c = document.querySelector('p-card')!.getBoundingClientRect();
    const i = document.querySelector('p-card input')!.getBoundingClientRect();
    return { left: i.left - c.left, right: c.right - i.right };
  });
  expect(inner.left).toBeGreaterThan(8); expect(inner.right).toBeGreaterThan(8);
  await snap(page, 'login-maschera');
});

test('regressione: titolo della barra in alto (lista workspace, utenti…) rosso come nei workspace', async ({ page }) => {
  await uiLogin(page);
  await page.goto('#/workspaces');
  const logo = page.locator('.layout-topbar-logo span').first();
  await expect(logo).toContainText('MAIA');
  const { text, primary } = await page.evaluate(() => {
    const el = document.querySelector('.layout-topbar-logo span') as HTMLElement;
    const probe = document.createElement('i'); probe.style.color = 'var(--primary-color)'; document.body.appendChild(probe);
    const primary = getComputedStyle(probe).color; probe.remove();
    return { text: getComputedStyle(el).color, primary };
  });
  expect(text).toBe(primary);
  expect(text, 'non nero').not.toBe('rgb(0, 0, 0)');
  await snap(page, 'titolo-topbar');
});

test('regressione: Dictionary Editor, scheda Voce - il numero di occorrenze totali è allineato in verticale al campo delle occorrenze nel Decameron', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await blockWrites(page, testInfo); // la scheda Voce salva da sola: niente scritture
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['dictionaryEditTile']);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  const filter = tile.locator('input[type="text"]').first();
  await filter.fill('sonare'); await filter.press('Enter');
  const row = tile.locator('tbody tr', { hasText: /^\s*sonare/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  await expect(editor.locator('#totalOccurrences')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  const m = await editor.evaluate((e) => {
    const input = e.querySelector('p-inputnumber input')!.closest('p-inputnumber')!.querySelector('input')!.getBoundingClientRect();
    const total = e.querySelector('#totalOccurrences')!;
    const range = document.createRange(); range.selectNodeContents(total);
    const text = range.getBoundingClientRect();
    return { inputCenter: input.top + input.height / 2, textCenter: text.top + text.height / 2, inputTop: input.top, textTop: text.top };
  });
  testInfo.annotations.push({ type: 'centri', description: JSON.stringify(m) });
  expect(Math.abs(m.textCenter - m.inputCenter), 'centro del numero vs centro del campo').toBeLessThanOrEqual(1.5);
  await snap(page, 'dict-voce-occorrenze');
});

test('regressione: Dictionary Editor, scheda Voce - Etimologia: lingua ed etimo allineati sulla stessa riga, dettagli sotto a tutta larghezza, etichetta «Lingua di provenienza» non tagliata', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await blockWrites(page, testInfo); // la scheda Voce salva da sola: niente scritture
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['dictionaryEditTile']);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  const filter = tile.locator('input[type="text"]').first();
  await filter.fill('sonare'); await filter.press('Enter');
  const row = tile.locator('tbody tr', { hasText: /^\s*sonare/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  const group = editor.locator('[formgroupname="etymology"]');
  await expect(group).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
  const m = await group.evaluate((g) => {
    const fields = [...g.querySelectorAll(':scope > .field')];
    const top = (el: Element | null) => Math.round(el!.getBoundingClientRect().top * 10) / 10;
    const w = (el: Element | null) => Math.round(el!.getBoundingClientRect().width);
    const label = fields[0].querySelector('label')!;
    return { select: top(fields[0].querySelector('p-select')), input: top(fields[1].querySelector('input')), editor: top(fields[2].querySelector('app-rich-text-editor')), editorW: w(fields[2].querySelector('app-rich-text-editor')), groupW: w(g), labelCut: label.scrollWidth > label.clientWidth };
  });
  testInfo.annotations.push({ type: 'tops', description: JSON.stringify(m) });
  expect(m.labelCut, 'etichetta «Lingua di provenienza» tagliata').toBe(false);
  expect(Math.abs(m.select - m.input), 'lingua vs etimo sulla stessa riga').toBeLessThanOrEqual(1);
  expect(m.editor, 'dettagli sotto la riga lingua/etimo').toBeGreaterThan(m.input + 30);
  expect(m.editorW, 'dettagli a tutta larghezza del gruppo').toBeGreaterThanOrEqual(m.groupW - 24); // meno il margine del campo
  await group.scrollIntoViewIfNeeded();
  await group.screenshot({ path: path.join(__dirname, '..', 'artifacts', 'screens', process.env.E2E_LABEL || 'run', 'dict-voce-etimologia.png') });
});

test('regressione: finestre - il bordo destro ridimensiona solo la larghezza anche se un tasto modificatore è rimasto «premuto» per jsPanel (Alt+Tab, Ctrl+Tab…)', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(120_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const tile = page.locator('#searchTile');
  await expect(tile).toBeVisible();
  await page.waitForTimeout(800);
  const size = () => tile.evaluate((e) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
  const dragRight = async (dx: number) => {
    const b = (await tile.locator('.jsPanel-resizeit-e').boundingBox())!;
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + dx / 2, y, { steps: 5 }); await page.mouse.move(x + dx, y, { steps: 5 }); await page.mouse.up();
  };
  // 1) senza tasti: solo la larghezza cambia
  const a = await size(); await dragRight(60); const b = await size();
  expect(b.w, 'larghezza dopo il trascinamento').toBeGreaterThan(a.w + 40);
  expect(b.h, 'altezza invariata').toBe(a.h);
  // 2) un keydown con Ctrl senza il keyup (la finestra ha perso il fuoco mentre il tasto era premuto): jsPanel lo ricorda
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true })));
  await dragRight(-60); const c = await size();
  expect(c.w, 'larghezza tornata indietro').toBeLessThan(b.w - 40);
  expect(c.h, 'altezza invariata anche con il modificatore rimasto attivo').toBe(b.h);
  // 3) con Ctrl tenuto davvero premuto il comportamento voluto di jsPanel (proporzioni bloccate) resta
  await page.keyboard.down('Control'); await dragRight(60); await page.keyboard.up('Control');
  const d = await size();
  expect(d.h, 'con Ctrl premuto le proporzioni restano bloccate').not.toBe(c.h);
});

test('regressione: Dictionary Editor, Anteprima - tra la marca di un senso e la definizione c\'è uno spazio ([Mus.] Generare…)', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['dictionaryEditTile']);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  const filter = tile.locator('input[type="text"]').first();
  await filter.fill('sonare'); await filter.press('Enter');
  const row = tile.locator('tbody tr', { hasText: /^\s*sonare/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  await expect(editor.locator('[role="tab"]').nth(2)).toBeEnabled({ timeout: 30_000 });
  await editor.locator('[role="tab"]').nth(2).click();
  const marked = editor.locator('app-dictionary-preview p-tree li').filter({ has: page.locator('em') }).first();
  await expect(marked.locator('em').first()).toBeVisible({ timeout: 30_000 });
  const t = await marked.locator('em').first().evaluate((em) => (em.parentElement as HTMLElement).textContent!);
  expect(t, 'testo del senso con marca: «[Mus.] definizione»').toMatch(/\[[^\]]+\] \S/);
});

test('regressione: Dictionary Editor, scheda Ordinamento - una sola cornice (lista) e spazio tra la lista e i bottoni Save/Restore', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['dictionaryEditTile']);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  const filter = tile.locator('input[type="text"]').first();
  await filter.fill('sonare'); await filter.press('Enter');
  const row = tile.locator('tbody tr', { hasText: /^\s*sonare/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  await expect(editor.locator('[role="tab"]').nth(1)).toBeEnabled({ timeout: 30_000 });
  await editor.locator('[role="tab"]').nth(1).click();
  await expect(editor.locator('app-dictionary-sorting-editor p-tree')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(800);
  const m = await editor.evaluate((e) => {
    const root = e.querySelector('app-dictionary-sorting-editor')!;
    const list = root.querySelector('p-listbox')!.getBoundingClientRect();
    const btn = root.querySelector('.sorting-button')!.getBoundingClientRect();
    const tree = getComputedStyle(root.querySelector('p-orderlist p-tree')!);
    return { gap: Math.round(btn.top - list.bottom), treeBorder: tree.borderTopWidth, treePadding: tree.paddingTop, listBorder: getComputedStyle(root.querySelector('p-listbox')!).borderTopWidth };
  });
  testInfo.annotations.push({ type: 'misure', description: JSON.stringify(m) });
  expect(m.gap, 'spazio tra la lista e i bottoni').toBeGreaterThanOrEqual(12);
  expect(m.treeBorder, 'l\'albero non ha una seconda cornice').toBe('0px');
  expect(m.treePadding).toBe('0px');
  expect(m.listBorder, 'la cornice della lista resta').toBe('1px');
  await editor.locator('app-dictionary-sorting-editor').screenshot({ path: path.join(__dirname, '..', 'artifacts', 'screens', process.env.E2E_LABEL || 'run', 'dict-ordinamento.png') });
});

test('regressione: Search - sui risultati il cursore è la mano (la riga si apre con il doppio clic), non il cursore di testo', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(120_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  await openFreshSearch(page, 'amore');
  const m = await page.locator('#searchTile tbody tr').first().evaluate((tr) => {
    const spans = [...tr.querySelectorAll('td, td span, td b')];
    return { row: getComputedStyle(tr).cursor, others: [...new Set(spans.map((e) => getComputedStyle(e).cursor))] };
  });
  testInfo.annotations.push({ type: 'cursori', description: JSON.stringify(m) });
  expect(m.row).toBe('pointer');
  expect(m.others, 'nessun cursore di testo nelle celle del risultato').toEqual(['pointer']);
});

test('regressione: Lexicon Editor - la lista delle morfologie (lexinfo/data/morphology) si chiede una sola volta, non una per riga di morfologia', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const morph: string[] = [];
  page.on('request', (r) => { if (r.url().includes('/lexinfo/data/morphology')) morph.push(r.url()); });
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  const tile = page.locator('#lexiconTile');
  await expect(tile).toBeVisible({ timeout: 30_000 });
  await expect(tile.locator('tbody tr').nth(3)).toBeVisible({ timeout: 30_000 }); // finita la prima lista
  await page.waitForTimeout(1500);
  await tile.locator('#searchInput').fill('brigata'); await page.waitForTimeout(3500);
  await tile.locator('tr', { hasText: 'brigata@it' }).first().locator('button').first().click();
  const root = tile.locator('tr', { hasText: /^\s*form \(\d+\)/ }).first();
  await expect(root).toBeVisible({ timeout: 15_000 });
  await root.locator('button').first().click(); await page.waitForTimeout(1500);
  await tile.locator('tr', { hasText: /^\s*brigat[ae]\b/ }).first().dblclick();
  const ed = page.locator('.jsPanel').filter({ has: page.locator('app-workspace-lexicon-edit-tile') }).last();
  await expect(ed).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  const rows = ed.locator('p-treetable tbody tr, p-treeTable tbody tr');
  await rows.filter({ hasText: /^\s*brigat[ae]\b/ }).first().click(); // il form della forma: righe di morfologia
  await expect(ed.locator('app-double-autocomplete').first()).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  expect(morph.length, 'richieste a lexinfo/data/morphology dall\'apertura dell\'editor al clic su una forma').toBeLessThanOrEqual(1);
});

test('regressione: Lexicon Explorer - scrivere nel filtro mentre arriva la lista iniziale (lenta) non la lascia al posto di quella filtrata; una sola richiesta per la scrittura', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const sent: string[] = [];
  let firstDelayed = false;
  await page.route(/\/lexo\/data\/lexicalEntries$/, async (route) => {
    const text = (route.request().postDataJSON() as any)?.text ?? '';
    sent.push(text);
    // la prima lista (tutte le entrate) arriva molto dopo: la corsa che vede chi scrive subito
    if (text === '' && !firstDelayed) { firstDelayed = true; await new Promise((r) => setTimeout(r, 6000)); }
    await route.continue();
  });
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  sent.length = 0; firstDelayed = false;
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  const tile = page.locator('#lexiconTile');
  await expect(tile).toBeVisible({ timeout: 30_000 });
  const input = tile.locator('#searchInput');
  await input.click();
  await input.pressSequentially('brigata', { delay: 40 }); // veloce, senza aspettare la lista
  await expect(tile.locator('tbody tr').first()).toContainText('brigata@it', { timeout: 30_000 });
  await page.waitForTimeout(7000); // la lista iniziale in ritardo non deve piu' sovrascrivere
  const rows = (await tile.locator('tbody tr').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  expect(rows, 'solo le entrate filtrate').toEqual(['brigata@it noun']);
  expect(sent.filter((t) => t !== ''), 'richieste col testo digitato: una sola (pausa di 250 ms), non una per tasto').toEqual(['brigata']);
});

test('regressione: Dictionary Editor, Anteprima - Etimologia su due righe: lingua ed etimo accanto, dettagli sotto a tutta larghezza', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
  await closePanels(page, ['dictionaryEditTile']);
  await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  const filter = tile.locator('input[type="text"]').first();
  await filter.fill('sonare'); await filter.press('Enter');
  const row = tile.locator('tbody tr', { hasText: /^\s*sonare/ }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.dblclick();
  const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
  await expect(editor.locator('[role="tab"]').nth(2)).toBeEnabled({ timeout: 30_000 });
  await editor.locator('[role="tab"]').nth(2).click();
  const group = editor.locator('#etymologyPreview');
  await expect(group).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  const m = await group.evaluate((g) => {
    const cols = [...g.children] as HTMLElement[];
    const r = (el: Element) => el.getBoundingClientRect();
    return { lingua: r(cols[0]).top, etimo: r(cols[1]).top, detTop: r(cols[2]).top, detW: Math.round(r(cols[2]).width), groupW: Math.round(r(g).width), linguaBottom: r(cols[0]).bottom, etimoBottom: r(cols[1]).bottom };
  });
  testInfo.annotations.push({ type: 'misure', description: JSON.stringify(m) });
  expect(Math.abs(m.lingua - m.etimo), 'lingua ed etimo sulla stessa riga').toBeLessThanOrEqual(1);
  expect(m.detTop, 'dettagli sotto la riga lingua/etimo').toBeGreaterThanOrEqual(Math.max(m.linguaBottom, m.etimoBottom) - 1);
  expect(m.detW, 'dettagli a tutta larghezza del gruppo').toBeGreaterThanOrEqual(m.groupW - 4);
  await expect(group.locator('#etymonPreview'), 'etimo in corsivo come nella scheda Voce').toHaveCSS('font-style', 'italic');
  await group.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await group.screenshot({ path: path.join(__dirname, '..', 'artifacts', 'screens', process.env.E2E_LABEL || 'run', 'dict-anteprima-etimologia.png') });
});

test('regressione: Dictionary Explorer - scrivere nel filtro mentre arriva la lista iniziale (lenta) non la lascia al posto di quella filtrata', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const sent: string[] = [];
  let firstDelayed = false;
  await page.route(/\/lexo\/data\/dictionaryEntries$/, async (route) => {
    const text = (route.request().postDataJSON() as any)?.text ?? '';
    sent.push(text);
    if (text === '' && !firstDelayed) { firstDelayed = true; await new Promise((r) => setTimeout(r, 6000)); } // la prima lista arriva molto dopo
    await route.continue();
  });
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  sent.length = 0; firstDelayed = false;
  await page.locator('#workspace-menu').getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  await expect(tile).toBeVisible({ timeout: 30_000 });
  const input = tile.locator('input[type="text"]').first();
  await input.click();
  await input.pressSequentially('sonare', { delay: 40 }); // veloce, senza aspettare la lista
  await expect(tile.locator('tbody tr').first()).toContainText('sonare', { timeout: 30_000 });
  await page.waitForTimeout(7000); // la lista iniziale in ritardo non deve piu' sovrascrivere
  const rows = (await tile.locator('tbody tr').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  expect(rows.length, 'solo le voci filtrate').toBeGreaterThan(0);
  expect(rows.every((r) => /^sonare/.test(r)), `tutte le righe iniziano per "sonare": ${rows.slice(0, 4).join(' | ')}`).toBe(true);
  expect(sent.filter((t) => t !== ''), 'richieste col testo digitato: una sola (pausa), non una per tasto').toEqual(['sonare']);
});

test('regressione: Dictionary Explorer - il Reset del filtro fa una sola richiesta, con il testo vuoto (non una prima col vecchio valore)', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const sent: string[] = [];
  await page.route(/\/lexo\/data\/dictionaryEntries$/, async (route) => { sent.push((route.request().postDataJSON() as any)?.text ?? ''); await route.continue(); });
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  await page.locator('#workspace-menu').getByText('Dictionary', { exact: true }).click();
  const tile = page.locator('#dictionaryTile');
  await expect(tile.locator('tbody tr').nth(3)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  const input = tile.locator('input[type="text"]').first();
  await input.fill('sonare');
  await expect(tile.locator('tbody tr').first()).toContainText('sonare', { timeout: 30_000 });
  await page.waitForTimeout(1500);
  sent.length = 0;
  await tile.locator('button .pi-filter-slash').click();
  await expect(tile.locator('tbody tr').nth(3)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2000);
  expect(sent, 'richieste dopo il Reset').toEqual(['']);
  await expect(input).toHaveValue('');
});

test('regressione: Lexicon Explorer - niente overlay con lo spinner sulla lista mentre si filtra (resta lo spin del pulsante); il Reset fa una sola richiesta', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const sent: string[] = [];
  await page.route(/\/lexo\/data\/lexicalEntries$/, async (route) => { sent.push((route.request().postDataJSON() as any)?.text ?? ''); await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click();
  const tile = page.locator('#lexiconTile');
  await expect(tile.locator('tbody tr').nth(3)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  const input = tile.locator('#searchInput');
  await input.fill('brigata');
  // durante la richiesta (rallentata) lo spin e' sul pulsante e non c'e' l'overlay sulla lista
  await expect(tile.locator('p-button[icon="pi pi-spinner"] button')).toBeDisabled({ timeout: 5_000 }).catch(() => {});
  await page.waitForTimeout(900);
  expect(await tile.locator('.p-treetable-mask, .p-treetable-loading').count(), 'overlay di caricamento sulla lista').toBe(0);
  await expect(tile.locator('tbody tr').first()).toContainText('brigata@it', { timeout: 30_000 });
  await page.waitForTimeout(1500);
  sent.length = 0;
  await tile.locator('button .pi-filter-slash').click();
  await expect(tile.locator('tbody tr').nth(3)).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  expect(sent, 'richieste dopo il Reset').toEqual(['']);
});

test('regressione: Explorer di Lexicon e Dictionary - stessa dimensione di apertura e pulsante Reset della stessa larghezza', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1600, height: 760 }); // con 1000px di altezza i due valori coincidevano per caso (500 = 1000/2)
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  const measure = async (menu: string, id: string) => {
    await page.locator('#workspace-menu').getByText(menu, { exact: true }).click();
    const tile = page.locator('#' + id);
    await expect(tile).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    const m = await tile.evaluate((e) => { const b = e.getBoundingClientRect(); const r = e.querySelector('.pi-filter-slash')!.closest('button')!.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), resetW: Math.round(r.width) }; });
    await page.evaluate((i) => (document.getElementById(i) as any).close(), id);
    await page.waitForTimeout(400);
    return m;
  };
  const lex = await measure('Lexicon', 'lexiconTile');
  const dict = await measure('Dictionary', 'dictionaryTile');
  expect(dict.h, `altezza di apertura (lexicon ${lex.h}, dictionary ${dict.h})`).toBe(lex.h);
  expect(dict.w, 'larghezza di apertura').toBe(lex.w);
  expect(dict.resetW, `larghezza del pulsante Reset (lexicon ${lex.resetW}, dictionary ${dict.resetW})`).toBe(lex.resetW);
});

test('regressione: Dictionary Explorer - il pannello dei filtri si chiama «Filters», come nel Lexicon Explorer', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  await openSmokeWorkspace(page, baseURL!);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  const header = async (menu: string, id: string) => {
    await page.locator('#workspace-menu').getByText(menu, { exact: true }).click();
    const tile = page.locator('#' + id);
    await expect(tile).toBeVisible({ timeout: 30_000 });
    const t = (await tile.locator('p-panel .p-panel-header').first().innerText()).trim();
    await page.evaluate((i) => (document.getElementById(i) as any).close(), id);
    await page.waitForTimeout(400);
    return t;
  };
  expect(await header('Lexicon', 'lexiconTile')).toBe('Filters');
  expect(await header('Dictionary', 'dictionaryTile')).toBe('Filters');
});
