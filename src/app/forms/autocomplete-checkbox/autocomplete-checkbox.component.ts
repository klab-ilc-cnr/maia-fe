import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable, switchMap, BehaviorSubject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-autocomplete-checkbox',
  templateUrl: './autocomplete-checkbox.component.html',
  styleUrls: ['./autocomplete-checkbox.component.scss']
})
export class AutocompleteCheckboxComponent {
  @Input() field!: string;
  @Input() fieldValue!: { label: string, value: string, external: boolean, inferred: boolean };
  @Input() isChecked!: boolean;
  @Input() isCheckedDisabled = false;
  @Input() placeholderMsg = '';
  @Input() filterFn!: (filter: string) => Observable<any[]>;
  @Output() remove = new EventEmitter();
  @Output() selected = new EventEmitter<any>();

  currentFilter$ = new BehaviorSubject<string>('');

  suggestions = this.currentFilter$.pipe(
    debounceTime(500),
    switchMap(text => this.filterFn(text))
  );

  onFilter(event: { originalEvent: { isTrusted: boolean }, query: string }) {
    this.currentFilter$.next(event.query);
  }

  onFocusOut() {
    this.selected.emit({
      ...this.fieldValue,
      external: true,
      inferred: false
    });
  }

  onRemove() {
    this.remove.emit();
  }

  onSelectSuggestion(event: { label: string, value: string, external: boolean, inferred: boolean }) {
    this.selected.emit(event);
  }
}
