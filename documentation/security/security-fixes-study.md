# Maia-fe — Studio di fattibilità e impatto fix sicurezza (Dependabot)

- **Repo**: `klab-ilc-cnr/maia-fe` (Angular 14.2.9, ~30k LOC TS, 93 componenti)
- **Branch di lavoro**: `study/security-fixes` (da `master`, locale, nessun push)
- **Data**: 2026-08-07
- **Metodo**: fix applicati in ordine decrescente di *rischio reale* (severità × raggiungibilità) su 1 commit ciascuno, verificati con `ng build --configuration production`; il backend per lo smoke test è stato configurato in `src/proxy.conf.json` verso `https://192.168.92.24:11443` (VM risponde HTTPS 200).

---

## 1. Stato iniziale (baseline)

| Metrica | Valore |
|---|---|
| `npm audit` | **84** vulnerabilità: **3 critical · 45 high · 29 moderate · 7 low** |
| Alert Dependabot aperte (inizio task) | ~40 pacchetti distinti (dup package-lock/package.json escluse) |
| `ng build --configuration production` | ✅ OK (37 s); unico warning: budget initial 5.65 MB > 5 MB |
| `ng test` (karma/ChromeHeadless) | ❌ **già rotti su master**: 19 errori TS (spec + app, `strict`), `Executed 0 of 0` — condizione pre-esistente, non introdotta da questo lavoro |
| Toolchain | Node 16.20.2 (nvm), npm 8.19.4, TS 4.8.4 |

Cluster principale rilevato subito: **@angular/core·common·compiler** (10+ advisory high, XSS/DoS/cache-poisoning) la cui unica via di fix è un major upgrade (vedi §4).

---

## 2. Fix applicati (in ordine di rischio)

| # | Commit | Oggetto | Tipo | Effort |
|---|---|---|---|---|
| Setup | `a13f07f3` | `proxy.conf.json` per smoke test; in esecuzione puntato a **`https://192.168.92.24:11900`** (Spring, context `/maia`) con rewrite `/api→/maia/api`, `/lexo→/maia/lexo`, `/texto→/maia/texto`, `/cash→/maia/cash` (`secure:false`, `changeOrigin:true`) | config | S (~5 min) |
| F1 | `ed96623b` | **websocket-driver 0.7.5 (crit)**, **handlebars 4.7.9 (crit)** | override | S (~3 min) |
| A | `ab387c04` | 23 override dev/build-time major-invariato: flatted, follow-redirects, http-proxy-middleware, lodash 4.18.1, morgan, node-forge 1.4.0, on-headers, postcss 8.5.26, prismjs, qs 6.15.3, socket.io-parser, engine.io, tmp 0.2.7, webpack-dev-middleware, fast-uri, immutable, @babel/core·helpers·plugin-systemjs, @tootallnate/once, ip-address 10.4.0 | override | M (~8 min) |
| B | `a1312318` | Override multi-major: minimatch 3/5/9/10, picomatch 2/4, brace-expansion 1/2, js-yaml 3/4, glob 11 | override | M (~6 min) |
| C | `399d249d` | tar 7.5.18, piscina 4.9, ws 8.21, yaml 2.9, express 4.22, path-to-regexp 0.1.13, @babel/runtime 7.29 | override | M (~10 min) |
| F3 | `cee2bdcb` | **Runtime direct**: pdfmake 0.3.6 (SSRF high), sweetalert2 11.26, **uuid 11.1.1** + `skipLibCheck:true` (tipi CJS uuid11 incompatibili con TS 4.8) | bump + tsconfig | M (~10 min) |
| F4 | `410a80b9`+`59d22b3e` | **quill 1.3.7 → 2.0.3 → revert a 1.3.7**: lo smoke test ha mostrato che il `p-editor` di primeng 14 è incompatibile con quill 2 (editor vuoto: `setContents/clipboard.convert` non applicano il valore). Upgrade rinviato al workstream Angular/primeng | bump→revert | M (~10 min) |
| D | `1a69842a` | Ondata advisory ago-2026: tar 7.5.22, minimatch 3.1.4/9.0.8/10.2.5, brace-expansion 1.1.18, js-yaml 3.15.1/4.3.1, ajv 8.18.0/6.14.0 | override | M (~8 min) |

**Totale effort pratico ≈ 1 ora e mezza** di lavoro (setup + smoke test esclusi), 9 commit (8 fix + 1 revert) + 1 setup. Nessun adattamento di business-code richiesto; le uniche modifiche di config sono `skipLibCheck` (tsconfig) e il proxy.

---

## 3. Stato finale

| Metrica | Prima | Dopo |
|---|---|---|
| `npm audit` totale | 84 | **29** |
| critical | 3 | **0** |
| high | 45 | **16** |
| moderate | 29 | **13** |
| low | 7 | **0** |
| `ng build` prod | ✅ | ✅ (≈28 s) |

---

## 4. Residuo e quantificazione dell'upgrade Angular

### 4.1 Cosa resta e perché

| Residuo | Severità | Causa | Workstream |
|---|---|---|---|
| `@angular/*` (animations, cdk, common, compiler+cli, core, forms, localize, platform-browser±dynamic, router) — 12 voci | high | CVE 2026 richiedono **Angular ≥ 20.3.27** (≤19.2.25 senza fix disponibile; neppure 19.x) | **Upgrade Angular (v. §4.2)** |
| `primeng`, `@ng-bootstrap`, `@ngtools/webpack`, `@angular-devkit/build-angular` | high | eco-sistema Angular 14 bloccato (niente patch per la toolchain 14.x) | Upgrade Angular |
| `serialize-javascript` | high | fix = 7.0.5 che richiede **Node ≥ 20** (non caricabile su Node 16) | Upgrade toolchain (Node ≥20) |
| `webpack`(-chain: dev-middleware, copy/terser), `webpack-dev-server`, `sockjs`, `esbuild` | moderate | toolchain build 14.x; webpack >5.94 rompe CLI 14 | Upgrade toolchain |
| `@compodoc/*`, `http-auth`, `uuid@8` (dev, in angular/cli·sockjs·http-auth) | moderate | tooling documentale/dev, nessun fix compatibile sulla linea 8 | Upgrade toolchain (o disinstallo compodoc) |
| `quill` 1.3.7 | moderate | advisory `<=1.3.7`; il fix (quill 2) è **incompatibile col `p-editor` di primeng 14** (editor vuoto, verificato in smoke test) | upgrade primeng+Angular (workstream §4.2) |

Punto chiave per la fattibilità: il **residuo non è casuale ma tutto riconducibile a 2 cause strutturali**: (a) major upgrade Angular + (b) upgrade toolchain Node ≥20. Risolvendo quelle due, si chiude anche il residuo moderate dev-only e si sblocca passadicasa per le Dependabot future.

### 4.2 Quantificazione upgrade Angular 14 → 20.3.27

**Requisiti minimi confermati** (npm):
- `@angular/core` 20.3.27 → peer: `rxjs ^7.4`, **`zone.js ~0.15.0`**, `@angular/compiler` stesso tag
- `@angular-devkit/build-angular` 20.3 → **Node `^20.19 || ^22.12 || >=24`** (oggi siamo su 16), TS 4.8 → 5.5+

**Riferimento empirico — il branch abbandonato `enhancement/angular_update` (14→15, 2023):** 7 commit; fuori da package.json/lock hanno toccato solo `app-routing.module.ts`, `test.ts`, `tsconfig.json`, `.browserslistrc` e 1 template html (`workspace-lexicon-tile`). → un singolo major **è in gran parte meccanico** (`ng update` per tappa), con ritocchi puntuali.

**Estrapolazione 14 → 20 (6 major)** sulla superficie attuale (435 file .ts, 83 template, 93 componenti, 42 `ViewChild`):

| Voce | Stima effort |
|---|---|
| 6× `ng update @angular/core@X` da 15 a 20 + risoluzione breaking (API rimosse/deprecate, i18n, `ngcc` → esbuild, zone 0.15, default standalone in 19+) | M–L ogni tappa, ~2–4 h/tappa |
| Eco-sistema: primeng 14→17/18 (standalone + ri-theming), ng-bootstrap 13→17, @ngx-translate 14→16, angular-oauth2-oidc 13→17, zone.js 0.11→0.15 | M–L |
| **Repair suite test**: 172 `.spec.ts` oggi non compilano (`strict`) — serve risistemarli per avere CI utile | M–L (indipendente ma necessaria) |
| Toolchain Node: 16 → 20/22 (via nvm) + riallineamento CI/build | S–M |
| Smoke test completo con backend (Spring su VM `192.168.92.24:11900`) | M |

**Verdetto riepilogo**: upgrade Angular stimabile **~2–4 giorni/uomo** per un dev che conosce l'app (niente lavoro settimane). È però **obbligatorio** per chiudere le 12+ CVE high runtime e per sbloccare i fix bloccati da Node 16.

---

## 5. Note e rischi emersi

1. **Suite test rotta a monte**: `ng test` non esegue nulla da prima dello studio (19 errori TS). Non è colpa dei fix; andrà riparata quando si vuole CI.
2. **`skipLibCheck:true`** aggiunto a `tsconfig.json`: necessario per le tipi CJS di uuid 11 con TS 4.8. Prassi standard, ma va rivalutato all'upgrade (con TS 5.x si possono togliere le dipendenze `@types/uuid`).
3. **onnadata**: l'ecosistema pubblica nuove advisory (agosto 2026: tar critico, quill XSS, ecc.); il fix resta un *moving target* → senza upgrade al toolchain moderno la coda non si svuota mai del tutto.
4. **Budget build**: initial 5.65 MB > 5 MB (warning, non errore) — da rivalutare dopo l'upgrade.
5. **Smoke test (localhost:4200, backend Spring)**: login e navigazione ok (proxy su `/api`→Spring `/maia/api` funzionante). Unico *findings* runtime rilevante: **`p-editor` (primeng 14) non renderizza il contenuto con quill 2** → revert a quill 1.3.7 (v. §2 F4). Presente inoltre l'`NG0100` in dev mode nel tree-table del lexicon tile (timing di layout su `[scrollHeight]`, solo dev, cosmetico, pre-esistente: `panelHeight` aggiornato in `ngAfterViewInit`).
6. Nessun file di business-code modificato per la sicurezza: impatto su funzionalità atteso **nullo** (da completare la verifica dell'export PDF con pdfmake 0.3.6).

## 6. Raccomandazioni

1. **Merge del branch `study/security-fixes`** (0 critical, 29 totali vs 84) come mitigazione immediata.
2. **Pianificare l'upgrade Angular → 20.3.27** (o 21/22) come task dedicato: è l'unico modo di chiudere il residuo high c.d. "Angular".
3. **Alzare Node a ≥20** insieme all'upgrade → sblocca serialize-javascript, tar, esbuild, ecc.
4. **Riparare i test** contestualmente (CI di sicurezza: `npm audit --audit-level=high` in una pipeline, fallisce su high/critical).
5. Tenere monitorata la coda Dependabot e pianificare **quill 2 insieme all'upgrade di primeng** (non va fatto da solo su primeng 14); con toolchain moderna i fix sono point-release banali.
