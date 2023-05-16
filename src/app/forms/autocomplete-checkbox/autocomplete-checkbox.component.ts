import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, switchMap, BehaviorSubject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-autocomplete-checkbox',
  templateUrl: './autocomplete-checkbox.component.html',
  styleUrls: ['./autocomplete-checkbox.component.scss']
})
export class AutocompleteCheckboxComponent {
  @Input() field!: string;
  @Input() control!: FormControl;
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

  onFilter(event: {originalEvent: {isTrusted: boolean}, query: string}) {
    this.currentFilter$.next(event.query)
  }

  onRemove() {
    this.remove.emit();
  }

  onSelectSuggestion(event: any) {
    this.selected.emit(event);
  }
}
