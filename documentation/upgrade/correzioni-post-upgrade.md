# Correzioni e modifiche dopo l'upgrade ad Angular 21 / PrimeNG 21

Elenco per punti, senza dettagli (i dettagli stanno nei commit e in `AGENTS.md`).
Punto di partenza: v0.26.0 (fine dell'upgrade).

**Come mantenerlo**: ogni correzione/modifica consegnata va aggiunta nella sezione "Non ancora in un pacchetto" (in alto);
quando si prepara un pacchetto, la sezione diventa la sezione di quella versione e se ne apre una nuova vuota.
Dopo ogni modifica rigenerare la copia HTML: `python3 tools/md-to-html.py documentation/upgrade/correzioni-post-upgrade.md`.

---

## Non ancora in un pacchetto (prossimo: 0.26.7)

### Layer, tagset, workspace (finestre "nuovo")
- Nuovo layer: il campo colore parte con un colore libero (prima il selettore mostrava un rosso ma il campo era vuoto e Add restava spento senza dire perché); alla riapertura della finestra Add era acceso con nome e colore vuoti e il backend rispondeva 500
- Stesso difetto corretto nelle finestre nuovo/modifica di tagset, valore del tagset, workspace e feature: nome obbligatorio e non solo spazi restano validi dopo la prima apertura
- Un errore del backend (es. 500) in layer e tagset non interrompe più la lista (console: «ERROR Error: [object Object]», la lista non si aggiornava più) e l'avviso dice il motivo («server error 500») invece di «undefined»

### Tagset
- Valore predefinito del tagset (campo `defaultItem` del backend): si imposta, si cambia e si toglie dalla pagina dei valori del tagset con la stella; la pagina mostra il valore predefinito
- Le nuove annotazioni preselezionano il valore predefinito del tagset (es. "Tipo lessicale"): sparisce la lista fissa nel codice; senza predefinito nessuna preselezione
- La modifica di nome e descrizione del tagset non toglie il predefinito; cancellare il valore predefinito lo toglie prima (il backend altrimenti rifiuta)

---

## 0.26.6 — pacchetto `maia-fe-0.26.6-test-ng21-20261109-1916.tgz`

### Finestra del testo
- Puntatore a mano anche sopra il testo annotato (come sull'handle): un clic apre l'annotazione
- Albero delle sezioni: tooltip con il luogo del testo (es. "II.8.48") su ogni elemento
- Annotazioni sovrapposte sullo stesso layer (anche a capo): gli handle si impilano, ognuno è visibile e cliccabile (prima si vedeva e selezionava solo l'ultimo)
- Annotazione su più righe: etichetta solo sul primo frammento (come INCEpTION)
- Passando col mouse su un handle si evidenzia il testo dell'annotazione
- Clic su una parola annotata: apre l'annotazione più interna (il doppio clic resta la selezione della parola)

### Finestra del testo (apertura da un risultato della Search)
- Una sola richiesta di righe e di annotazioni (prima due, la seconda conteneva la prima), senza il salto del testo
- L'editor di annotazione non si ricostruisce a ogni caricamento di righe: niente seconda richiesta dell'etichetta del senso e le modifiche non salvate non si perdono scorrendo il testo
- Il numero di righe del testo non si chiede più prima del primo caricamento (lo dà la risposta delle righe) e l'elenco dei layer è in cache per 5 minuti: aperture della finestra del testo più rapide e meno richieste
- Alla prima apertura evidenziazioni e handle erano spostati rispetto alle parole (font del testo non ancora caricato al momento della misura): ora si attende il font

### Finestra del testo (correzione della cache)
- Il campo "Text" dell'editor di annotazione mostrava il testo precedente (restava indietro di un clic); il form si costruisce ora a inputs completi, anche nell'editor della modifica massiva

### Prestazioni (clic su un'annotazione e campi con autocomplete)
- Tolta la ricerca a vuoto dei campi con autocomplete (lessico, forme, sensi: un elenco di centinaia di voci richiesto a ogni apertura, mai mostrato): 26 punti dell'applicazione
- Editor di annotazione: nome del layer dall'elenco già in memoria; campi dei layer e valori dei tagset in cache per 5 minuti (svuotata a ogni modifica fatta dall'app); caricamento in background per i layer resi visibili. Un clic passa da 5 chiamate a 1 (solo l'etichetta del senso)

### Elenco workspace
- "Last access" aggiornato: l'elenco veniva richiesto una sola volta per sessione; ora si rinnova a ogni apertura della pagina e dopo il salvataggio all'uscita da un workspace

### Sessione
- Il layout del workspace si salva 30 s prima della scadenza (all'avviso di disconnessione) e di nuovo se si rifiuta di continuare
- Tornando al login non compare più l'avviso "Error saving workspace status" (dopo la fine della sessione non si prova più a salvare)

### Lexicon Explorer / Dictionary Explorer
- Con poche voci le righe non si allungano più per riempire il tile: altezza sempre uguale, spazio bianco sotto

### Lexicon Editor
- Albero a sinistra: compare la barra di scorrimento verticale quando form e sensi riempiono la colonna (es. "sonare verb"); l'altezza segue la colonna anche ridimensionando il pannello

---

## 0.26.5 — pacchetto `maia-fe-0.26.5-test-ng21-20261107-1154.tgz`

### Dictionary Editor
- Anteprima: doppio clic su un contesto apre il testo alla riga giusta, con il layer semantico attivo (senza selezione della parola), con la manina sulle righe

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

## Da fare (richieste già concordate, non ancora implementate)
- Tagset: dopo la creazione di un nuovo tagset non tornare alla lista, ma aprire la pagina di modifica del tagset appena creato (quella dei valori), per inserirli subito

## In sospeso (backend / decisioni)
- Backend: `POST /texto/layer/create` con colore vuoto dà 500 (dovrebbe rispondere 400 con un messaggio)
- Frontend: lo stesso schema che termina lo stream della lista in caso di errore esiste ancora in corpus, workspace, lexicon e editor (non toccati)
- maia-be: 401 di TexO/LexO restituito come 500
- maia-be/TexO: offset vuoti nei contesti di alcune annotazioni recenti (evidenziazione gialla mancante in anteprima)
- maia-be/TexO: 401 intermittente su `/texto/util/ais`
- Backend (TexO): lo storico dei tagset ha `time` al secondo: due modifiche dello stesso tagset nello stesso secondo danno 500 e il tagset resta non modificabile né cancellabile (`prova tagset` 25388553 e `tmp-prova-default` 25388562 da sbloccare o cancellare)
- Dati: impostare il valore predefinito di "Tipo lessicale" ("Parola monorematica") dalla pagina dei tagset, su ogni istanza (VM di test e produzione), perché la lista fissa non c'è più
- Decisione: quill 2
- Decisione: `production: false` in `environment.production.ts`
- Prima del merge: sottotitolo `environment.ts` da riportare a "develop"
