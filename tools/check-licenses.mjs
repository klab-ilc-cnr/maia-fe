#!/usr/bin/env node
/**
 * Controllo delle licenze delle dipendenze installate (node_modules).
 *
 * Dalla versione 22 PrimeNG, primeicons 8 e alcuni pacchetti @primeuix (themes 3.x, styles 3.x, styled 1.x,
 * utils 0.8.x, motion 1.x) sono sotto la "PrimeUI License" (commerciale, chiave di licenza), cosi' come
 * le versioni "-lts" di PrimeNG. MAIA usa solo le versioni MIT: questo script fallisce se nel progetto
 * entra un pacchetto con licenza PrimeUI o una versione -lts di un pacchetto PrimeTek.
 *
 * Uso: node tools/check-licenses.mjs   (oppure: npm run check-licenses)
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'node_modules');
const PRIMETEK = /^(primeng|primeicons|primeflex|@primeng\/|@primeuix\/)/;
const problems = [];
let checked = 0;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function licenseText(dir) {
  for (const name of ['LICENSE.md', 'LICENSE', 'LICENSE.txt', 'license.md']) {
    const f = path.join(dir, name);
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').slice(0, 4000);
  }
  return '';
}

function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith('@')) { visit(full); continue; }
    const pkg = readJson(path.join(full, 'package.json'));
    if (pkg?.name) {
      checked++;
      const license = typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license ?? '');
      const text = /SEE LICENSE/i.test(license) || PRIMETEK.test(pkg.name) ? licenseText(full) : '';
      // "PrimeUI License" come licenza del pacchetto (nei LICENSE.md di PrimeNG community e' nominata solo la parte LTS)
      const primeUi = /^#\s*PrimeUI License/im.test(text) || /PrimeUI/i.test(license);
      const lts = PRIMETEK.test(pkg.name) && /-lts/i.test(pkg.version ?? '');
      if (primeUi || lts) problems.push(`${pkg.name}@${pkg.version} (${path.relative(root, full)}): ${primeUi ? 'PrimeUI License' : 'versione -lts'}`);
    }
    const nested = path.join(full, 'node_modules');
    if (fs.existsSync(nested)) visit(nested);
  }
}

visit(root);
if (problems.length) {
  console.error(`Licenze non ammesse (${problems.length}):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`Licenze ok: ${checked} pacchetti controllati, nessun pacchetto PrimeUI/-lts.`);
