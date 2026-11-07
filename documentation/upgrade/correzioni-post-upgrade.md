# Correzioni e modifiche dopo l'upgrade ad Angular 21 / PrimeNG 21

Elenco per punti, senza dettagli (i dettagli stanno nei commit e in `AGENTS.md`).
Punto di partenza: v0.26.0 (fine dell'upgrade).

**Come mantenerlo**: ogni correzione/modifica consegnata va aggiunta nella sezione "Non ancora in un pacchetto" (in alto);
quando si prepara un pacchetto, la sezione diventa la sezione di quella versione e se ne apre una nuova vuota.

---

## Non ancora in un pacchetto (prossimo: 0.26.5)

### Dictionary Editor
- Anteprima: doppio clic su un contesto apre il testo alla riga giusta, con il layer semantico attivo (senza selezione della parola)

---

## 0.26.4 — pacchetto `maia-fe-0.26.4-test-ng21-20261107-1049.tgz`

### Lexicon Editor
- Espandere "sense"/"form" non svuota più il ramo già aperto (apertura da una forma o da un senso)
- Larghezza di apertura almeno 800 px
- Pannello di sinistra (albero) con larghezza minima 300 px
- Tooltip con la definizione intera passando sul senso nell'albero

### Lexicon Explorer / Dictionary Explorer
- Larghezza di apertura e minima 350 px

### Annotazioni
- "Tipo lessicale" preselezionato su "Parola monorematica" nelle annotazioni semantiche nuove (singola e multipla)

### Dictionary Editor
- Scheda Ordinamento: la card occupa tutta l'altezza del pannello
- Scheda Ordinamento: l'albero dei sensi non resta più tagliato
- Anteprima: i contesti dei sottosensi non si perdono più (gara tra le risposte)
- Lista delle opere richiesta una sola volta (prima una richiesta per riga "occorrenze in altre opere")

### Test
- Test di fumo: il pannello Lexicon viene portato in primo piano prima del clic
- `blockWrites`: lascia passare `/texto/util/*` (ricerche e letture)
- Nuovi test di regressione per tutti i punti sopra

---

## 0.26.3 — pacchetto `maia-fe-0.26.3-test-ng21-20261106-1554.tgz` (include la 0.26.2, mai impacchettata)

### Sessione e errori
- Sessione scaduta: messaggio e ritorno al login (401, 403 sul token, 500 con token scaduto)
- Avviso "stai per essere disconnesso" anche dopo un ricaricamento della pagina
- Controllo della scadenza quando la scheda torna visibile
- Scadenza basata anche sulla scadenza scritta nel token
- Errori delle chiamate secondarie non più silenziosi (avviso unico, i18n `BACKEND_ERROR`)
- Tooltip asincrono: messaggio d'errore tradotto
- Tooltip dei KWIC: l'errore non diventa più "nessuna annotazione"

### Ontologia
- Disabilitata nel frontend (`ontologyDisabled`): niente menu, finestre salvate non riaperte

### Editor di testo (note, definizioni)
- Nuovo componente `app-rich-text-editor` al posto di `p-editor` negli editor modificabili
- Barra ridotta a 8 strumenti
- Menu caratteri speciali (« » – È ’ …)
- Menu altri formati (apice, pedice, barrato, elenchi)
- Incolla pulita (via colori, sfondi, font, titoli, immagini)
- Distanze uniformi tra gli strumenti

### Search
- Finestra di apertura 1000×705 px (10 risultati senza ridimensionare)
- Maschera di input: campi non allungati dall'errore
- Maschera di input: testo unico preselezionato
- Maschera di input: selettori testi/Pos/layer che si restringono con il pannello
- Maschera di input: distanze e spazio dopo "lunghezza contesto"
- Errore del campo vuoto senza spostare il layout
- Avvisi del pulsante "Annota"

### Finestra del testo
- Filtro Visibility: chip non tagliato, centrature, checkbox solo "deseleziona tutto"
- Evidenziazione del testo selezionato più visibile
- Cornice della parola aperta dal Search con il padding giusto
- Cornice della selezione col mouse uguale a quella delle annotazioni
- Tolto il workaround dello splitter ("annotationPanel is undefined")

### Lexicon Explorer / Lexicon Editor / Dictionary Explorer
- Albero senza barra orizzontale, icone ancorate a destra
- Colonna delle note tolta, icona accanto al nome
- Larghezze minime degli splitter ripristinate (`.p-splitterpanel`)
- Pulsanti "+" piccoli (Dictionary Explorer e Lexicon Editor)

### Dictionary Editor
- Anteprima: tabelle delle occorrenze visibili senza clic
- Anteprima: numerazione delle accezioni a ogni livello (1.1.1, …)
- Anteprima: errore dei contesti visibile (non più "Nessun risultato")

### Annotazioni
- POS accanto ai lemmi del lessico nell'autocomplete (una sola volta, tra parentesi quadre)

### Generale
- Campi numerici: frecce su/giù della tastiera disabilitate
- Test e2e che non scrivono sul server (`blockWrites`)

---

## 0.26.1 — pacchetto `maia-fe-0.26.1-test-ng21-20261105-0919.zip`

### PrimeNG
- Etichette dei chip delle marche del senso (`[object Object]`), anche nelle relazioni semantiche
- Chip di nuovo azzurri
- Segnaposto del filtro Visibility
- `scrollDirection` tolto dalla tabella della Search
- Nuovo controllo `npm run check-primeng-attrs`

---

## In sospeso (backend / decisioni)
- maia-be: 401 di TexO/LexO restituito come 500
- maia-be/TexO: offset vuoti nei contesti di alcune annotazioni recenti (evidenziazione gialla mancante in anteprima)
- maia-be/TexO: 401 intermittente su `/texto/util/ais`
- Backend: flag "predefinito" sui valori dei tagset (sostituirà `annotation-defaults.helper.ts`)
- Decisione: quill 2
- Decisione: `production: false` in `environment.production.ts`
- Prima del merge: sottotitolo `environment.ts` da riportare a "develop"
