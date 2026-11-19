# Barra delle finestre del workspace (taskbar)

Stato: **fasi 0, 1 e 2 fatte** (barra, spazio, salvataggio/ripristino con minimizzate); resta la fase 3 (scorrimento con molte finestre, titolo che cambia, accessibilità da tastiera). Conferma: il clic sulla finestra in primo piano la **minimizza**. Richiesta: una barra in basso con le finestre aperte, come i window manager.

## Decisioni prese
- Posizione: **in basso** (più simile a Windows; in alto c'è già il menu del workspace).
- Finestre minimizzate: **si ripristinano minimizzate** alla riapertura del workspace.
- Icone per tipo di finestra (vedi "Da decidere": nel menu oggi non ci sono icone predisposte).
- Funzioni extra: **menu al tasto destro** sulle voci della barra (chiudi, minimizza, ingrandisci). Il resto (scorrimento, «×») si valuta dopo.

## Da decidere
- Icone (PrimeIcons, scelte da me, da rivedere se non piacciono): Corpus `folder-open`, Text `file`, Lexicon Explorer `list`, Lexicon Editor `pencil`, Search `search`, Dictionary Explorer `book`, Dictionary Editor `file-edit`, Ontology Explorer `sitemap`, Ontology View `share-alt`. Il menu del workspace non ha icone predisposte. Tipi: Corpus, Text, Lexicon Explorer, Lexicon Editor, Search, Dictionary Explorer, Dictionary Editor, Ontology (Explorer/View).

## Cosa risulta dal codice
- jsPanel emette sul `document` `jspanelloaded`, `jspanelclosed`, `jspanelstatuschange`, `jspanelminimized`, `jspanelfronted`; `jsPanel.getPanels()` dà l'elenco; `front()`, `minimize()`, `normalize()` già usati.
- Le finestre hanno `id` stabile e `headerTitle` («Search», «Text - decameron», «Lexicon Editor - …»).
- Le minimizzate oggi vanno in `#jsPanel-replacement-container` (fisso in basso a sinistra); con `minimizeTo: false` vengono solo nascoste.
- `#panelsContainer` è `position:absolute; height:100%` e contiene le finestre: la barra va riservata restringendolo.
- Dimensioni iniziali delle finestre calcolate da `window.innerHeight` (la barra, ~36 px, le sposta di poco).
- **Layout salvato**: `jsPanel.layout.save` (selettore `.jsPanel-standard`) registra lo `status` di ogni finestra; `restoreId` lo riapplica (chiama `panel.minimize()`), quindi le minimizzate tornano minimizzate. Da verificare a runtime che posizione/dimensioni restino corrette quando poi la finestra viene ripristinata.
- Gli handler `onminimized`/`onnormalized` delle tile aggiornano l'altezza dei componenti: vanno ricontrollati con la nuova barra.

## Piano
**Fase 0 — verifiche (½ giornata)**: salvataggio/ripristino con finestra minimizzata (posizione e dimensioni al ripristino), finestra "attiva" (evento `fronted` + z-index più alto), spazio verticale.

**Fase 1 — barra di base (1–1,5 giornate)**: `WorkspaceTaskbarComponent`, un elemento per finestra con icona e titolo (tooltip col titolo completo), stati attiva/normale/minimizzata, clic: minimizzata → ripristina e porta davanti; dietro → porta davanti; davanti → minimizza (se confermato). Aggiornamento dagli eventi di jsPanel, ascoltati fuori dalla zona di Angular. `minimizeTo: false` nei default.

**Fase 2 — spazio e persistenza (1 giornata)**: `#panelsContainer` riservato sopra la barra; finestre ingrandite; salvataggio/ripristino con minimizzate; barra vuota al cambio workspace/uscita.

**Fase 3 — rifiniture (½ giornata)**: menu al tasto destro (chiudi, minimizza, ingrandisci), molte finestre (restringimento poi scorrimento), titolo aggiornato quando cambia, accessibilità (`role="toolbar"`, `aria-pressed`, tastiera).

**Test (1 giornata, lungo le fasi)**: e2e con `blockWrites`: voci della barra, clic, chiusura, finestra ingrandita non sotto la barra, salvataggio e ripristino con minimizzata; giro completo e confronto grafico.

**Indipendenza da jsPanel**: il componente usa un'interfaccia `{id, titolo, tipo, stato, attiva}` e un solo adattatore parla con jsPanel, da riscrivere quando jsPanel verrà sostituito.

Stima: 3–4 giornate.
