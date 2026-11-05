#!/usr/bin/env node
/**
 * Controllo degli attributi statici sui componenti PrimeNG nei template.
 *
 * Un input rimosso/rinominato da PrimeNG scritto come binding (`[field]="x"`) da' errore di compilazione,
 * ma scritto come attributo statico (`field="x"`) NO: resta un attributo HTML e il componente lo ignora
 * (es. AutoComplete `field` -> `optionLabel` e MultiSelect `defaultLabel` -> `placeholder` in PrimeNG 20+).
 * Lo script confronta gli attributi statici degli elementi <p-*> con gli input dichiarati nei .d.ts di
 * PrimeNG installato e stampa quelli sconosciuti. Controlla anche i nomi dei `pTemplate`: un tipo che il
 * componente non riconosce piu' viene ignorato in silenzio. Da lanciare a ogni aggiornamento di PrimeNG.
 *
 * Uso: node tools/check-primeng-attrs.mjs   (oppure: npm run check-primeng-attrs)
 */
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const typesDir = path.join(repo, 'node_modules', 'primeng', 'types');

// selettore (tag o [attributo]) -> nomi degli input
const selInputs = new Map();
const add = (key, names) => { if (!selInputs.has(key)) selInputs.set(key, new Set()); names.forEach((n) => selInputs.get(key).add(n)); };
for (const f of fs.readdirSync(typesDir).filter((x) => x.endsWith('.d.ts'))) {
  const s = fs.readFileSync(path.join(typesDir, f), 'utf8');
  const re = /ɵɵ(?:Component|Directive)Declaration<[\w<>, ]+?, "([^"]+)", [^,]+, \{(.*?)\}, \{/gs;
  for (const m of s.matchAll(re)) {
    const names = [...m[2].matchAll(/"\w+": \{ "alias": "(\w+)"/g)].map((x) => x[1].toLowerCase());
    for (const sel of m[1].split(',')) {
      const t = sel.trim();
      const tag = t.match(/^([\w-]+)/); if (tag) add(tag[1].toLowerCase(), names);
      for (const a of t.matchAll(/\[(\w+)\]/g)) add(`[${a[1].toLowerCase()}]`, names);
    }
  }
}
// tipi di pTemplate riconosciuti per selettore: i `case '...'` dei sorgenti del componente
const selTemplates = new Map();
const fesm = path.join(repo, 'node_modules', 'primeng', 'fesm2022');
for (const f of fs.readdirSync(fesm).filter((x) => x.endsWith('.mjs'))) {
  const s = fs.readFileSync(path.join(fesm, f), 'utf8');
  const cases = [...s.matchAll(/case '([\w-]+)':/g)].map((x) => x[1]);
  for (const m of s.matchAll(/type: \w+, isStandalone: (?:true|false), selector: "([^"]+)"/g))
    for (const sel of m[1].split(',')) {
      const t = sel.trim().toLowerCase();
      if (/^[\w-]+$/.test(t)) { if (!selTemplates.has(t)) selTemplates.set(t, new Set()); cases.forEach((c) => selTemplates.get(t).add(c)); }
    }
}
// componenti che accettano qualsiasi nome: p-tree (tipo del nodo), p-splitter (ogni template e' un pannello)
const anyTemplate = new Set(['p-tree', 'p-splitter']);
const voidTags = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'col', 'source', 'wbr']);

// input delle direttive PrimeNG applicabili a qualsiasi elemento (pTooltip, pRipple...)
const directiveInputs = new Set([...selInputs].filter(([k]) => k.startsWith('[')).flatMap(([, v]) => [...v]));
const globalAttrs = new Set(['class', 'id', 'style', 'name', 'type', 'formcontrolname', 'formgroupname', 'ngmodel', 'role',
  'title', 'for', 'tabindex', 'pripple', 'ptooltip', 'ngclass', 'ngstyle', 'ngdefaultcontrol', 'href', 'value', 'disabled']);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full); else if (e.name.endsWith('.html')) yield full;
  }
}

const problems = [];
let elements = 0;
for (const file of walk(path.join(repo, 'src', 'app'))) {
  const s = fs.readFileSync(file, 'utf8');
  for (const m of s.matchAll(/<(p-[\w-]+)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)) {
    elements++;
    const tag = m[1].toLowerCase();
    const line = s.slice(0, m.index).split('\n').length;
    const where = `${path.relative(repo, file)}:${line} <${tag}>`;
    const known = selInputs.get(tag);
    if (!known) { problems.push(`${where}: componente non trovato in PrimeNG`); continue; }
    const attrs = m[2].replace(/"[^"]*"|'[^']*'/g, '""');
    for (const a of attrs.matchAll(/(?:^|\s)([A-Za-z][\w.:-]*)(?=\s*=|\s|$)/g)) {
      const name = a[1].toLowerCase();
      if (globalAttrs.has(name) || /^(aria-|data-|attr\.)/.test(name)) continue;
      if (!known.has(name) && !directiveInputs.has(name)) problems.push(`${where}: attributo "${a[1]}" non e' un input di PrimeNG`);
    }
  }
  // pTemplate: il componente <p-*> aperto piu' vicino
  const stack = [];
  for (const m of s.matchAll(/<(\/?)([\w-]+)\b((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)) {
    const [, close, rawTag, attrs, selfClose] = m; const tag = rawTag.toLowerCase();
    if (close) { const i = stack.lastIndexOf(tag); if (i >= 0) stack.length = i; continue; }
    const t = attrs.match(/\bpTemplate="([^"]*)"/);
    if (t) {
      const parent = [...stack].reverse().find((x) => x.startsWith('p-'));
      const ok = parent && (anyTemplate.has(parent) || selTemplates.get(parent)?.has(t[1]));
      if (!ok) problems.push(`${path.relative(repo, file)}:${s.slice(0, m.index).split('\n').length} <${parent ?? '?'}>: pTemplate="${t[1]}" non riconosciuto`);
    }
    if (!selfClose && !voidTags.has(tag)) stack.push(tag);
  }
}

if (problems.length) {
  console.error(`Attributi statici sospetti (${problems.length}):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`Attributi PrimeNG ok: ${elements} elementi <p-*> controllati.`);
