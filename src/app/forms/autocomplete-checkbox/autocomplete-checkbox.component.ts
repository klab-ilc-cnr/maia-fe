import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable, switchMap, BehaviorSubject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-autocomplete-checkbox',
  templateUrl: './autocomplete-checkbox.component.html',
  styleUrls: ['./autocomplete-checkbox.component.scss']
})
export class AutocompleteCheckboxComponent {
  @Input() field!: string;
  @Input() isChecked!: boolean;
  @Input() placeholderMsg = '';
  @Input() filterFn!: (filter: string) => Observable<any[]>;
  @Output() remove = new EventEmitter();


  currentFilter$ = new BehaviorSubject<string>('');

  suggestions = this.currentFilter$.pipe(
    debounceTime(500),
    switchMap(text => this.filterFn(text))
  );

  onFilter(event: {originalEvent: {isTrusted: boolean}, query: string}) {
    this.currentFilter$.next(event.query)
  }
}
