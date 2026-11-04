# Maia-fe — Agent Guide (AGENTS.md)

Reference doc for AI agents working on this repository. Keep it updated when the project changes.

## Overview

- **What it is**: MAIA is an open, collaborative web tool for text annotation, e-lexicography and lexical linking, built by [KLAB @ ILC-CNR](https://www.ilc.cnr.it/klab/). This repo is the **Angular frontend**: **Angular 14.2.9 on `master`**, **Angular 16.2.12 on `upgrade/angular-21`** (work in progress towards 21) (project name in `angular.json`: `projectxFE`).
- **Backend**: `maia-be` (Spring Boot). Others: **TexO** (text backend; replaced the legacy CASH app) and **LexO** (lexicon backend).
- **Versions**: package.json `name: maia-fe`; `0.20.0` on `master` (last release, tagged `v0.20.0`), **`0.21.1` on `upgrade/angular-21`**. Docs/versions map in `README.md`. Upgrade convention: **Y +1 at each delivered Angular step, Z +1 at each delivered fix package**, X stays 0; set with `npm version X.Y.Z --no-git-tag-version` (Node 16); **no git tags** for test versions. The footer shows the version and the e2e smoke checks it. Test packages are named `dist/maia-fe-<version>-test-<desc>-<timestamp>.zip` (superseded ones in `dist/old/`).
- **Branches**: `master` (stable; `study/security-fixes` fast-forwarded into it on 2026-11-04), `develop`. **Active work: `upgrade/angular-21`** (plan: `documentation/upgrade/angular-upgrade-plan.md`). `epic/#9044-…` is stale and fully contained in master. No CI workflows configured.

## Toolchain (MUST FOLLOW)

- **Node by branch (via nvm)**: `master` (Angular 14) → **Node 16.20.2** (newer Node breaks Angular 14). `upgrade/angular-21` (Angular 18 now) → **Node 22.23.4** (valid for Angular 18–22; Angular 17 needed Node 20.20.2, also installed). Use: `export NVM_DIR="$HOME/.nvm"; source "$NVM_DIR/nvm.sh"; nvm use <version>`; `nvm` is a shell function (cannot be wrapped by `timeout`).
- npm 8.19.4, TypeScript **4.8.4** on master / **5.1.6** on `upgrade/angular-21` (Angular 16). Node 16.20.2 is still fine up to Angular 16; Angular 17 needs Node ≥ 18.13.
- Commands:
  - `npm install` — fine on Node 16 (engine warnings are advisory).
  - `npm run build-prod` (=`ng build --configuration production --base-href='./'`) — **passes** (±30s). Budget warning only (initial 5.65 MB > 5 MB). *(master)*
  - **On `upgrade/angular-21`** (builder `@angular/build:application`, esbuild): `npx ng build -c production --base-href=""` → flat output in `dist/projectx-fe` (`outputPath.browser: ""`). **Do not pass `--output-path`** on the CLI (it replaces the outputPath object and re-adds `browser/`). Deploy packages are built this way and copied into `maia/`.
  - `npm start` (=`ng serve`) — dev server on `http://localhost:4200`, uses `src/proxy.conf.json`.
  - `npm test` (=`ng test`, karma/ChromeHeadless) — **BROKEN on master**: ~19 TS errors under `strict` (spec + app files), `Executed 0 of 0`. Pre-existing, not caused by security work. Fixing it is a separate task (172 `.spec.ts` exist).
  - `npm run compodoc` — offline doc generation (uses `tsconfig.doc.json`).
- **Smoke e2e** (`e2e/`, see `e2e/README.md`): separate toolchain, **Node ≥ 20 via `nvm use 24.14.0`** (never the app's Node 16). Run against `ng serve`: `E2E_LABEL=<tag> E2E_EXPECT_TITLE="MAIA - VocaBO - DEV UPGRADE" npx playwright test`. Credentials in `~/.config/maia/e2e.env` (outside repo, 600; user `agente`, ADMINISTRATOR on the test VM). Uses/reuses workspace `e2e-smoke` (id 19). Run it after every upgrade step and compare `artifacts/screens/<tag>/` with the `ng14` baseline.

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

- `angular.json` (`serve.options.proxyConfig`) points to **`src/proxy.conf.json`** — a **gitignored, machine-specific** file. On a fresh clone run once: `cp src/proxy_stub.conf.json src/proxy.conf.json`, then fill it with your backend target (`{}` = no proxy).
- Versioned default in the repo: `src/proxy_stub.conf.json` (empty stub).
- Local instance used in this project targets **`https://klabsrv:19443`** = test VM (Alpine, `10.10.0.19`, in the NAT subnet `10.10.0.0/24` of the KVM host `klabsrv`, port-forwarded). Apache there exposes the backend under **`/maia/maia/…`**, so `pathRewrite`:
  - `/api` → `/maia/maia/api`
  - `/lexo` → `/maia/maia/lexo` (LexO, still used by ontology/lexicon/dictionary services)
  - `/texto` → `/maia/maia/texto` (TexO)
  - `secure:false`, `changeOrigin:true`. Verified 2026-11-04 (401/403 from Spring through `ng serve`). The legacy CASH `/cash` entry was **removed** (app fully replaced by TexO).
- **Deploy scenarios** (same artifact for both): production `https://klab.ilc.cnr.it/maia-vocabo/` (behind the klab reverse proxy, port 443) and test `https://klabsrv:19443/maia/` (KVM NAT). Build with `--base-href=""` (what both serve).
- **Runtime backend URL** (`environment.production.ts`): `origin` (scheme+host+**port**) + UI folder + `/maia` → e.g. `https://klabsrv:19443/maia/maia/api`. The **double `/maia` is the platform convention, not a bug** (also in prod: `/maia-vocabo/maia/api`). Never use `location.hostname` (drops the port). Optional no-rebuild override: `window.__MAIA_CONFIG = {apiBaseUrl, lexoBaseUrl, textoBaseUrl}` in `index.html`.
- **Login flow**: POST `/api/authentication/authenticate` `{username,password}` → JWT as plain text; then `/api/...` calls.

## Security status (study on branch `study/security-fixes`, Aug 2026)

- `npm audit`: **84 → 29** (critical 3→0, high 45→16, moderate 29→13, low 7→0). Build green.
- Mechanism: `overrides` in `package.json` for transitive deps + direct bumps (`pdfmake 0.3.6`, `sweetalert2 11.26`, `uuid 11.1.1`) + `tsconfig.json` `skipLibCheck:true` (uuid 11 CJS typings incompatible with TS 4.8).
- **Residual, grouped by root cause**:
  - 12 `@angular/*` high CVEs → need **Angular ≥ 20.3.27** (`<=19.2.25` has no fix, not even 19.x). The old "2–4 dev-days" estimate was **wrong** (framework only): the realistic estimate to Angular 21 incl. PrimeNG theming is ≈ 18–26 dev-days — see `documentation/upgrade/angular-upgrade-plan.md`.
  - `serialize-javascript` → fix requires **Node ≥ 20** (toolchain upgrade; also unlocks esbuild/tar/etc.).
  - webpack chain, `@angular-devkit/*`, compodoc, dev tools → tied to Angular CLI 14.
  - **quill pinned at 1.3.7** — see Gotchas.
- Full matrix and effort: `documentation/security/security-fixes-study.md`.

## Gotchas for AI agents

- **Do NOT bump `quill` to 2.x**: primeng 14's `p-editor` is built for quill 1.x and renders an *empty editor* with quill 2 (verified in smoke test). quill 2 must wait for the primeng+Angular upgrade.
- **Do NOT bump primeng/@ng-bootstrap/@ngx-translate without the Angular upgrade** — they are pinned to the 14.x toolchain.
- **npm overrides**: you may NOT override a package that is also a *direct dependency* (`EOVERRIDE`). For multi-major transitive deps use version-keyed keys, e.g. `"minimatch@3": "3.1.4", "minimatch@9": "9.0.8"`. Verify target versions exist before writing them (some advisories are *unfixed* — e.g. newest tar `<=7.5.18` critical had no patch until 7.5.22 was published).
- Always check `node -v` before building: Node 16.20.2 on `master`, Node 22.23.4 on `upgrade/angular-21`.
- Test a deploy package **before** handing it over: `python3 e2e/tools/serve-package.py dist/projectx-fe 8099` (same topology as the test VM) + full e2e with `E2E_BASE_URL=http://127.0.0.1:8099/maia/`.
- `NG0100: ExpressionChangedAfterItHasBeenCheckedError` in dev on the lexicon tile (`workspace-lexicon-edit-tile`, `[scrollHeight]="panelHeight-40+'px'"`, panelHeight set in `ngAfterViewInit`) is **cosmetic and dev-only** — ignore.
- `bootstrap-autofill-overlay.js` console errors come from the Bitwarden browser extension — ignore.
- **Upgrade target is Angular 21 + PrimeNG 21** (last MIT PrimeNG). **PrimeNG 22 and primeicons 8 are proprietary (PrimeUI license, key required)** — do not install them. The future v22 step will evaluate `@openng/optimus-ui` (MIT fork of PrimeNG 21).
- **jsPanel4 is abandoned** (last release 2022) and its layouts are **persisted in maia-be** (`tile.tileConfig`, restored via `jsPanel.layout.restoreId`). Keep it during the upgrade; replacement is a separate backlog project.
- Checking out old commits where `src/proxy.conf.json` was still tracked **silently overwrites/deletes the local ignored file** (happened on the 2026-11-04 merge). Recreate it from `src/proxy_stub.conf.json` / this guide.
- **Node on this machine**: `/usr/local/bin/node` = 24.14.1 is the shell default but is **not** an nvm version (`nvm use 24.14.1` fails); `/usr/bin/node` = 18.19.1. Always select explicitly: `nvm use 16.20.2` (app) / `nvm use 24.14.0` (e2e), and check `node -v` before any `npm` command.
- **Never run `npm install` outside the intended folder**: a failed `cd` once installed Playwright into the app's `package.json`/lockfile with npm 11 (reverted via `git checkout` + `npm ci` on Node 16). Put `npm` on the same line as the `cd` check, not after a heredoc. Note: `nvm` breaks under `set -u`.
- **Stopping `ng serve`**: don't `pkill -f "ng serve ..."` from a command that itself contains that string (it kills its own shell, exit 143). Kill the PID listening on port 4200 (`ss -ltnp`). Start the server and run tests **sequentially**, not in parallel tool calls.
- `environment.ts` on `upgrade/angular-21` has `applicationSubTitle: "VocaBO - DEV UPGRADE"`: **revert to `"develop"` before merging into master**.
- **PrimeNG 16+ AutoComplete** `onSelect`/`onUnselect` emit `{originalEvent, value}`: bind handlers with `$event.value`. When upgrading PrimeNG, **diff the `.emit(` payloads** of every used module between versions: handlers typed `any` hide runtime breakages from the compiler.
- **PrimeNG ≥ 16.4 uses `@layer primeng`**: unlayered CSS always wins regardless of specificity. All global CSS is imported into the same layer (`src/styles/layer-*.css` in `angular.json`, `layer(primeng)` imports and `@layer primeng { }` in `styles.scss`), **except the app `:root` variables**, which must stay unlayered because PrimeNG themes define `:root` unlayered. See `src/styles/README-layer.md`. Remove with the PrimeNG 18+ theme.
- **PrimeNG 16.x known bugs**: 16.8.0–16.9.1 print the children count after tree labels (fixed in 17); ≤ 16.7.2 ContextMenu crashes on destroy and breaks re-entering a workspace. Keep 16.9.1.
- **Angular 14 reference instance** for visual/behavioural diffs: git worktree `/home/simone/maia-fe-ng14` (commit `49474068`), `ng serve --port 4201` with Node 16, same backend. e2e can target it with `E2E_BASE_URL=http://localhost:4201/`. Remove with `git worktree remove /home/simone/maia-fe-ng14` when no longer needed.
- **Never install PrimeNG `*-lts` versions** (commercial, e.g. `16.9.17-lts`); caret ranges don't pick them.
- Editing `angular.json`: use targeted text replacement (it has mixed tab indentation); a JSON dump reformats the whole file.
- **No CHANGELOG.md** convention — do not create one unless asked; use/docs live in README + `documentation/`.

## Recent work (this branch / chat memory)

- Audit 84→29 via overrides (fix commits) — build verified each step.
- Backend proxy debugged: VM `192.168.92.24:11443` serves only the deployed FE (Apache, `/maia/`); the actual Spring API is on **`:11900`** context `/maia`. Proxy made machine-local: versioned stub `src/proxy_stub.conf.json`, gitignored `src/proxy.conf.json` (real config for this dev machine).
- quill 2 regression discovered & reverted (commit `59d22b3e`).
- CASH fully removed: proxy `/cash`, `cashUrl` in demo env, ~250 lines of commented legacy methods in `workspace.service.ts`, and the two "GESTIONE BUG SULLE API CASH" comments rewritten neutrally (active `normalizzazione features` code kept).
- Port fix (2026-11-02, commit `0af11417`): runtime backend URL keeps the port; deployed on `klabsrv:19443` and verified working.
- `npm audit` re-run 2026-11-02: **92** (4 critical: handlebars, proxy-addr, piscina, build-angular) — new advisories on already-overridden packages; mostly resolved by the Angular upgrade.
- 2026-11-04: `study/security-fixes` merged (ff) into `master`; branch `upgrade/angular-21` created; upgrade plan written with decisions.
- 2026-11-04: **phase 0 done** on `upgrade/angular-21` (still Angular 14): runtime-overridable subtitle, e2e smoke baseline, 8 unused deps removed, dead PrimeFlex 2 classes removed — all pixel-identical to baseline. Next: phase 1 (Angular 14 → 15 → 16).
- 2026-11-04: **phase 1 done**: Angular 16.2.12 / PrimeNG 16.9.1 on `upgrade/angular-21` (commits `d7cc6cef`, `91db54e6`); e2e green incl. relative navigation and autocomplete; test package `dist/maia-fe-0.20.0-test-ng16-*.zip` for the manual checkpoint. Next: phase 2 (16 → 17 → 18, Node 18, esbuild builder).
- 2026-11-04: **phase 2 done** → **v0.23.0**: Angular 17 (`5e45d8b7`, v0.22.0), Angular 18 (`9b1b24a9`), esbuild builder (`5097203d`). PrimeNG 17.18.15 (tree children-count bug gone; Tree/TreeSelect `metaKeySelection` default changed true→false, restored explicitly). pdfmake export fixed for esbuild (`addVirtualFileSystem`). `npm audit` 82. Package `dist/maia-fe-0.23.0-test-ng18-*.zip`. Next: phase 3 (19 → 20 → 21, PrimeNG 18+ new theme).
