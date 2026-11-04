# Maia-fe — Piano di aggiornamento Angular e librerie

- **Data**: 2026-11-02
- **Stato di partenza**: Angular 14.2.9 · Node 16.20.2 · TypeScript 4.8.4 · PrimeNG 14.1.2 · builder webpack (`@angular-devkit/build-angular:browser`)
- **Codice**: 254 file TS (27.2k righe, spec esclusi) · 93 componenti (tutti in NgModule, 0 standalone) · 82 template · 83 scss · 172 spec (non compilano)
- **Fonti**: angular.dev/reference/releases, angular.dev/reference/versions, dati della Update Guide ufficiale (`adev/src/app/features/update/recommendations.ts`, 199 passi da v15 a v22), guide di migrazione PrimeNG v19–v22 (primeng.org/migration), registro npm, GitHub API. Tutti i conteggi sul codice vengono da grep sul branch `study/security-fixes`.
- **Natura del documento**: solo piano. Nessuna modifica al codice.

---

## 0. Decisioni prese (2026-11-04)

| # | Tema | Decisione |
|---|---|---|
| 1–2 | Obiettivo | **Angular 21 + PrimeNG 21** (tutto MIT, LTS fino a 2027-06). Il salto a 22 (con Optimus UI) è **rinviato** di qualche mese, per lasciar maturare il fork |
| 3 | jsPanel | **Resta** durante l'upgrade. Se a v21 funziona, la sostituzione è un progetto separato (vedi §8 Backlog) |
| 4 | Test | Solo i test **strettamente necessari** automatizzati (build + smoke), più **test manuali** di Simone ai checkpoint |
| 5 | Persone | Lavoro solo nostro; `epic/#9044…` **già integrato** in master (0 commit propri, verificato) |
| 6 | Build e deploy | Su questa macchina. Backend di test: VM Alpine `10.10.0.19` dietro `https://klabsrv:19443` (backend sotto `/maia/maia/…`); `src/proxy.conf.json` locale già puntato lì e verificato. Non serve aprire altre porte |
| 8 | Branch | `study/security-fixes` unito a `master` (fast-forward, 2026-11-04); lavoro su **`upgrade/angular-21`** |

Di conseguenza, la **fase 4** (21 → 22) del §5 è fuori dal perimetro attuale: il traguardo è il checkpoint 21. **Stima aggiornata: fasi 0–3 + 5 ≈ 18–26 giorni/uomo.** Per la fase 4, PrimeNG 22 non è un'opzione (licenza); si valuterà Optimus UI.

---

## 1. Quale versione: obiettivo **Angular 22**

| Versione | Stato (policy ufficiale) | Fine supporto | Node | TypeScript |
|---|---|---|---|---|
| 14 (attuale) | **non supportata** | LTS terminato 2023-11 | 14/16 | 4.6–4.8 |
| 20 | LTS | **2026-11-28 (tra 26 giorni)** | ^20.19 / ^22.12 / ^24 | 5.8–5.9 |
| 21 | LTS | 2027-06 | ^20.19 / ^22.12 / ^24 | 5.9 |
| **22** | **Active** | Active fino a 2027-06, **LTS fino a 2028-06** | ^22.22.3 / ^24.15 / ^26 | 6.0 |

- Da v22 Angular passa a **un major ogni 12 mesi** e a **24 mesi di supporto** (prima erano 6 e 18). Il prossimo major (v23) è previsto per ~giugno 2027.
- **v20 da escludere**: il suo LTS finisce prima che il lavoro sia concluso.
- **v21**: va bene come *checkpoint intermedio* (ultimo punto in cui tutto lo stack è MIT, vedi §3), ma ha solo ~7 mesi di supporto rimasti.
- **v22**: ~20 mesi di supporto e l'unica scelta che non richiede un altro major a breve.
- `ng update` sale **un major alla volta**: da 14 a 22 sono **8 salti** (15, 16, 17, 18, 19, 20, 21, 22).
- **Node** va aggiornato in tappe: 16 (v14–16) → 18 (v17–19) → **24 LTS** (v20–22; supportato fino ad aprile 2028). Node serve solo a build-time: maia-be e i server non sono toccati.
- **Browser**: v22 supporta la baseline "widely available" del 2026-05-07 (circa: browser degli ultimi 30 mesi). La `.browserslistrc` attuale è già più restrittiva: nessun problema.

---

## 2. Cosa comporta per l'applicazione (incrocio tra Update Guide e codice)

Dei 199 passi ufficiali, la maggior parte riguarda API che **non usiamo** (verificato: 0 occorrenze di `ComponentFactoryResolver`, `entryComponents`, `InjectFlags`, `TestBed.get`, `NgModuleFactory`, Hammer, `reportProgress`, `ng-reflect-*`, `moduleId`, SSR, Material). Quelli che **ci riguardano**:

| Salto | Cambiamento | Impatto su MAIA | Gestione |
|---|---|---|---|
| v15 | eliminato `relativeLinkResolution: 'legacy'` | **lo usiamo** (`app-routing.module.ts`), con rotte padre `path: ''` + figli, 1 `routerLink` relativo (`side-menu`), 3 `navigate(..., {relativeTo})` | test mirato di navigazione |
| v16 | rimosso ngcc: solo librerie Ivy | tutte le librerie Angular che restano sono Ivy | nessuno |
| v17 | `NgSwitch` usa `===` invece di `==` | 32 `ngSwitch` | warning a runtime, da verificare |
| v17–18 | nuovo builder esbuild (`@angular/build:application`); webpack **deprecato in v22** | `angular.json`; `@import url('~font-awesome/…')` in `styles.scss` (la sintassi `~` è solo webpack); `require('package.json')` in `footer.component.ts`; l'output passa a **`dist/<nome>/browser/`** | migrazione con schematic ufficiale; **cambia la struttura dello zip di deploy** |
| v19 | standalone di default | 93 componenti in NgModule | `ng update` aggiunge `standalone: false` in automatico |
| v20 | le parentesi nei template sono rispettate; `in`/`void` diventano operatori | `relations.ts` ha una proprietà `in` (accesso `rel.in`: ok) | verifica |
| v20.2 | `@angular/animations` deprecato | `main-layout` usa `trigger/animate`; PrimeNG 21 passa ad animazioni CSS | si può tenere; migrazione a CSS opzionale |
| v21 | le app con zone.js devono dichiarare `provideZoneChangeDetection()` | `AppModule` | 1 riga (migrazione automatica) |
| v21 | type-check dei `host` binding attivo di default | da vedere in build | correzioni puntuali |
| **v22** | **i componenti senza `changeDetection` diventano `OnPush`** | **81 componenti su 93**; l'app si basa su CD di default + `setTimeout` (17) + DOM manipolato fuori da Angular (jsPanel) | serve mantenere `Eager` esplicito (verificare che la migrazione `ng update` lo applichi; altrimenti va fatto a mano) — **rischio principale** |
| v22 | `?.` nei template restituisce `undefined` invece di `null` | confronti `=== null` nei template | verifica |
| v22 | `paramsInheritanceStrategy` di default `'always'` | 4 letture di parametri di rotta | test |
| v22 | TypeScript 6.0; `strictTemplates` di default | già attivo (`strictTemplates: true`) | nessuno |

**Integrazione Angular↔jsPanel (punto delicato)**: `workspace.component.ts` (2.1k righe) crea i componenti con `vcr.createComponent(...)` e ne sposta il DOM dentro i pannelli jsPanel, fuori dall'albero gestito da Angular. Questo funziona con zone.js e la CD di default; con `OnPush` di default (v22) o senza zone smetterebbe di aggiornarsi. Quindi: **zone.js resta**, e **`Eager` va mantenuto** su questi componenti.

---

## 3. PrimeNG: il punto decisivo (licenza)

| Versione | Licenza | Angular | Note |
|---|---|---|---|
| 14 (attuale) | MIT | 14 | |
| 15–17 | MIT | 15–18 | 17 è l'ultima con il vecchio sistema di temi |
| 18–21 | MIT ("community versions") | 17–21 | **nuovo sistema di temi**: i CSS `primeng/resources/themes/*` non esistono più |
| **22** | **proprietaria "PrimeUI License"** | **solo ^22.1** | richiede **chiave di licenza** con rinnovo annuale; Community License gratuita solo con requisiti (<10 dipendenti, <5 sviluppatori… oppure non-profit / open source non commerciale) |

Conseguenze:
- **Angular 22 + PrimeNG richiede PrimeNG 22**: PrimeNG 21 dichiara solo `@angular/core ^21`.
- Con PrimeNG 22 anche **`p-editor` è deprecato** e sostituito da un "PrimeUI PRO Editor" **a pagamento** (rimozione prevista in v24). Lo usiamo in 8 file.
- Sono deprecati in v22 (rimozione v24) anche componenti che usiamo: MultiSelect (3), Password (7), ColorPicker (3), ScrollPanel (3).
- **primeicons 8** è sotto licenza PrimeUI; **primeicons 7** è MIT.
- Le dipendenze `@primeuix/*` richieste da PrimeNG 21 si risolvono oggi a versioni MIT (verificato): fermarsi a PrimeNG 21 non tira dentro codice proprietario.
- MAIA è open source e installabile da terzi (README): una chiave di licenza per ogni installazione sarebbe un attrito anche nel caso in cui il CNR rientri nella Community License.

**Alternativa: Optimus UI (`@openng/optimus-ui`)**, fork community **MIT** di PrimeNG 21 (l'ultima MIT), nato a luglio 2026 dopo il cambio di licenza: Angular ≥ 21 (la 2.x richiede `^22.1.4`), ~64k download a settimana, 100+ contributor, repo attivo (ultimo push 2026-11-03), guida ufficiale "Migrating from PrimeNG", stessi preset (Aura/Lara/Nora). Rischio: progetto giovane (4 mesi) con 1.114 issue aperte.

| Opzione | Pro | Contro |
|---|---|---|
| **A. Angular 22 + Optimus UI** (consigliata) | MIT; supporto fino al 2028; API = PrimeNG 21 | fork giovane: da tenere monitorato |
| B. Angular 22 + PrimeNG 22 | vendor storico | licenza/chiave; Editor verso PRO a pagamento; da verificare con l'ufficio legale |
| C. Fermarsi ad Angular 21 + PrimeNG 21 | tutto MIT e stabile | supporto solo fino a 2027-06: nuovo salto tra pochi mesi |

**Strategia che non preclude nulla**: si arriva prima ad **Angular 21 + PrimeNG 21** (checkpoint stabile e tutto MIT), e la scelta A/B si fa solo all'ultimo salto, con le informazioni aggiornate a quel momento.

### Lavoro PrimeNG sul codice (indipendente dall'opzione)

| Voce | Occorrenze | Quando |
|---|---|---|
| Nuovo sistema di temi (Lara preset al posto di `lara-light-blue/theme.css` + `primeng.min.css`) | `angular.json` + `AppModule` | v18 |
| Override CSS delle classi interne `.p-*` da rivedere | **114 in 23 file**, più **77 `::ng-deep`** | v18 — **la voce più costosa** (QA visiva) |
| Componenti rinominati (deprecati, non ancora rimossi): Dropdown→Select, InputSwitch→ToggleSwitch, OverlayPanel→Popover, TabView→Tabs | 43 + 6 + 2 + 6 | v18–21 (prima di v22) |
| `pTemplate` (rimosso in PrimeNG 22) | **174 in 46 file** | prima di v22* |
| `styleClass` sui componenti host (rimosso in 22) | 52 in 20 file | prima di v22* |
| `pButton` con `icon`/`label`/`iconPos` (rimossi in 22) | 84 in 39 file | prima di v22* |
| `responsiveLayout` (Table), `contextMenuSelectionMode` | 6 + 1 | prima di v22* |
| PrimeFlex 3 non compatibile con PrimeNG 18+ → PrimeFlex 4 (MIT, archiviato) oppure utility Bootstrap | ~600 classi (`flex` 146, `field` 142, `col-*`, `grid`…) in parte **sovrapposte a Bootstrap** | v18 |
| Classi PrimeFlex 2 già morte oggi (`p-d-flex`, `p-jc-between`…) | 10 | subito |

\* Obbligatorio con PrimeNG 22; con Optimus va verificato quali rimozioni ha recepito (domanda aperta).

---

## 4. Stato delle altre librerie

| Libreria | Attuale → ultima | Manutenzione | Uso in MAIA | Raccomandazione |
|---|---|---|---|---|
| **jspanel4** | 4.16.1 → 4.16.1 | **abbandonata**: ultimo commit 2022-11-03, autore inattivo, nessun successore | 2 file (`workspace`, `text-window`), 44 chiamate; layout **salvato nel DB** di maia-be (`tile.tileConfig`, ripristinato con `jsPanel.layout.restoreId`) | **Tenerla durante l'upgrade** (è JS puro caricato da `scripts`: non dipende da Angular e funziona col builder esbuild). **Sostituirla in un progetto separato** (candidato: *dockview*, MIT, ~823k download/settimana, attivo), con migrazione dei layout salvati |
| quill | 1.3.7 → 2.0.3 | attiva | `p-editor` (8 file) | passare a quill 2 insieme a PrimeNG ≥ 17 (chiude l'advisory XSS) |
| @ng-bootstrap/ng-bootstrap | 13 → 21 | attiva | **inutilizzata** (solo `NgbModule` importato, 0 usi) | **rimuovere** (insieme a `@popperjs/core`) |
| @auth0/angular-jwt | 5.1 → 5.2 | attiva | **0 usi** | **rimuovere** |
| angular-oauth2-oidc | 13 → 22 | attiva | **0 usi** (solo un commento nell'env demo) | **rimuovere** |
| font-awesome (v4.7) | 4.7.0 | **abbandonata** (2017) | importata in `styles.scss` con `~` (blocca esbuild), **0 classi usate** | **rimuovere** |
| @fortawesome/* | svg-core 1.2 + icone 5.15 + CSS free 6.2 (versioni miste) | attiva (v7) | 14 icone SVG (20 file) + 20 classi CSS | allineare a una sola major; valutare il consolidamento con primeicons (oggi convivono **3 sistemi di icone**) |
| primeicons | 6.0.1 | repo archiviato; **v8 proprietaria** | 150 occorrenze in 54 file | fermarsi a **7.x (MIT)**, oppure le icone di Optimus (`@openng/icons`, MIT) |
| primeflex | 3.2.1 → 4.0.0 | **archiviata** (2025-02) | vedi §3 | PrimeFlex 4 congelato, oppure migrazione a utility Bootstrap |
| bootstrap | 5.2.2 → 5.3.8 | attiva | 431 classi + `data-bs-dismiss` (modali) | aggiornare (minor) |
| jquery | 3.6 → 4.0 | attiva | 10 usi in 1 file + `scripts` globali | rimuovere (DOM API) o lasciarla; non serve né a jsPanel 4 né a Bootstrap 5 |
| @ngx-translate/* | 14 → 18 | attiva | 403 occorrenze, loader in 1 file | aggiornare a tappe; il loader passa a `provideTranslateHttpLoader` |
| sweetalert2 | 11.26 | attiva | 50 usi in 13 file | tenerla. Il codice "protestware" che bloccava i click sui domini `.ru/.su` **è nel bundle oggi in produzione** (versione vecchia) ma **non più nella 11.26** già adottata |
| pdfmake / html-to-pdfmake | 0.3.11 / 2.5.32 | attive | export PDF | tenere |
| html-entities | 2.5 → 2.6 | stabile, poco attiva | 8 file | tenere (sostituibile con `DOMParser`) |
| uuid | 11 → 14 | attiva | 4 usi | tenere, oppure `crypto.randomUUID()` nativo (richiede HTTPS: ok in produzione) |
| rxjs / zone.js / tslib | 7.4 / 0.11 / 2.8 | attive | | 7.8 / 0.15–0.16 con i salti |
| @angular/localize | 14 | | caricata nei polyfill, **0 usi** di `$localize`/`i18n` | **rimuovere** |
| karma + jasmine | 6.4 | **Karma deprecato** (README ufficiale) | 172 spec che non compilano | decidere (domanda 4): riparare, passare a Vitest (default da Angular 21) o sostituire con e2e |
| eslint | 8.49 | **v8 a fine vita**; manca `angular-eslint` | | eslint 9/10 (flat config) + angular-eslint, opzionale |
| schematics-scss-migrate | 1.3 | ferma dal 2023 | non usata | **rimuovere** |
| @compodoc/compodoc | 1.1 → 2.0 | attiva | documentazione | aggiornare alla fine |

---

## 5. Piano a fasi

Branch dedicato (es. `upgrade/angular-22`) che parte da `master` **dopo il merge di `study/security-fixes`**. Un commit per salto: build verde + smoke test prima di passare al salto successivo.

| Fase | Contenuto | Node / TS | Stima |
|---|---|---|---|
| **0. Preparazione** (ancora su v14) | rete di sicurezza: smoke e2e (Playwright) su ~10 flussi critici: login, workspace (apri, salva, ripristina layout), tile testo + annotazione, KWIC, lessico + modifica, `p-editor`, export PDF, utenti/tagset/layer · rimozione delle dipendenze morte (ng-bootstrap, popper, angular-jwt, oauth2-oidc, font-awesome 4, localize, schematics-scss-migrate, @types/uuid) · `require(package.json)` → import · classi PrimeFlex 2 morte · decisione su `production: false` | 16 / 4.8 | 3–4 gg |
| **1. 14 → 15 → 16** | PrimeNG 15–16, ngx-translate, fontawesome; **`relativeLinkResolution`** (test di navigazione); zone 0.13 | 16 / 4.9→5.1 | 2–3 gg |
| **2. 16 → 17 → 18** | PrimeNG 17 (ultima con i vecchi temi); **builder esbuild** (struttura `browser/` nel pacchetto di deploy, rimozione `~`); quill 2 con `p-editor` | **18** / 5.2→5.4 | 3–4 gg |
| **3. 18 → 19 → 20 → 21** | `standalone: false` (automatico); **PrimeNG 18→21: nuovo sistema di temi**, revisione di 114 override + 77 `::ng-deep`, PrimeFlex 4, componenti rinominati, rimozione anticipata di `pTemplate`/`styleClass`/`pButton icon` (310 occorrenze, in buona parte meccaniche); `provideZoneChangeDetection` | **24** / 5.5→5.9 | 7–10 gg |
| ✅ **Checkpoint** | **Angular 21 + PrimeNG 21: tutto MIT, supportato fino a 2027-06.** Rilasciabile | | |
| **4. 21 → 22** | Optimus UI (o PrimeNG 22); **mantenere `Eager` sugli 81 componenti**; `?.`→`undefined`; `paramsInheritanceStrategy`; ngx-translate 18; fontawesome 7 (alcune icone rinominate, es. `faHouseDamage`) | 24 / 6.0 | 3–5 gg |
| **5. QA e rilascio** | regressione completa, UAT con gli utenti, aggiornamento README/AGENTS/procedura di deploy | | 3–5 gg |
| **Totale** | | | **≈ 21–31 giorni/uomo** (4–6 settimane per 1 sviluppatore) |

**Correzione della stima precedente**: lo studio di sicurezza indicava 2–4 giorni per l'upgrade Angular. Era il solo framework e sottostimava molto l'ecosistema: il cambio del sistema di temi di PrimeNG (v18) e il cambio di licenza (v22) da soli valgono più del framework.

**Fuori perimetro (progetti separati)**:
- sostituzione di jsPanel, con compatibilità o migrazione dei layout salvati nel DB: 8–15 gg;
- riparazione o migrazione della suite di unit test (Karma → Vitest): 5–10 gg;
- consolidamento delle icone, rimozione di jQuery, angular-eslint: 2–4 gg.

---

## 6. Rischi principali

1. **Change detection in v22** (OnPush di default) + DOM gestito da jsPanel → pannelli che non si aggiornano. Mitigazione: `Eager` esplicito, zone.js mantenuto, smoke test sui tile.
2. **Regressioni visive** dal nuovo sistema di temi PrimeNG (114 override + 77 `::ng-deep`). Mitigazione: screenshot prima/dopo delle pagine principali (Playwright).
3. **Assenza di test automatici**: oggi nessuna rete di sicurezza. Mitigazione: fase 0.
4. **Licenza PrimeNG 22**: decisione da prendere prima della fase 4.
5. **Fork Optimus giovane**: monitorarlo; via d'uscita = PrimeNG 22 con licenza.
6. **Conflitti con lo sviluppo in corso** (`epic/#9044…`): upgrade lungo su 300+ file. Mitigazione: freeze o rebase frequenti, salti piccoli.
7. **Cambio della struttura del pacchetto di deploy** (esbuild: `browser/`): aggiornare la procedura di pubblicazione.
8. **Il runtime-URL (`environment.production.ts`) resta invariato**: nessun impatto sui due scenari di rete (proxy klab e NAT KVM).

---

## 7. Browser supportati (domanda 7)

Angular 21 genera codice per la baseline "widely available" al 2025-10-20. Versioni minime (browserslist):

| Browser | Minimo | Rilasciato | Conseguenza pratica |
|---|---|---|---|
| Chrome / Edge | 111 | marzo 2023 | **Windows 7 / 8.1 escluso** (Chrome si ferma alla 109) |
| Firefox | 112 | aprile 2023 | Firefox ESR 115 va bene, anche su Windows 7 |
| Safari (macOS) | 16.4 | marzo 2023 | serve **macOS 11 Big Sur o successivo**; con macOS ≤ 10.15 usare Chrome o Firefox |
| Safari iOS | 16.4 | marzo 2023 | iPhone 8 / X o successivi |

Con un browser più vecchio l'app tipicamente **non parte affatto** (pagina bianca, errore di sintassi in console), non degrada in modo parziale. Già oggi la `.browserslistrc` del progetto punta solo agli ultimi browser, quindi il vincolo cambia poco. Chrome, Edge e Firefox con aggiornamento automatico non hanno problemi.

---

## 8. Backlog (dopo il checkpoint 21)

- **jsPanel4**: progetto separato di sostituzione (candidato: dockview), con compatibilità o migrazione dei layout salvati nel DB (`tile.tileConfig`). Prima, solo piccoli aggiustamenti se a v21 emergono problemi.
- **Salto ad Angular 22 + Optimus UI** (fase 4), quando il fork sarà più maturo. Prima di partire: Node ≥ 22.22.3 o 24.15 (sulla macchina c'è 24.14.1).
- Unit test: riparazione o migrazione Karma → Vitest.
- Consolidamento delle icone (primeicons / fontawesome), rimozione di jQuery, angular-eslint.

---

## 9. Domande aperte (storico)

1. **Libreria UI per Angular 22**: Optimus UI (MIT, consigliata), PrimeNG 22 con licenza (serve verifica legale e una chiave per ogni installazione), o fermarsi ad Angular 21?
2. **Obiettivo**: andare direttamente a 22, oppure rilasciare prima il checkpoint 21?
3. **jsPanel**: d'accordo a tenerla durante l'upgrade e sostituirla in un progetto separato?
4. **Test**: investire nella rete e2e Playwright (consigliato)? Per gli unit test Karma: riparare, migrare a Vitest o abbandonare?
5. **Persone e tempi**: chi lavora all'upgrade? Lo sviluppo su `epic/#9044…` continua in parallelo (serve un freeze)?
6. **Build e deploy**: chi produce i pacchetti e su quali macchine (versione di Node)? Ci sono script che dipendono dalla struttura di `dist/`?
7. **Browser degli utenti**: ci sono postazioni con browser vecchi (oltre 2,5 anni)?
8. **Prerequisito**: facciamo prima il merge di `study/security-fixes` su `master`?
