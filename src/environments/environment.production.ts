/**
 * URL del back-end calcolati a runtime da cio' che vede il browser:
 *   origin (schema + host + PORTA) + cartella della UI + '/maia'.
 * Convenzione di piattaforma: il back-end e' esposto sotto <cartella UI>/maia, quindi
 *   https://klab.ilc.cnr.it/maia-vocabo/  ->  https://klab.ilc.cnr.it/maia-vocabo/maia
 *   https://klabsrv:19443/maia/           ->  https://klabsrv:19443/maia/maia
 * Cosi' lo stesso pacchetto funziona su qualunque host, porta e prefisso.
 * Usare `host`/`origin` e NON `hostname`: hostname perde la porta.
 *
 * Override opzionale, senza ricompilare: basta una riga in index.html, prima degli script:
 *   <script>window.__MAIA_CONFIG={apiBaseUrl:"https://host:porta/prefisso/maia"}</script>
 */
const maiaConfig = (window as any).__MAIA_CONFIG || {};
const trimSlash = (url: string): string => url.replace(/\/+$/, '');

const { origin, pathname } = window.location;
const computedServerUrl = `${origin}${pathname.substring(0, pathname.lastIndexOf('/'))}/maia`;

const serverUrl = trimSlash(maiaConfig.apiBaseUrl || computedServerUrl);
const lexoUrl = trimSlash(maiaConfig.lexoBaseUrl || `${serverUrl}/lexo`);
const textoUrl = trimSlash(maiaConfig.textoBaseUrl || `${serverUrl}/texto`);

export const environment = {
  production: false,
  envName: 'local',
  maiaBeUrl: `${serverUrl}/api`,
  usersUrl: `${serverUrl}/api/users`,
  languagesUrl: `${serverUrl}/api/languages`,
  workspacesUrl: `${serverUrl}/api/workspaces`,
  layersUrl: `${serverUrl}/api/layers`,
  featureUrl: `${serverUrl}/api/features`,
  tagsetUrl: `${serverUrl}/api/tagsets`,
  annotationUrl: `${serverUrl}/api/annotations`,
  relationUrl: `${serverUrl}/api/relations`,
  maiaBeLexoUrl: lexoUrl,
  maiaBeTextoUrl: textoUrl,
  lexoPrefix: "lex",
  lexoBaseIRI: "http://lexica/mylexicon#",
  applicationSubTitle: "VocaBO",
  demoHide: true,
};
