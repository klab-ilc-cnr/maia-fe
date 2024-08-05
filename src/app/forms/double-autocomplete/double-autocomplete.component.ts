import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-double-autocomplete',
  templateUrl: './double-autocomplete.component.html',
  styleUrls: ['./double-autocomplete.component.scss']
})
export class DoubleAutocompleteComponent implements OnInit {
  @Input() isCheckboxVisible = true;
  @Input() isChecked = false;
  @Input() relationField: string | undefined;
  @Input() relations$!: Observable<{ label: string, id: string }[]>;
  @Input() valueField: string | undefined;
  @Input() valueId!: string;
  @Input() valueLabel!: string;
  @Input() valuesFilterFn!: (relation: string) => Observable<any[]>;
  @Output() remove = new EventEmitter();
  @Output() selected = new EventEmitter<{ relation: string, value: string, external: boolean }>();
  isValueSelected = false; //NOTE see https://github.com/klab-ilc-cnr/Maia/issues/78

  currentRelation$ = new BehaviorSubject<string>('');

  values = this.currentRelation$.pipe(
    switchMap(text => this.valuesFilterFn(text)),
  );

  ngOnInit(): void {
    if(this.relationField) {
      this.currentRelation$.next(this.relationField);
      if(this.valueField) { //NOTE see https://github.com/klab-ilc-cnr/Maia/issues/78
        this.isValueSelected = true;
      }
    }
  }

  onRemove() {
    this.remove.emit();
  }

  onSelectRelation(event: { originalEvent: PointerEvent, value: string }) {
    this.currentRelation$.next(event.value);
  }

  onSelectValue(event: { originalEvent: PointerEvent, value: string }) {
    if (!this.relationField) {
      console.error('manca la relazione');
      return;
    }
    this.isValueSelected = true; //NOTE see https://github.com/klab-ilc-cnr/Maia/issues/78
    const selection = { relation: this.relationField, value: event.value, external: this.isChecked };
    this.selected.emit(selection);
  }
}
