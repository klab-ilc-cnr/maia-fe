import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BehaviorSubject, Observable, debounceTime, switchMap } from 'rxjs';

/**Componente di input costituito da una checkbox (che può essere disabilitata) che decide se visualizzare un autocomplete (false) o un text input (true) */
@Component({
  selector: 'app-autocomplete-checkbox',
  templateUrl: './autocomplete-checkbox.component.html',
  styleUrls: ['./autocomplete-checkbox.component.scss']
})
export class AutocompleteCheckboxComponent {
  /**Nome della proprietà sulla quale eseguire la ricerca dell'autocomplete */
  @Input() field!: string;
  /**Valore del campo da realizzare */
  @Input() fieldValue!: { label: string, value: string, external: boolean, inferred: boolean };
  /**Definisce se flaggato (e quindi visualizza input di testo) */
  @Input() isChecked!: boolean;
  /**Definisce se la checkbox è disabilitata */
  @Input() isCheckedDisabled = false;
  /**Definisce se la checkbox è disabilitata */
  @Input() isCheckedHidden = false;
  /**Messaggio sostitutivo di un valore nell'autocomplete */
  @Input() placeholderMsg = '';
  /**Funzione di filtro dell'autocomplete */
  @Input() filterFn!: (filter: string) => Observable<any[]>;
  /**Evento di rimozione del componente */
  @Output() remove = new EventEmitter();
  /**Evento di emissione di un valore */
  @Output() selected = new EventEmitter<any>();
  /**Filtro corrente da applicare */
  currentFilter$ = new BehaviorSubject<string>('');
  /**Observable dei suggerimenti dell'autocomplete filtrati */
  suggestions = this.currentFilter$.pipe(
    debounceTime(500),
    switchMap(text => this.filterFn(text))
  );
  /**Metodo che gestisce la chiamata del filtro dell'autocomplete */
  onFilter(event: { originalEvent: { isTrusted: boolean }, query: string }) {
    this.currentFilter$.next(event.query);
  }
  /**Metodo che emette il valore inserito nell'input di testo su focus out */
  onFocusOut() {
    this.selected.emit({
      ...this.fieldValue,
      external: true,
      inferred: false
    });
  }
  /**Metodo che emette l'evento di rimozione del componente */
  onRemove() {
    this.remove.emit();
  }
  /**Metodo che emette il valore selezionato fra i suggerimenti dell'autocomplete */
  onSelectSuggestion(event: { label: string, value: string, external: boolean, inferred: boolean }) {
    this.selected.emit(event);
  }
}
