# Maia-fe — Agent Guide (AGENTS.md)

Reference doc for AI agents working on this repository. Keep it updated when the project changes.

## Overview

- **What it is**: MAIA is an open, collaborative web tool for text annotation, e-lexicography and lexical linking, built by [KLAB @ ILC-CNR](https://www.ilc.cnr.it/klab/). This repo is the **Angular frontend**, currently **Angular 14.2.9** (project name in `angular.json`: `projectxFE`).
- **Backend**: `maia-be` (Spring Boot). Others: **TexO** (text backend; replaced the legacy CASH app) and **LexO** (lexicon backend).
- **Versions**: package.json `name: maia-fe`, `version: 0.20.0`. Docs/versions map in `README.md`.
- **Branches**: `master` (stable), `develop` (latest), active `epic/#9044-sviluppi-2026-integrazioni-e-dipendenze`. No CI workflows configured.

## Toolchain (MUST FOLLOW)

- **Node 16.20.2 via nvm** — the Angular 14 build breaks on newer Node (e.g. v24). Use: `export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use 16.20.2`.
- npm 8.19.4, TypeScript **4.8.4** (project constraint).
- Commands:
  - `npm install` — fine on Node 16 (engine warnings are advisory).
  - `npm run build-prod` (=`ng build --configuration production --base-href='./'`) — **passes** (±30s). Budget warning only (initial 5.65 MB > 5 MB).
  - `npm start` (=`ng serve`) — dev server on `http://localhost:4200`, uses `src/proxy.conf.json`.
  - `npm test` (=`ng test`, karma/ChromeHeadless) — **BROKEN on master**: ~19 TS errors under `strict` (spec + app files), `Executed 0 of 0`. Pre-existing, not caused by security work. Fixing it is a separate task (172 `.spec.ts` exist).
  - `npm run compodoc` — offline doc generation (uses `tsconfig.doc.json`).

## Project map (`src/`)

- `src/app/pages/` — routed views: `login`, `workspace`, `lexicon`, `tagsets`, `layers`, `usersManagement`.
- `src/app/controllers/` — components: `editors/` (form/sense/lexical editors, `p-editor` rich text), `explorers/` (ontology), `page-controllers/` (header/footer/loader), `popup/`, `tab-controllers/`, `tooltips/`, `viewers/`, `icons/`.
- `src/app/services/` — API services: `workspace` (texts/corpus via TexO), `authentication`, `dictionary`, `ontology`, `lexicon`, `storage`, etc. Interceptors in `src/app/interceptors/` (JWT via `authentication.interceptor`).
- `src/app/models/` — domain models (annotation, corpus, dictionary, lexicon, ontology, tagset, text, texto, tile…).
- `src/app/modules/shared.module.ts` — central NgModule exporting primeng modules (incl. `EditorModule`).
- `src/app/guards/` — `authGuard` (checks `StorageService.isLoggedIn()/isExpired()`).
- Other: `forms/` (autocomplete widgets), `layouts/`, `routes/`, `pipes/`, `helpers/`, `validators/`, `constants/`.
- `src/environments/` — `environment.ts` (local dev: relative URLs), `environment.production.ts` (computes `serverUrl` from `window.location` + `/maia`), plus `demo`/`collaudo`/`complit`/`demo-articolo` variants selected via `fileReplacements` in `angular.json`.

## Backend & proxy

- `src/proxy.conf.json` → **`https://192.168.92.24:11900`** (maia-be Spring, context `/maia`) with `pathRewrite`:
  - `/api` → `/maia/api`
  - `/lexo` → `/maia/lexo` (LexO, still used by ontology/lexicon/dictionary services)
  - `/texto` → `/maia/texto` (TexO)
  - `secure:false`, `changeOrigin:true`. The legacy CASH `/cash` entry was **removed** (app fully replaced by TexO).
- **Login flow**: POST `/api/authentication/authenticate` `{username,password}` → JWT as plain text; then `/api/...` calls.

## Security status (study on branch `study/security-fixes`, Aug 2026)

- `npm audit`: **84 → 29** (critical 3→0, high 45→16, moderate 29→13, low 7→0). Build green.
- Mechanism: `overrides` in `package.json` for transitive deps + direct bumps (`pdfmake 0.3.6`, `sweetalert2 11.26`, `uuid 11.1.1`) + `tsconfig.json` `skipLibCheck:true` (uuid 11 CJS typings incompatible with TS 4.8).
- **Residual, grouped by root cause**:
  - 12 `@angular/*` high CVEs → need **Angular ≥ 20.3.27** (`<=19.2.25` has no fix, not even 19.x). Quantified: major upgrade ≈ 2–4 dev-days (reference: stale branch `enhancement/angular_update`, a 14→15 attempt touching only ~3 app files).
  - `serialize-javascript` → fix requires **Node ≥ 20** (toolchain upgrade; also unlocks esbuild/tar/etc.).
  - webpack chain, `@angular-devkit/*`, compodoc, dev tools → tied to Angular CLI 14.
  - **quill pinned at 1.3.7** — see Gotchas.
- Full matrix and effort: `documentation/security/security-fixes-study.md`.

## Gotchas for AI agents

- **Do NOT bump `quill` to 2.x**: primeng 14's `p-editor` is built for quill 1.x and renders an *empty editor* with quill 2 (verified in smoke test). quill 2 must wait for the primeng+Angular upgrade.
- **Do NOT bump primeng/@ng-bootstrap/@ngx-translate without the Angular upgrade** — they are pinned to the 14.x toolchain.
- **npm overrides**: you may NOT override a package that is also a *direct dependency* (`EOVERRIDE`). For multi-major transitive deps use version-keyed keys, e.g. `"minimatch@3": "3.1.4", "minimatch@9": "9.0.8"`. Verify target versions exist before writing them (some advisories are *unfixed* — e.g. newest tar `<=7.5.18` critical had no patch until 7.5.22 was published).
- Always run builds with **Node 16.20.2**; newer Node breaks Angular 14 (`ng build`).
- `NG0100: ExpressionChangedAfterItHasBeenCheckedError` in dev on the lexicon tile (`workspace-lexicon-edit-tile`, `[scrollHeight]="panelHeight-40+'px'"`, panelHeight set in `ngAfterViewInit`) is **cosmetic and dev-only** — ignore.
- `bootstrap-autofill-overlay.js` console errors come from the Bitwarden browser extension — ignore.
- **No CHANGELOG.md** convention — do not create one unless asked; use/docs live in README + `documentation/`.

## Recent work (this branch / chat memory)

- Audit 84→29 via overrides (fix commits) — build verified each step.
- Backend proxy debugged: VM `192.168.92.24:11443` serves only the deployed FE (Apache, `/maia/`); the actual Spring API is on **`:11900`** context `/maia`. Left proxy pointing at `:11900`.
- quill 2 regression discovered & reverted (commit `59d22b3e`).
- CASH fully removed: proxy `/cash`, `cashUrl` in demo env, ~250 lines of commented legacy methods in `workspace.service.ts`, and the two "GESTIONE BUG SULLE API CASH" comments rewritten neutrally (active `normalizzazione features` code kept).
- Latest state: branch `study/security-fixes` (local, not pushed) with `npm audit` = 29 total.
