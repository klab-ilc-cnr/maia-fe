import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { catchError, map, Subject, take, takeUntil } from 'rxjs';
import { searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntryListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LINGUISTIC_RELATION_TYPE, LinguisticRelationUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';

@Component({
  selector: 'app-lex-entry-decomp',
  templateUrl: './lex-entry-decomp.component.html',
  styleUrls: ['./lex-entry-decomp.component.scss']
})
export class LexEntryDecompComponent implements OnInit, OnDestroy {
  /**Subject per la gestione della cancellazione delle subscribe */
  private readonly unsubscribe$ = new Subject();
  @Input() lexicalEntryInstanceName!: string;
  lexicalEntryComponents!: LexicalEntryListItem[];
  form = new FormGroup({
    components: new FormArray<FormControl>([]),
  });
  get components() { return this.form.controls['components'] as FormArray; }

  _components: { label: string, value: string, external: boolean, inferred: boolean }[] = [];

  /**
     * Funzione di filtro delle entrate lessicali per see also
     * @param text {string} stringa di filtro della lista delle entrate lessicali per see also
     * @returns {Observable<{label: string, value: string, external: boolean, inferred: boolean}[]>}
     */
  lexEntryList = (text: string) => this.lexiconService.getLexicalEntriesList({
    text: text,
    searchMode: searchModeEnum.startsWith,
    type: '',
    pos: '',
    formType: '',
    author: '',
    lang: '',
    status: '',
    offset: 0,
    limit: 500
  }).pipe(
    map(resp => resp.list.map(le => <{ label: string, value: string, external: boolean, inferred: boolean }>{
      label: le.label,
      value: le.lexicalEntry,
      external: false,
      inferred: false
    }))
  );

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private lexiconService: LexiconService,
    private utility: CommonService,
  ) { }

  ngOnInit(): void {
    this.lexiconService.retrieveMultiwordComponents(this.lexicalEntryInstanceName).pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => this.utility.throwHttpErrorAndMessage(error, error.message))
    ).subscribe(resp => {
      this.lexicalEntryComponents = resp;
      this.lexicalEntryComponents.forEach(c => {
        const componentElement = { label: c.label, value: c.lexicalEntry, external: false, inferred: false };
        this.components.push(new FormControl(componentElement));
        this._components.push({ ...componentElement });
      });
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  onAddComponent() {
    const newComponent = { label: '', value: '', external: false, inferred: false };
    this.components.push(new FormControl(newComponent));
    this._components.push({ ...newComponent });
  }

  onRemoveComponent(index: number) {
    const currentValue = this._components[index].value;
    if (!currentValue || currentValue === '') {
      this.components.removeAt(index);
      this._components.splice(index, 1);
      return;
    }
    if (currentValue && currentValue !== '') {
      const confirmMsg = `Are you sure to remove "${this._components[index].label}"?`;
      this.popupDeleteItem.confirmMessage = confirmMsg;
      this.popupDeleteItem.showDeleteConfirmSimple(() => {
        this.lexiconService.deleteRelation(this.lexicalEntryInstanceName, { relation: 'http://www.w3.org/ns/lemon/decomp#subterm', value: currentValue }).pipe(
          take(1),
          catchError((error: HttpErrorResponse) => this.utility.throwHttpErrorAndMessage(error, error.message)),
        ).subscribe(() => {
          this.components.removeAt(index);
          this._components.splice(index, 1);
        })
      });
    }
  }

  onSelectLexEntry(selectedValue: { label: string, value: string, external: boolean, inferred: boolean }, formIndex: number) {
    if (this._components[formIndex].value !== selectedValue.value) {
      this.lexiconService.updateLinguisticRelation(this.lexicalEntryInstanceName, <LinguisticRelationUpdater>{
        type: LINGUISTIC_RELATION_TYPE.DECOMP,
        relation: 'http://www.w3.org/ns/lemon/decomp#subterm',
        currentValue: this._components[formIndex].value,
        value: selectedValue.value
      }).pipe(
        take(1),
        catchError((error: HttpErrorResponse) => this.utility.throwHttpErrorAndMessage(error, error.message)),
      ).subscribe(() => {
        this.components.at(formIndex).setValue(selectedValue);
        this._components[formIndex] = <{ label: string, value: string, external: boolean, inferred: boolean }>{ ...selectedValue };
      });
    }
  }
}
