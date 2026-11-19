# Release 0.30.0

Novità e miglioramenti rispetto alla versione 0.20.0 (17 marzo 2026). Aggiornato al 18 novembre 2026.

## Aggiornamento generale

- **Piattaforma rinnovata.** Il sistema è stato aggiornato alle versioni più recenti delle tecnologie su cui si basa (Angular 14 → 21, PrimeNG 21). Le segnalazioni di sicurezza sulle librerie utilizzate sono scese da 84 a 20, nessuna di livello critico o alto. Aspetto e modo d'uso restano quelli di prima, con i ritocchi indicati sotto.
- **Ritocchi grafici generali.** Allineamenti, spaziature, scritte non tagliate, barre di scorrimento, titoli e maschera di login.

## Workspace

- **Nuova barra delle finestre in basso**, come la barra delle applicazioni: una voce per ogni finestra aperta; con un clic si ripristina, si porta davanti o si minimizza; il tasto destro apre un menu (ripristina/minimizza, ingrandisci, chiudi).
- **Salvataggio automatico della disposizione.** Finestre aperte, posizioni e dimensioni si salvano da sole, senza dover uscire dal workspace. «Last access» indica ora l'ultima modifica.
- **Finestre e sessione più affidabili.** Ridimensionamento delle finestre corretto, titoli più chiari; quando la sessione sta per scadere o è scaduta il sistema avvisa e riporta al login, dopo aver salvato la disposizione.

## Finestra del testo e Search

- **Annotazioni sovrapposte.** Tutte visibili e cliccabili; un clic su una parola annotata apre l'annotazione; passando col mouse si evidenzia il testo annotato; ogni elemento dell'albero delle sezioni mostra il luogo del testo (es. II.8.48).
- **Ricerca.** Qualsiasi tipo di apice digitato trova il testo (`'ntelletto` trova `’ntelletto`); maschera di ricerca più ordinata.
- **Finestra del testo più stabile.** Apertura del testo e clic sulle annotazioni più rapidi; correzione di problemi grafici nella selezione e nella visualizzazione del testo.

## Annotazioni, layer e tagset

- **Valore predefinito dei campi dei tagset.** Ogni tagset può avere un valore predefinito, che le nuove annotazioni preselezionano; l'esempio principale è «Tipo lessicale», che parte da «Parola monorematica» nelle annotazioni semantiche (singole e multiple). Si imposta, si cambia o si toglie dalla pagina dei valori del tagset, con la stella accanto al valore; il campo resta modificabile.
- **Lessico negli autocomplete.** Accanto a ogni lemma compare la categoria grammaticale.
- **Layer e tagset.** Le finestre di creazione e modifica segnalano gli errori in modo chiaro e non si bloccano più.

## Dictionary e Lexicon

- **Anteprima della voce.** Più completa (tabelle dei contesti visibili subito, accezioni numerate a ogni livello, doppio clic su un contesto per aprire il testo alla riga giusta). Le occorrenze in altre opere seguono l'ordine fisso delle opere e le parti senza valore non vengono mostrate, anche nel PDF.
- **Editor di testo per note e definizioni.** Barra ridotta agli strumenti utili, caratteri speciali (« » – È ’), altri formati (apice, pedice, barrato, elenchi) e incolla pulita.
- **Explorer, Lexicon Editor e scheda Ordinamento.** Filtri affidabili (la lista filtrata non viene più sostituita da risposte vecchie), meno richieste al server, alberi più leggibili e con barra di scorrimento.
