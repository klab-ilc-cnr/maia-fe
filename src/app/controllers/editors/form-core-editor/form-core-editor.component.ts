import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, take, takeUntil, throwError } from 'rxjs';
import { FormCore, PropertyElement } from 'src/app/models/lexicon/lexical-entry.model';
import { FormUpdater, LINGUISTIC_RELATION_TYPE, LinguisticRelationUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { User } from 'src/app/models/user';
import { CommonService } from 'src/app/services/common.service';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';

@Component({
  selector: 'app-form-core-editor',
  templateUrl: './form-core-editor.component.html',
  styleUrls: ['./form-core-editor.component.scss']
})
export class FormCoreEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  emptyField = '-- Select --'
  @Input() formEntry$!: Observable<FormCore>;
  currentUser!: User;
  formEntry!: FormCore;
  form = new FormGroup({
    pos: new FormControl<string>(''),
    type: new FormControl<string>(''),
    label: new FormGroup({}),
    morphology: new FormArray<FormControl>([]),
  });
  _morphology: { relation: string, value: string, external: boolean }[] = [];
  get morphology() { return this.form.controls['morphology'] as FormArray; }
  pos$ = this.globalState.pos$;
  types$ = this.globalState.formEntryTypes$;
  labelFormItems: PropertyElement[] = [];
  representationItems: { label: string, command: any }[] = [{
    label: 'Variant',
    command: () => {
      console.info('variant');
    }
  }];
  get label() { return this.form.controls.label; }

  morphRelations$ = this.globalState.morphologies$.pipe(
    switchMap(list => {
      const mappedElements = list.map(l => <{ label: string, id: string }>{ label: l.propertyLabel, id: l.propertyId });
      return of(mappedElements);
    }),
  );

  morphRelationValues = (relation: string) => this.globalState.morphologies$.pipe(
    switchMap(list => {
      const values = list.find(morph => morph.propertyId === relation)?.propertyValues ?? [];
      return of(values);
    }),
  );

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private globalState: GlobalStateService,
    private lexiconService: LexiconService,
    private userService: UserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private commonService: CommonService,
  ) {
    this.userService.retrieveCurrentUser().pipe(
      take(1),
    ).subscribe(cu => {
      this.currentUser = cu;
    });

    this.form.controls.type.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      distinctUntilChanged(),
    ).subscribe(newValue => {
      if (!newValue?.endsWith('#' + this.formEntry.type)) {
        this.updateForm('type', newValue ?? '').then(() => {
          this.formEntry = <FormCore>{ ...this.formEntry, type: newValue?.split('#')[1] };
        });
      }
    });

    this.label.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe((resp: { [key: string]: any }) => {
      for (const key in resp) {
        const currentPropertyId = this.labelFormItems.findIndex(e => e.propertyID === key);
        if (currentPropertyId !== -1 && this.labelFormItems[currentPropertyId].propertyValue !== resp[key]) {
          this.updateForm(key, resp[key]).then(() => {
            if (resp[key] === '') {
              this.labelFormItems = this.labelFormItems.filter(item => item.propertyID !== key);
              this.representationItems.push({
                label: key,
                command: () => {
                  this.onAddLabelField(<PropertyElement>{ propertyID: key, propertyValue: '' });
                },
              });
              return;
            }
            this.labelFormItems[currentPropertyId] = <PropertyElement>{ ...this.labelFormItems[currentPropertyId], propertyValue: resp[key] };
          });
        }
      }
    });
  }

  ngOnInit(): void {
    this.formEntry$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(fe => {
      this.formEntry = fe;
      const pos = this.formEntry.inheritedMorphology.find(m => m.trait.endsWith('partOfSpeech'))?.value;
      if (pos) {
        this.form.get('pos')?.setValue(pos);
      }
      this.form.get('pos')?.disable();
      if (this.formEntry.type) this.form.get('type')?.setValue('http://www.w3.org/ns/lemon/ontolex#' + this.formEntry.type);

      for(const label of this.formEntry.label) {
        if (label.propertyValue === '' && label.propertyID !== 'variant') { //TODO capire come gestire il caso variant
          if(label.propertyID === 'writtenRep') {
            this.label.addControl(label.propertyID, new FormControl<string>(label.propertyValue, Validators.required));
          }
          this.representationItems.push({
            label: label.propertyID,
            command: () => {
              this.onAddLabelField(label)
            },
          });
          continue;
        }
        this.onAddLabelField(label);
      }

      // this.formEntry.label.forEach(label => {
      //   if (label.propertyValue === '' && label.propertyID !== 'variant') { //TODO capire come gestire il caso variant
      //     this.representationItems.push({
      //       label: label.propertyID,
      //       command: () => {
      //         this.onAddLabelField(label)
      //       },
      //     });
      //   } else {
      //     this.onAddLabelField(label);
      //   }
      // });

      this.formEntry.morphology.forEach(m => {
        const morphElement = { relation: m.trait, value: m.value, external: false };
        this.morphology.push(new FormControl(morphElement));
        this._morphology.push(<{ relation: string, value: string, external: boolean }>{ ...morphElement });
      });
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  onAddLabelField(property: PropertyElement) {
    this.labelFormItems.push(property);
    this.label.addControl(property.propertyID, new FormControl<string>(property.propertyValue));
    this.representationItems = this.representationItems.filter(i => i.label !== property.propertyID);
  }

  onAddMorphology() {
    const newMorph = { relation: '', value: '', external: false };
    this.morphology.push(new FormControl(newMorph));
    this._morphology.push(<{ relation: string, value: string, external: boolean }>{ ...newMorph });
  }

  onDeleteLexicalForm() {
    //TODO implementare cancellazione della forma lessicale con chiusura dell'editor e passaggio su editor dell'entrata lessicale
  }

  onMorphSelection(event: { relation: string, value: string, external: boolean }, index: number) {
    const currentValue = this._morphology[index].value;
    if (currentValue !== event.value) {
      this.updateLinguisticRelation(LINGUISTIC_RELATION_TYPE.MORPHOLOGY, event.relation, event.value, currentValue).then(() => {
        this.updateListControlList(this.morphology, this._morphology, index, event);
      });
    }
  }

  onRemoveLabelElement(labelFieldName: string) {
    const confirmMsg = `Are you sure to remove "${labelFieldName}"?`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirmSimple(() => { this.label.get(labelFieldName)?.setValue(''); });
  }

  onRemoveMorph(index: number) {
    const currentValue = this._morphology[index].value;
    if (!currentValue || currentValue === '') {
      this.morphology.removeAt(index);
      this._morphology.splice(index, 1);
      return;
    }
    if (currentValue && currentValue !== '') {
      const confirmMsg = `Are you sure to remove "${currentValue}"?`;
      this.popupDeleteItem.confirmMessage = confirmMsg;
      this.popupDeleteItem.showDeleteConfirmSimple(() => {
        this.removeRelation({ relation: this._morphology[index].relation, value: currentValue }).then(
          () => {
            this.morphology.removeAt(index);
            this._morphology.splice(index, 1);
          },
          () => null
        );
      });
    }
  }

  private async manageUpdateObservable(updateObs: Observable<string>, relation: string) {
    updateObs.pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`"${relation}" update failed `));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(resp => {
      this.formEntry = <FormCore>{ ...this.formEntry, lastUpdate: resp };
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`"${relation}" update success `));
      this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.formEntry.lexicalEntry });
    });
  }

  private async updateForm(relation: string, value: string) {
    if (!this.currentUser.name) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Current user not found`));
      return;
    }
    const updater = <FormUpdater>{
      relation: this.commonService.getFormUpdateRelation(relation),
      value: value,
    };
    const updateObs = this.lexiconService.updateLexicalForm(this.currentUser.name, this.formEntry.form, updater);
    this.manageUpdateObservable(updateObs, relation);
  }

  private async removeRelation(updater: { relation: string, value: string }) {
    this.lexiconService.deleteRelation(this.formEntry.form, updater).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.formEntry.label} removing "${updater.value}" failed `));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(resp => {
      this.formEntry = <FormCore>{ ...this.formEntry, lastUpdate: resp };
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${this.formEntry.label} removing "${updater.value}" success `));
      this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.formEntry.lexicalEntry });
    });
  }

  private async updateLinguisticRelation(type: LINGUISTIC_RELATION_TYPE, relation: string, value: any, currentValue?: any) {
    if (!this.currentUser.name) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Current user not found`));
      return;
    }
    const updater = <LinguisticRelationUpdater>{
      type: type,
      relation: relation,
      value: value,
      currentValue: currentValue ?? ''
    };
    this.manageUpdateObservable(this.lexiconService.updateLinguisticRelation(this.formEntry.form, updater), relation);
  }

  private updateListControlList(list: FormArray<any>, controlList: { relation: string, value: string, external: boolean }[], index: number, value: { relation: string, value: string, external: boolean }) {
    list.at(index).setValue(value);
    controlList[index] = <{ relation: string, value: string, external: boolean }>{ ...value };
  }
}
