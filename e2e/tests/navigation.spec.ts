import { expect, test } from '@playwright/test';
import { annotate, hashPath, uiLogin, watchPage } from './support';

/**
 * Navigazioni RELATIVE, fatte con i clic (non cambiando l'URL a mano).
 * Servono per il salto ad Angular 15, che elimina `relativeLinkResolution: 'legacy'`
 * (app-routing.module.ts): le rotte padre hanno path '' e la risoluzione dei link
 * relativi da rotte con path vuoto e' proprio cio' che cambia.
 * Gli URL attesi sono quelli osservati su Angular 14 (baseline).
 * Solo letture: nessun dato viene modificato.
 */
test('navigazioni relative (relativeLinkResolution)', async ({ page }, testInfo) => {
  const w = watchPage(page);
  await uiLogin(page);
  await w.settle();

  await test.step('menu laterale: routerLink="lexicon" (relativo) e "/tagsets" (assoluto)', async () => {
    await page.goto('#/tagsets');
    await w.settle();
    // La voce Lexicon e' nascosta quando environment.demoHide e' true (build di produzione):
    // in quel caso il link relativo non c'e' e il controllo viene saltato (annotato).
    const lexiconLink = page.locator('app-side-menu a', { hasText: 'Lexicon' });
    if (await lexiconLink.count() === 0) {
      testInfo.annotations.push({ type: 'url', description: 'Lexicon: voce non presente nel menu (demoHide), controllo saltato' });
    } else {
      await lexiconLink.first().click();
      await w.settle();
      testInfo.annotations.push({ type: 'url', description: `Lexicon -> ${hashPath(page)}` });
      expect(hashPath(page)).toBe('/lexicon');
    }

    await page.locator('app-side-menu a', { hasText: 'Tagset' }).first().click();
    await w.settle();
    expect(hashPath(page)).toBe('/tagsets');
  });

  await test.step('tagset: dettaglio navigate([id], relativeTo) e ritorno navigate(["../"])', async () => {
    await page.getByRole('button', { name: 'Edit tagset items' }).first().click();
    await w.settle();
    const detail = hashPath(page);
    testInfo.annotations.push({ type: 'url', description: `dettaglio tagset -> ${detail}` });
    expect(detail).toMatch(/^\/tagsets\/\d+$/);

    await page.getByRole('button', { name: 'Back to list' }).click();
    await w.settle();
    testInfo.annotations.push({ type: 'url', description: `ritorno -> ${hashPath(page)}` });
    expect(hashPath(page)).toBe('/tagsets');
  });

  await test.step('layer: dettaglio navigate([id], relativeTo)', async () => {
    await page.goto('#/layers');
    await w.settle();
    // primo pulsante "feature" (icona layer-group) della prima riga di dati
    await page.getByRole('row').nth(1).locator('button.p-button-info').click();
    await w.settle();
    testInfo.annotations.push({ type: 'url', description: `dettaglio layer -> ${hashPath(page)}` });
    expect(hashPath(page)).toMatch(/^\/layers\/\d+$/);
  });

  expect(w.pageErrors, 'eccezioni JS durante le navigazioni').toEqual([]);
  annotate(testInfo, 'navigazioni', w);
});
