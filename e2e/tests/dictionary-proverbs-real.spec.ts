/**
 * Prova REALE del campo «Proverbi» della scheda di una voce del Dictionary.
 *
 * SCRIVE SULLA VM (voce «eretico», dati di test): scrive un proverbio nell'editor, controlla che
 * l'autosave mandi UN SOLO JSON con tutti i campi gia' presenti + `proverbs` (nessun campo perso),
 * che la nota riletta dal backend li contenga e che l'Anteprima mostri «Proverbi» tra le
 * polirematiche e «Vedi anche». Alla fine ripristina la nota originale (stessa chiamata dell'app).
 * Non si puo' ripristinare solo la data di ultima modifica (`lastUpdate`).
 * Saltato se non si imposta E2E_REAL_WRITES=1.
 *
 *   E2E_REAL_WRITES=1 E2E_LABEL=prov E2E_EXPECT_TITLE="MAIA - develop" npx playwright test tests/dictionary-proverbs-real.spec.ts
 */
import { expect, test } from '@playwright/test';
import { apiLogin, snap, uiLogin } from './support';

const ENTRY = 'eretico';
const PROVERB = 'Chi dorme non piglia pesci';

test.skip(process.env.E2E_REAL_WRITES !== '1', 'scrive sulla VM: impostare E2E_REAL_WRITES=1');

test('Dictionary Editor: «Proverbi» si salva nello stesso JSON della nota, senza perdere i campi esistenti (voce gia esistente)', async ({ page, baseURL }) => {
  test.setTimeout(300_000);
  await page.route(/\/api\/workspaces\/layout$/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }));
  const { api, token, base } = await apiLogin(baseURL!);
  const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const list = (await (await api.post(`${base}/lexo/data/dictionaryEntries`, { headers: H, data: { text: ENTRY, searchMode: 'startsWith', pos: '', author: '', lang: '', status: '', offset: 0, limit: 20 } })).json()).list as any[];
  const entry = list.find((e) => e.label === ENTRY);
  expect(entry, `voce «${ENTRY}» sulla VM`).toBeTruthy();
  const getNote = async (): Promise<string> => (await (await api.get(`${base}/lexo/data/dictionaryEntry?id=${encodeURIComponent(entry.id)}`, { headers: H })).json()).note;
  const original = await getNote();
  const originalObj = JSON.parse(original);
  expect(Object.keys(originalObj), 'la voce di partenza non ha ancora i proverbi').not.toContain('proverbs');
  expect(originalObj.polyrhematics.length, 'la voce di partenza ha delle polirematiche').toBeGreaterThan(20);

  try {
    await uiLogin(page);
    const ws = ((await (await api.get(`${base}/api/workspaces/workspaceChoiceList`, { headers: { Authorization: `Bearer ${token}` } })).json()) as any[]).find((x) => x.name === 'e2e-smoke');
    await page.goto(`#/workspace/${ws.id}`);
    await expect(page.locator('#workspace-menu').first()).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => (window as any).jsPanel.getPanels().forEach((x: any) => x.close()));
    await page.waitForTimeout(500);
    await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click();
    const tile = page.locator('#dictionaryTile');
    const filter = tile.locator('input[type="text"]').first();
    await filter.fill(ENTRY); await filter.press('Enter');
    const row = tile.locator('tbody tr', { hasText: new RegExp(`^\\s*${ENTRY}`) }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.dblclick();
    const editor = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
    await expect(editor.locator('#polyrhematics .ql-editor')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1000);

    // il campo c'e', e' dopo le polirematiche e prima di "Vedi anche", ed e' vuoto per la voce esistente
    const y = async (sel: string) => (await editor.locator(sel).first().boundingBox())!.y;
    const yPoli = await y('#polyrhematics'), yProv = await y('#proverbs'), ySee = await y('p-fieldset:has-text("Vedi anche")');
    expect(yProv, 'Proverbi sotto le polirematiche').toBeGreaterThan(yPoli);
    expect(ySee, 'Vedi anche sotto Proverbi').toBeGreaterThan(yProv);
    expect((await editor.locator('#proverbs .ql-editor').innerText()).trim(), 'voce esistente: Proverbi vuoto').toBe('');
    expect((await editor.locator('#polyrhematics .ql-editor').innerText()).trim().length, 'le polirematiche esistenti si vedono').toBeGreaterThan(20);
    await editor.locator('#proverbs').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await snap(page, 'prov-editor-vuoto');

    // scrittura: l'autosave manda tutta la nota in un solo POST
    const posts: any[] = [];
    page.on('request', (r) => { if (/update\/dictionaryEntry\/notes/.test(r.url()) && r.method() === 'POST') posts.push({ url: r.url(), body: r.postData() }); });
    await editor.locator('#proverbs .ql-editor').click();
    await page.keyboard.type(PROVERB, { delay: 15 });
    await expect.poll(() => posts.length, { timeout: 15_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1500); // l'ultimo POST (debounce 500 ms) con il testo completo
    const last = JSON.parse(posts[posts.length - 1].body);
    expect(Object.keys(last).sort(), 'un solo JSON: tutte le chiavi di prima + proverbs').toEqual([...Object.keys(originalObj), 'proverbs'].sort());
    expect(last.proverbs, 'il proverbio e\' nel JSON').toContain(PROVERB);
    for (const k of ['firstAttestation', 'firstAttestationDetails', 'decameronOccurrences', 'frequencies']) {
      expect(JSON.stringify(last[k]), `campo ${k} invariato`).toBe(JSON.stringify(originalObj[k]));
    }
    expect(last.etymology.language, 'etymology.language invariato').toBe(originalObj.etymology.language);
    expect(last.etymology.etymon, 'etymology.etymon invariato').toBe(originalObj.etymology.etymon);
    expect(new Set(posts.map((p) => p.url.split('?')[0])).size, 'sempre lo stesso endpoint').toBe(1);

    // riletto dal backend: i campi ci sono tutti e i testi ricchi mantengono il contenuto
    const stored = JSON.parse(await getNote());
    expect(Object.keys(stored).sort()).toEqual([...Object.keys(originalObj), 'proverbs'].sort());
    expect(stored.proverbs).toContain(PROVERB);
    const text = (h: string) => h.replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, (m) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&rsquo;': '’' } as any)[m] ?? m).replace(/\s+/g, ' ').trim();
    for (const k of ['linguisticsSemantics', 'decameron', 'firstAbsAttestation', 'boccaccioDante', 'crusche', 'polyrhematics']) {
      expect(text(stored[k]), `testo di ${k} conservato`).toBe(text(originalObj[k]));
    }
    expect(text(stored.etymology.details), 'testo di etymology.details conservato').toBe(text(originalObj.etymology.details));

    // anteprima
    await editor.locator('[role="tab"]').nth(2).click();
    await expect(editor.locator('#preview_proverbs')).toBeVisible({ timeout: 30_000 });
    const panel = await editor.locator('[role="tabpanel"]:visible').first().innerText();
    expect(panel.indexOf('Proverbi:'), 'Anteprima: Proverbi dopo le polirematiche').toBeGreaterThan(panel.indexOf('Polirematiche / locuzioni'));
    expect(panel).toContain(PROVERB);
    await editor.locator('#preview_proverbs').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await snap(page, 'prov-anteprima');
  } finally {
    // ripristino della nota originale con la stessa chiamata dell'app
    const r = await api.post(`${base}/lexo/update/dictionaryEntry/notes?id=${encodeURIComponent(entry.id)}&author=agente`, { headers: H, data: original });
    console.log('RIPRISTINO', r.status());
  }
  const restored = await getNote();
  expect(restored, 'nota ripristinata identica all\'originale').toBe(original);
  await api.dispose();
});
