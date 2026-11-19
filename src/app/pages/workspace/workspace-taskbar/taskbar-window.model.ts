/** Tipo di finestra del workspace: decide l'icona nella barra. */
export type TaskbarWindowType =
  | 'corpus' | 'text' | 'lexicon' | 'lexiconEdit' | 'search' | 'dictionary' | 'dictionaryEdit'
  | 'ontology' | 'ontologyView' | 'other';

export type TaskbarWindowState = 'normal' | 'maximized' | 'minimized';

/** Una finestra aperta, come la vede la barra (indipendente da jsPanel). */
export interface TaskbarWindow {
  id: string;
  /** Titolo completo della finestra (tooltip). */
  title: string;
  /** Testo breve mostrato nella voce: senza il prefisso del tipo, che c'è già nell'icona (o abbreviato negli editor). */
  label: string;
  type: TaskbarWindowType;
  state: TaskbarWindowState;
  /** Finestra in primo piano tra quelle non minimizzate. */
  active: boolean;
}

/** Cosa serve alla barra per leggere e comandare le finestre: l'unico punto che conosce jsPanel è l'adattatore. */
export interface TaskbarWindowsSource {
  /** Chiama `onChange` ogni volta che l'elenco o lo stato delle finestre cambia (e subito all'avvio). */
  watch(onChange: (windows: TaskbarWindow[]) => void): () => void;
  /** Clic sulla voce: ripristina se minimizzata, porta davanti se dietro, minimizza se già davanti. */
  toggle(id: string): void;
  minimize(id: string): void;
  maximize(id: string): void;
  close(id: string): void;
}
