import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, Subject, debounceTime, switchMap, take, takeUntil } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-generic-autocomplete',
  templateUrl: './generic-autocomplete.component.html',
  styleUrls: ['./generic-autocomplete.component.scss']
})
export class GenericAutocompleteComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  /**Nome della proprietà sulla quale eseguire la ricerca dell'autocomplete */
  @Input() field!: string;
  @Input() prefixField: string = '';
  @Input() suffixField: string = '';
  @Input() valueField!: string;
  @Input() currentValue!: any;
  @Input() filterFn!: (filter: string) => Observable<unknown[]>;
  @Input() initialValueFn!: (id: string) => Observable<unknown>;
  @Input() showOptionPrefix = false;
  @Input() showOptionSuffix = false;
  @Input() forceSelection = true;
  @Input() styleClass = '';
  @Input() inputStyleClass = '';
  valueToShow: any;
  /**Filtro corrente da applicare */
  currentFilter$ = new BehaviorSubject<string>('');
  suggestions = this.currentFilter$.pipe(
    debounceTime(300),
    switchMap(text => this.filterFn(text)),
  );
  /**Evento di emissione di un valore */
  @Output() selected = new EventEmitter<string>();

  constructor(
    private commonService: CommonService,
  ) {}

  ngOnInit(): void {
    if (this.currentValue) {
      this.initialValueFn(this.currentValue).pipe(take(1)).subscribe(resp => {
        this.valueToShow = resp;
        this.selected.emit(this.currentValue); //altrimenti non salva nel form i valori non modificati
      });
    }
    this.commonService.notifyObservable$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(notify => {
      if(notify.option === 'clear_feature_fields') {
        this.valueToShow = '';
      }
    });
  }

  onFilter(event: { originalEvent: { isTrusted: boolean }, query: string }) {
    this.currentFilter$.next(event.query);
  }

  onSelectSuggestion(event: any) {
    this.selected.emit(event[this.valueField]);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
