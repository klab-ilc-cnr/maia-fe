# Smoke test e2e (Playwright)

Test minimi per l'upgrade Angular: si lanciano a ogni salto di versione, contro l'app in esecuzione.

**Toolchain separata dall'app**: qui serve Node ≥ 20 (nvm `24.14.0`); l'app sul branch `upgrade/angular-21` usa Node 22 (`22.23.4`), su `master` Node 16.
Le dipendenze di questa cartella non entrano nel `package.json` dell'app.

## Cosa verifica (`tests/smoke.spec.ts`)

1. pagina di login e **titolo** della card (`MAIA - …`);
2. login dall'interfaccia;
3. apertura delle pagine principali (workspace, lexicon, tagset, layer, utenti), con **righe di dati** dove la VM di test ne ha;
4. apertura del workspace dedicato **`e2e-smoke`** (creato via API al primo giro, poi riutilizzato);
5. pannelli **jsPanel** *Corpus* e *Lexicon* con il componente Angular dentro;
6. **salvataggio e ripristino del layout** (uscita dal workspace → `PUT /api/workspaces/layout`; rientro → pannelli ripristinati dal DB).

Fallisce su: titolo errato, login fallito, pagine o pannelli che non compaiono, tabelle vuote, **eccezioni JS non gestite**.
Errori di console e risposte HTTP ≥ 400 vengono solo **annotati** nel report.

## Credenziali

File locale **fuori dal repository** (e fuori da Nextcloud), permessi 600: `~/.config/maia/e2e.env`

```
MAIA_E2E_USER=...
MAIA_E2E_PASSWORD=...
```

## Come si lancia

```bash
# 1) l'app (Node 22 sul branch di upgrade; Node 16 su master), con il proxy verso klabsrv:19443
nvm use 22.23.4 && npx ng serve            # dalla radice del repo

# 2) i test (Node 24), da questa cartella
nvm use 24.14.0
npm ci && npx playwright install chromium   # solo la prima volta
E2E_LABEL=ng14 E2E_EXPECT_TITLE="MAIA - VocaBO - DEV UPGRADE" npx playwright test
```

### Contro il pacchetto di produzione (consigliato prima di consegnare uno zip)

`tools/serve-package.py` riproduce la topologia della VM di test: file statici sotto `/maia/`,
`/maia/maia/…` inoltrato al backend `https://klabsrv:19443`.

```bash
npx ng build -c production --base-href=""                 # dalla radice (Node 22)
python3 e2e/tools/serve-package.py dist/projectx-fe 8099 &
E2E_BASE_URL=http://127.0.0.1:8099/maia/ npx playwright test  # da e2e/ (Node 24)
```

In produzione `environment.demoHide` è `true`: alcune voci di menu (es. Lexicon nel menu laterale) non ci sono,
i test lo gestiscono.

Variabili utili: `E2E_BASE_URL` (default `http://localhost:4200/`; es. `https://klabsrv:19443/maia/` per l'installazione di test),
`E2E_LABEL` (cartella degli screenshot), `E2E_EXPECT_TITLE`, `E2E_ENV_FILE`.

Output in `artifacts/` (ignorata da git): `screens/<label>/` per i confronti prima/dopo, `report/` (HTML), `test-results/` (trace dei fallimenti).
