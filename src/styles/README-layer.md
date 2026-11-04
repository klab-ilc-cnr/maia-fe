# CSS globali nel layer `primeng` (temporaneo, PrimeNG 16.4 – 17)

Da PrimeNG 16.4 i temi e `primeng.min.css` sono racchiusi in `@layer primeng`.
Nella cascata CSS **una regola senza layer vince sempre su una regola in un layer**, a prescindere
dalla specificità. Con Angular 14 / PrimeNG 14 non c'erano layer: vinceva la regola più specifica.

Effetti visti senza correzione:
- `button { border-radius: 0 }` di Bootstrap rendeva quadrati i pulsanti `p-button-rounded`;
- `a { color: var(--primary-color) }` di `styles.scss` colorava di rosso tutti i tab di `p-tabView`.

Soluzione: **tutti i CSS globali stanno nello stesso layer `primeng`**, nello stesso ordine di prima.
Dentro un layer contano di nuovo specificità e ordine: la cascata torna come in PrimeNG 14.
Restano fuori dai layer solo gli stili dei singoli componenti Angular (come prima, vincono sugli stili globali).

| Dove | Cosa |
|---|---|
| `angular.json` → `styles` | i file `layer-*.css` di questa cartella importano primeicons, Font Awesome, Bootstrap e Quill con `layer(primeng)`; i CSS di PrimeNG restano diretti (sono già nel layer) |
| `src/styles.scss` | gli import CSS non di PrimeNG hanno `layer(primeng)`; le regole dell'app sono dentro `@layer primeng { … }` |
| `src/styles.scss` → `:root` | **eccezione**: le variabili dell'app (`--primary-color`, font…) restano **fuori** dal layer, perché i temi PrimeNG definiscono il loro `:root` senza layer; stando dopo i temi, le nostre vincono come prima |

Attenzione: i temi PrimeNG lasciano fuori dal layer anche alcune regole di `p-editor`, `p-colorpicker-panel` e `p-overflow-hidden`.
Se in futuro un nostro stile globale deve sovrascriverle, anche quello va messo fuori dal layer.

**Da rimuovere con PrimeNG 18+** (fase 3 dell'upgrade): il nuovo tema ha l'opzione `cssLayer`, disattivata di default.
