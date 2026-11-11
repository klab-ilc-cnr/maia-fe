/**
 * Apostrofi e simboli usati al loro posto (U+0027 ' , U+2018 ‘ , U+02BC ʼ , U+0060 ` , U+00B4 ´ , U+2032 ′).
 * Nei testi l'apice è quasi sempre U+2019 (’, 99,6% nel Decameron), ma da tastiera si scrive U+0027 e Word
 * produce U+2018 a inizio parola: il backend li considera caratteri diversi, quindi `'ntelletto` non trova `’ntelletto`.
 *
 * Solo per la ricerca nel TESTO del corpus (finestra Search), dove i dati sono coerenti. Non usarla per ricerche su annotazioni,
 * lessico, dizionario o voci: li scrivono più persone senza una convenzione e le varianti convivono (cercando `’` non si
 * troverebbe chi ha scritto `'`). Il backend resta generico e rispetta i dati: nessuna regola sugli apici in TexO.
 */
const APOSTROPHE_VARIANTS = /['\u2018\u02BC`\u00B4\u2032]/g;

/** Forma canonica dell'apice usata nei testi. */
export const CANONICAL_APOSTROPHE = '\u2019';

/**
 * Sostituisce ogni variante dell'apice con quella canonica (’).
 * Rimedio lato frontend, da togliere quando il backend tratta gli apici come equivalenti.
 */
export function normalizeApostrophes<T extends string | null | undefined>(value: T): T {
  return (typeof value === 'string' ? value.replace(APOSTROPHE_VARIANTS, CANONICAL_APOSTROPHE) : value) as T;
}
