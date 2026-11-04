# CSS globali e layer (PrimeNG 18+)

Da PrimeNG 18 il tema non è più un file CSS: gli stili dei componenti sono generati dai **design token**
del preset (`src/app/theme/maia-preset.ts`) e iniettati a runtime in `<head>`, nel layer CSS `primeng`
(`providePrimeNG({ theme: { options: { cssLayer } } })` in `app.module.ts`).

Nella cascata CSS **una regola senza layer vince sempre su una regola in un layer**, e tra due layer vince
quello dichiarato dopo, a prescindere dalla specificità. L'ordine è dichiarato una sola volta, all'inizio
di `vendor.css` (primo file del bundle):

```css
@layer base, primeng;
```

| Livello (dal più debole) | Cosa contiene | Dove |
|---|---|---|
| `base` | Bootstrap, jsPanel, Font Awesome, primeicons, PrimeFlex, Quill; poi le regole dell'app sugli **elementi HTML** (`*`, `body`, `a`, `p`, `h1`…) e le classi di PrimeNG 17 usate su elementi dell'app (`.p-link`, `.p-error`) | `vendor.css`, `styles.scss` (blocchi `@layer base`), `primeng-compat.css` |
| `primeng` | stili dei componenti PrimeNG (runtime) + regole di compatibilità con PrimeNG 17 sui componenti | runtime, `primeng-compat.css` |
| senza layer | variabili del vecchio tema (`saga-variables.css`), variabili e regole dell'app (layout, `.card`, override `.p-*`), stili dei componenti Angular | `saga-variables.css`, `styles.scss`, `*.component.scss` |

Perché così:
- **Bootstrap sotto PrimeNG**: `button { border-radius: 0 }` di Bootstrap non rende quadrati i `p-button-rounded`.
  Le utility con `!important` (Bootstrap e PrimeFlex: `w-full`, `d-flex`, `mx-2`…) vincono comunque su PrimeNG,
  perché le dichiarazioni `!important` dei layer più deboli battono quelle dei layer più forti.
- **Elementi dell'app nello stesso layer di Bootstrap**: contano specificità e ordine come prima
  (`.form-label` di Bootstrap vince su `p` dell'app) e restano sotto PrimeNG (`a { color }` non colora i tab).
- **Classi dell'app senza layer**: vincono sugli stili di PrimeNG (es. `.layout-topbar … i { font-size }` contro
  `.pi { font-size: 1rem }` di PrimeNG, gli override `.p-paginator…` in rosso MAIA).

Altri file di questa cartella:
- `saga-variables.css`: le 45 variabili CSS di saga-blue (`--text-color`, `--surface-*`, `--font-family`…), usate da
  PrimeFlex 3 e dagli stili dell'app. Il nuovo tema usa `--p-*`; queste restano finché qualcuno le usa.
- `primeng-compat.css`: classi e comportamenti di PrimeNG 17 che PrimeNG 18+ non ha più ma che i template usano
  (`.p-fluid`, `.p-link`, `.p-error`, icone dei pannelli `iconPos="start"`, `p-scroller` nei contenitori flex…).
  Ogni regola dice cosa sostituisce: quando un template passa all'API nuova, la regola si può togliere.

Il preset parte da **Lara** e ne riprende i valori di saga-blue (blu Material per i componenti, grigi Bootstrap,
angoli di 3px, spaziature compatte). Fino a PrimeNG 17 l'app caricava `lara-light-blue` e poi `saga-blue`:
vinceva saga, ma dove saga non definiva una proprietà restava Lara (es. etichette dei pulsanti in grassetto).
Il confronto visivo si fa con `e2e/tests/visual-tour.spec.ts` (screenshot prima/dopo).
