/**
 * Prova REALE dell'annotazione massiva (Search > Annota) contro maia-be e TexO.
 *
 * SCRIVE SULLA VM: crea annotazioni sul «layer test» (id 25388589, campo `prova`,
 * tagset «prova simone») e le rimuove alla fine con lo stesso corpo in
 * `DELETE /texto/annotation/multiple`. Per questo e' SALTATO se non si imposta
 * E2E_REAL_WRITES=1 e non va mai lanciato in una esecuzione normale.
 *
 * Quando lanciarlo: dopo un aggiornamento di maia-be/TexO, o se qualcuno segnala che
 * l'annotazione massiva salta dei contesti (es. dalla seconda pagina in poi).
 *
 * Uso:
 *   E2E_REAL_WRITES=1 PAGES=12 E2E_LABEL=mass E2E_EXPECT_TITLE="MAIA - develop" \
 *     npx playwright test tests/mass-annotation-real.spec.ts
 *
 * PAGES = quante pagine da 10 contesti selezionare (default 2; la ricerca «amore»
 * ne ha 27 = 269 contesti; circa 0,15 s per contesto). Le righe `INIZIO/FINE/PULIZIA`
 * stampano gli orari da confrontare con i log di TexO. Non usare il layer Lemma:
 * i contesti di «amore» vi risultano gia' tutti annotati.
 * Il test fallisce se i contesti creati non sono tutti i selezionati o se dopo la
 * pulizia resta qualcosa.
 */
import { expect, test } from '@playwright/test';
import { apiLogin, uiLogin } from './support';

const PAGES = Number(process.env.PAGES || 2);
const ts = () => new Date().toLocaleTimeString('it-IT', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0');

test.skip(process.env.E2E_REAL_WRITES !== '1', 'scrive sulla VM: impostare E2E_REAL_WRITES=1');

test('annotazione massiva reale su piu pagine (layer test) e pulizia', async ({ page, baseURL }) => {
  test.setTimeout(1_800_000);
  // il layout del workspace non va salvato
  await page.route(/\/api\/workspaces\/layout$/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
  const { api, token, base } = await apiLogin(baseURL!);
  const res = await api.get(`${base}/api/workspaces/workspaceChoiceList`, { headers: { Authorization: `Bearer ${token}` } });
  const ws = ((await res.json()) as any[]).find((x) => x.name === 'e2e-smoke');
  await uiLogin(page);
  await page.goto(`#/workspace/${ws.id}`);
  await expect(page.locator('#workspace-menu').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
  await page.waitForTimeout(500);
  await page.locator('#workspace-menu').getByText('Search', { exact: true }).click();
  const tile = page.locator('#searchTile');
  await page.waitForTimeout(1500);
  await tile.locator('p-select').filter({ hasText: /Layer/ }).first().click();
  await page.locator('.p-select-option').filter({ hasText: /^\s*layer test\s*$/ }).first().click();
  const input = tile.locator('p-iconfield input[pinputtext]').first();
  await input.fill('amore');
  await input.press('Enter');
  await expect(tile.locator('tbody tr').nth(9)).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(800);

  const tableComp = "window.ng.getOwningComponent(document.querySelector(\"#searchTile p-table\"))";
  const readRows = () => page.evaluate(`${tableComp}.searchResults.map(r => ({ i: r.index, annotated: r.annotated }))`) as Promise<{ i: number; annotated: boolean }[]>;
  const countAnnotated = async (label: string) => {
    await tile.locator('button', { hasText: /^\s*Cerca\s*$/ }).first().click();
    await expect(tile.locator('tbody tr').nth(9)).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1200);
    let annotated = 0, total = 0;
    const perPage: number[] = [];
    for (let p = 0; p < PAGES; p++) {
      const rows = await readRows();
      total += rows.length;
      const a = rows.filter((r) => r.annotated).length;
      annotated += a;
      perPage.push(a);
      if (p < PAGES - 1) { await tile.locator('.p-paginator-next').first().click(); await page.waitForTimeout(1000); }
    }
    console.log(label, 'annotati', annotated, 'di', total, '| per pagina:', perPage.join(','));
    return annotated;
  };

  const before = await readRows();
  expect(before.filter((r) => r.annotated).length, 'il layer test deve partire senza annotazioni su «amore»').toBe(0);

  // selezione della testata, pagina per pagina
  for (let p = 0; p < PAGES; p++) {
    await tile.locator('thead .p-checkbox').first().click();
    await page.waitForTimeout(200);
    if (p < PAGES - 1) { await tile.locator('.p-paginator-next').first().click(); await page.waitForTimeout(700); }
  }
  const selected = (await page.evaluate(`${tableComp}.selectedSearchResults.length`)) as number;
  console.log('SELEZIONATI', selected);
  expect(selected).toBeGreaterThanOrEqual(PAGES * 9);

  await tile.locator('p-splitbutton button').first().click();
  const dialog = page.locator('.p-dialog').filter({ visible: true }).first();
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1200);
  await dialog.locator('p-select').first().click();
  await page.locator('.p-select-option').first().click();
  await page.waitForTimeout(400);

  let reqBody: any = null;
  let tReq = 0;
  let resp: { status: number; ms: number; body: string } | null = null;
  page.on('request', (r) => {
    if (/annotation\/multiple/.test(r.url()) && r.method() === 'POST') {
      reqBody = r.postDataJSON(); tReq = Date.now();
      console.log('INIZIO', ts(), 'offsets', reqBody.offsets.length, 'layerId', reqBody.layerId, JSON.stringify(reqBody.features));
    }
  });
  page.on('response', async (r) => {
    if (/annotation\/multiple/.test(r.url()) && r.request().method() === 'POST') {
      const body = await r.text().catch(() => '');
      resp = { status: r.status(), ms: Date.now() - tReq, body: body.slice(0, 400) };
      console.log('FINE  ', ts(), JSON.stringify(resp));
    }
  });
  console.log('CLIC SALVA', ts());
  // il pulsante di salvataggio e' un'icona senza testo: clic a coordinate (viewport 1600x1000) o per icona
  await page.mouse.click(708, 603).catch(() => {});
  const saveBtn = dialog.locator('button:has(.pi-save), button:has([data-icon="floppy-disk"])').first();
  if (await saveBtn.count()) await saveBtn.click();

  let created = -1;
  try {
    await expect.poll(() => resp, { timeout: 1_500_000, intervals: [1000] }).not.toBeNull();
    await page.waitForTimeout(2500);
    const toasts = await page.locator('.p-toast-message').allInnerTexts();
    console.log('MESSAGGI', JSON.stringify(toasts.map((t) => t.replace(/\s+/g, ' ').trim())));
    created = await countAnnotated('DOPO CREAZIONE:');
    expect(JSON.parse(resp!.body).errors, 'nessun contesto rifiutato').toEqual([]);
    expect(created, 'contesti annotati = contesti selezionati').toBe(selected);
  } finally {
    // pulizia sempre, anche se la verifica e' fallita: rimuove solo le annotazioni con gli stessi valori
    if (reqBody) {
      console.log('PULIZIA inizio', ts());
      const del = await api.delete(`${base}/texto/annotation/multiple`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, data: reqBody, timeout: 1_500_000,
      });
      console.log('PULIZIA fine  ', ts(), del.status(), (await del.text()).slice(0, 400));
    }
  }
  const left = await countAnnotated('DOPO PULIZIA:  ');
  await api.dispose();
  expect(left, 'dopo la pulizia il layer test deve essere vuoto').toBe(0);
});
