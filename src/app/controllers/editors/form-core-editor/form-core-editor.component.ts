import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, take, takeUntil, throwError } from 'rxjs';
import { FormCore, PropertyElement } from 'src/app/models/lexicon/lexical-entry.model';
import { FormUpdater } from 'src/app/models/lexicon/lexicon-updater';
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
    label: new FormGroup({})
  });
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

      this.formEntry.label.forEach(label => {
        if (label.propertyValue === '' && label.propertyID !== 'variant') { //TODO capire come gestire il caso variant
          this.representationItems.push({
            label: label.propertyID,
            command: () => {
              this.onAddLabelField(label)
            },
          });
        } else {
          this.onAddLabelField(label);
        }
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

  onDeleteLexicalForm() { } //TODO implementare cancellazione della forma lessicale con chiusura dell'editor e passaggio su editor dell'entrata lessicale

  onRemoveLabelElement(labelFieldName: string) { //TODO aggiungi popup di conferma
    const confirmMsg = `Are you sure to remove "${labelFieldName}"?`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirmSimple(() => { this.label.get(labelFieldName)?.setValue(''); });
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
}
