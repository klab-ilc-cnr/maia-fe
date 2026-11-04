import { expect, Locator, Page, test, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { apiLogin, uiLogin, watchPage } from './support';

/**
 * Giro visivo (solo letture) per il confronto prima/dopo del nuovo sistema di temi di PrimeNG 18+.
 * Fotografa pagine, dialoghi, pannelli e overlay (menu, select aperti, context menu).
 * Ogni passo e' indipendente: se un elemento non c'e' il passo viene annotato come "saltato"
 * e il giro prosegue. Il test fallisce solo per eccezioni JavaScript non gestite.
 * Il workspace e' visitato per ultimo senza uscirne: il layout salvato nel DB non cambia.
 */

const dir = () => path.join(__dirname, '..', 'artifacts', 'screens', process.env.E2E_LABEL || 'run');

async function shot(target: Page | Locator, name: string) {
  fs.mkdirSync(dir(), { recursive: true });
  const file = path.join(dir(), `v-${name}.png`);
  if ('goto' in target) await target.screenshot({ path: file, fullPage: true });
  else await target.screenshot({ path: file });
}

async function step(testInfo: TestInfo, name: string, fn: () => Promise<void>) {
  await test.step(name, async () => {
    try { await fn(); }
    catch (e) { testInfo.annotations.push({ type: 'saltato', description: `${name}: ${String((e as Error).message).split('\n')[0].slice(0, 200)}` }); }
  });
}

test('giro visivo dei componenti', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(300_000);
  page.setDefaultTimeout(15_000);
  const w = watchPage(page);
  await uiLogin(page);
  await w.settle();

  await step(testInfo, '01 lista utenti', async () => {
    await page.goto('#/usersManagement/users'); await w.settle(); await shot(page, '01-users');
  });
  await step(testInfo, '02 scheda utente', async () => {
    await page.locator('button[aria-label="Go to edit user"]').first().click(); await w.settle();
    await expect(page).toHaveURL(/userDetails/); await shot(page, '02-user-form');
  });
  await step(testInfo, '03 select aperto nella scheda utente', async () => {
    const dd = page.locator('p-dropdown, p-select').first();
    await dd.click(); await page.waitForTimeout(500); await shot(page, '03-user-form-select');
    await page.keyboard.press('Escape');
  });
  await step(testInfo, '04 dettaglio tagset', async () => {
    await page.goto('#/tagsets/17'); await w.settle(); await shot(page, '04-tagset');
  });
  await step(testInfo, '05 dettaglio layer', async () => {
    await page.goto('#/layers/6'); await w.settle(); await shot(page, '05-layer');
  });
  await step(testInfo, '06 dialogo modifica workspace', async () => {
    await page.goto('#/workspaces'); await w.settle();
    await page.getByRole('row').nth(1).locator('button:has(.pi-pencil), button[icon="pi pi-pencil"]').first().click();
    const dlg = page.locator('.p-dialog').filter({ visible: true }).first();
    await expect(dlg).toBeVisible(); await page.waitForTimeout(500); await shot(page, '06-workspace-dialog');
    await page.keyboard.press('Escape');
  });

  // --- workspace (ultimo: non se ne esce, il layout salvato resta invariato)
  const { api, token, base } = await apiLogin(baseURL!);
  const res = await api.get(`${base}/api/workspaces/workspaceChoiceList`, { headers: { Authorization: `Bearer ${token}` } });
  const ws = ((await res.json()) as Array<{ id: number; name: string }>).find((x) => x.name === 'e2e-smoke');
  await api.dispose();
  expect(ws, 'workspace e2e-smoke').toBeTruthy();
  await page.goto(`#/workspace/${ws!.id}`);
  await expect(page.locator('#workspace-menu').first()).toBeVisible({ timeout: 30_000 });
  await w.settle(); await page.waitForTimeout(2000);

  await step(testInfo, '07 menu Ontology aperto', async () => {
    await page.locator('#workspace-menu').getByText('Ontology', { exact: true }).click(); await page.waitForTimeout(500);
    await shot(page.locator('app-workspace-menu, #workspace-menu').first().locator('xpath=ancestor-or-self::*[1]'), '07-menubar');
    await shot(page, '07-menubar-page');
    await page.keyboard.press('Escape'); await page.mouse.click(1500, 900);
  });
  await step(testInfo, '08 pannello Lexicon con i filtri aperti', async () => {
    await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click(); await w.settle();
    const tile = page.locator('#lexiconTile');
    await tile.locator('p-panel').locator('button').first().click(); await page.waitForTimeout(800);
    await shot(tile, '08-lexicon-filters');
  });
  await step(testInfo, '09 select aperto nei filtri del Lexicon', async () => {
    const tile = page.locator('#lexiconTile');
    await tile.locator('p-dropdown, p-select').first().click(); await page.waitForTimeout(500);
    await shot(page, '09-lexicon-filter-select');
    await page.keyboard.press('Escape');
    await tile.locator('p-panel').locator('button').first().click(); await page.waitForTimeout(500);
  });
  await step(testInfo, '10 editor della voce lessicale (tab)', async () => {
    await page.locator('#lexiconTile tr', { hasText: '@' }).nth(1).dblclick(); await w.settle(); await page.waitForTimeout(1000);
    const ed = page.locator('.jsPanel').filter({ has: page.locator('app-tabs-lexical-entry, app-workspace-lexicon-edit-tile') }).last();
    await expect(ed).toBeVisible();
    await ed.locator('.jsPanel-btn-maximize').click().catch(() => undefined); await page.waitForTimeout(800);
    await shot(page, '10-lexical-entry');
    const tabs = ed.locator('[role="tab"]').filter({ visible: true });
    const n = Math.min(await tabs.count(), 8);
    for (let i = 1; i < n; i++) {
      const t = tabs.nth(i);
      // tab disabilitato: aria-disabled (TabView) oppure classe p-disabled (Tabs, PrimeNG 19+)
      if ((await t.getAttribute('aria-disabled')) === 'true' || /\bp-disabled\b/.test((await t.getAttribute('class')) || '')) continue;
      const label = ((await t.innerText()).trim().replace(/[^\w]+/g, '-').toLowerCase() || String(i));
      await t.click(); await w.settle(); await page.waitForTimeout(500);
      await shot(page, `10-lexical-entry-tab-${i}-${label}`);
    }
    await tabs.first().click(); await page.waitForTimeout(500);
  });
  await step(testInfo, '11 select aperto nell\'editor della voce', async () => {
    const ed = page.locator('.jsPanel').filter({ has: page.locator('app-workspace-lexicon-edit-tile') }).last();
    await ed.locator('p-dropdown, p-select').filter({ visible: true }).first().click(); await page.waitForTimeout(500);
    await shot(page, '11-lexical-entry-select');
    await page.keyboard.press('Escape');
    await ed.locator('.jsPanel-btn-normalize').click().catch(() => undefined);
    await ed.locator('.jsPanel-btn-minimize').click().catch(() => undefined); await page.waitForTimeout(500);
  });
  await step(testInfo, '11b forma e senso nell\'editor della voce (tab)', async () => {
    await page.locator('#workspace-menu').getByText('Lexicon', { exact: true }).click(); await w.settle();
    await page.locator('#lexiconTile tr', { hasText: '@' }).nth(1).dblclick(); await w.settle(); await page.waitForTimeout(1000);
    const ed = page.locator('.jsPanel').filter({ has: page.locator('app-workspace-lexicon-edit-tile') }).last();
    await ed.locator('.jsPanel-btn-maximize').click().catch(() => undefined); await page.waitForTimeout(800);
    for (const [kind, name] of [['form', '11b-form'], ['sense', '11c-sense']]) {
      // riga "form (1)" / "sense (1)": espande e seleziona il primo figlio
      const row = ed.locator('tr', { hasText: new RegExp(`^\\s*${kind} \\(\\d+\\)`) }).first();
      await row.locator('button').first().click(); await w.settle(); await page.waitForTimeout(500);
      await row.locator('xpath=following-sibling::tr[1]').click(); await w.settle(); await page.waitForTimeout(1500);
      await shot(page, name);
      const tabs = ed.locator('app-tabs-form, app-tabs-sense').last().locator('[role="tab"]').filter({ visible: true });
      for (let i = 1; i < Math.min(await tabs.count(), 4); i++) {
        await tabs.nth(i).click(); await w.settle(); await page.waitForTimeout(800);
        await shot(page, `${name}-tab-${i}`);
      }
    }
    await ed.locator('.jsPanel-btn-normalize').click().catch(() => undefined);
    await ed.locator('.jsPanel-btn-minimize').click().catch(() => undefined); await page.waitForTimeout(500);
  });
  await step(testInfo, '11d popover di aiuto nel Lexicon', async () => {
    const tile = page.locator('#lexiconTile');
    await tile.locator('button:has(.pi-info-circle)').first().click(); await page.waitForTimeout(600);
    await shot(page, '11d-lexicon-popover');
    await page.keyboard.press('Escape'); await page.mouse.click(1500, 950);
  });
  await step(testInfo, '11e explorer dell\'ontologia (tab)', async () => {
    const onto = page.locator('#workspace-menu').getByText('Ontology', { exact: true });
    await onto.click(); await page.waitForTimeout(400);
    const explorer = page.locator('#workspace-menu').getByText('Explorer', { exact: true });
    if (!(await explorer.isVisible())) { await onto.hover(); await page.waitForTimeout(400); } // PrimeNG <= 17: sottomenu all'hover
    await explorer.click(); await w.settle(); await page.waitForTimeout(1500);
    const tile = page.locator('#ontologyExplorerTile');
    await expect(tile).toBeVisible();
    await shot(tile, '11e-ontology-0');
    const tabs = tile.locator('[role="tab"]').filter({ visible: true });
    for (let i = 1; i < Math.min(await tabs.count(), 5); i++) {
      await tabs.nth(i).click(); await w.settle(); await page.waitForTimeout(800);
      await shot(tile, `11e-ontology-${i}`);
    }
    await tile.locator('.jsPanel-btn-minimize').click().catch(() => undefined); await page.waitForTimeout(500);
  });
  await step(testInfo, '12 context menu nel Corpus', async () => {
    await page.locator('#workspace-menu').getByText('Corpus', { exact: true }).click(); await w.settle();
    const node = page.locator('#corpusExplorerTile .p-treenode-label, #corpusExplorerTile .p-tree-node-label').filter({ hasText: 'Decameron' }).first();
    await node.click({ button: 'right' }); await page.waitForTimeout(600);
    await shot(page, '12-corpus-contextmenu');
    await page.keyboard.press('Escape'); await page.mouse.click(1500, 950);
  });
  await step(testInfo, '13 finestra del testo', async () => {
    const node = page.locator('#corpusExplorerTile .p-treenode-label, #corpusExplorerTile .p-tree-node-label').filter({ hasText: 'Decameron' }).first();
    await node.dblclick(); await w.settle(); await page.waitForTimeout(2000);
    await shot(page, '13-text-window');
  });
  await step(testInfo, '14 editor del dizionario (tab)', async () => {
    await page.locator('#workspace-menu').first().getByText('Dictionary', { exact: true }).click(); await w.settle();
    await page.locator('#dictionaryTile tbody tr').filter({ hasText: /\w/ }).first().dblclick(); await w.settle();
    const ed = page.locator('.jsPanel').filter({ hasText: /Dictionary Editor/i }).last();
    await ed.locator('.jsPanel-btn-maximize').click().catch(() => undefined); await page.waitForTimeout(800);
    await shot(page, '14-dictionary-editor-0');
    const tabs = ed.locator('[role="tab"]').filter({ visible: true });
    for (let i = 1; i < Math.min(await tabs.count(), 4); i++) {
      await tabs.nth(i).click(); await w.settle(); await page.waitForTimeout(800);
      await shot(page, `14-dictionary-editor-${i}`);
    }
  });

  expect(w.pageErrors).toEqual([]);
});
