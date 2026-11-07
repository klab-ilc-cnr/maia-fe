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

test('regressione: annotazione semantica nuova - "Tipo lessicale" preselezionato su "Parola monorematica"', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(240_000);
  await blockWrites(page, testInfo); // non si salva nulla: si apre solo l'editor e si guarda il campo
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

test('regressione: annotazione semantica singola (finestra del testo) - "Tipo lessicale" preselezionato', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  await blockWrites(page, testInfo);
  await openSmokeWorkspace(page, baseURL!);
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
  const editor = text.locator('app-text-annotation-editor');
  await expect(editor.locator('p-select').filter({ hasText: 'Parola monorematica' }), 'Tipo lessicale preselezionato (annotazione nuova)').toHaveCount(1, { timeout: 15_000 });
  await snap(page, 'r17-annotazione-singola-default');
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
  const rows = editor.locator('app-dictionary-preview .custom-leaf p-table tbody tr.p-selectable-row');
  await expect(rows.first(), 'contesti nell\'anteprima').toBeVisible({ timeout: 30_000 });

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
