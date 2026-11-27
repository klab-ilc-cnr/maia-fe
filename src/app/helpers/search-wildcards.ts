/**
 * Caratteri jolly della ricerca nel TESTO del corpus (finestra Search).
 * maia-be (TextoKwicRequest) usa `like` solo se il valore contiene `*` o `?`: `*` = qualsiasi gruppo di caratteri
 * (anche nessuno), `?` = un solo carattere; senza jolly la forma e' cercata esatta. Maiuscole e accenti non contano.
 * Diversa dalla ricerca di LexO (Explorer del Lexicon/Dictionary), che ha anche la ricerca fuzzy `~`.
 */
const WILDCARDS = /[*?]/g;

/** Il valore contiene almeno un carattere jolly (`*` o `?`)? */
export function hasWildcard(value: string | null | undefined): boolean {
  return !!value && /[*?]/.test(value);
}

/**
 * Il valore contiene almeno un carattere vero oltre ai jolly e agli spazi? Cercare solo `*` (o `?`, `*?`) vuol dire
 * `token like '%'`: tutti i 307.500 token del Decameron, e TexO esaurisce la memoria fino al riavvio.
 */
export function hasLiteralChars(value: string | null | undefined): boolean {
  return !!value && value.replace(WILDCARDS, '').trim().length > 0;
}
