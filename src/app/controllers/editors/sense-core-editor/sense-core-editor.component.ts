import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, take, takeUntil, throwError } from 'rxjs';
import { PropertyElement, SenseCore } from 'src/app/models/lexicon/lexical-entry.model';
import { LexicalSenseUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { User } from 'src/app/models/user';
import { CommonService } from 'src/app/services/common.service';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';

@Component({
  selector: 'app-sense-core-editor',
  templateUrl: './sense-core-editor.component.html',
  styleUrls: ['./sense-core-editor.component.scss']
})
export class SenseCoreEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  @Input() senseEntry!: SenseCore;
  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;
  currentUser!: User;
  definitionFormItems: PropertyElement[] = [];
  definitionsMenuItems: { label: string, command: any }[] = [];
  form = new FormGroup({
    definition: new FormGroup({}),
    morphology: new FormArray<FormControl>([]),
  });
  _morphology: { relation: string, value: string, external: boolean }[] = [];
  get morphology() { return this.form.controls.morphology as FormArray; }
  get definition() { return this.form.controls.definition; }
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

  constructor(
    private userService: UserService,
    private commonService: CommonService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private lexiconService: LexiconService,
    private globalState: GlobalStateService,
  ) {
    this.userService.retrieveCurrentUser().pipe(
      take(1),
    ).subscribe(cu => {
      this.currentUser = cu;
    });

    this.definition.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe((resp: { [key: string]: any }) => {
      for (const key in resp) {
        const currentPropertyId = this.definitionFormItems.findIndex(e => e.propertyID === key);
        if (currentPropertyId === -1 || this.definitionFormItems[currentPropertyId].propertyValue === resp[key]) continue;
        this.updateSense(key, resp[key]).then(() => {
          if (resp[key] === '') {
            this.definitionFormItems = this.definitionFormItems.filter(i => i.propertyID !== key);
            this.definitionsMenuItems.push({
              label: key,
              command: () => {
                this.onAddDefinitionField(<PropertyElement>{ propertyID: key, propertyValue: '' });
              }
            }); return;
          }
          this.definitionFormItems[currentPropertyId] = <PropertyElement>{ ...this.definitionFormItems[currentPropertyId], propertyValue: resp[key] };
        });
      }
    });
  }

  ngOnInit(): void {
    for (const def of this.senseEntry.definition) {
      if (def.propertyID === 'definition') {
        this.definition.addControl('definition', new FormControl<string>(def.propertyValue, Validators.required));
      }
      if (def.propertyID !== 'definition' && def.propertyValue === '') {
        this.definitionsMenuItems.push({
          label: def.propertyID,
          command: () => {
            this.onAddDefinitionField(def);
          }
        });
        continue;
      }
      this.onAddDefinitionField(def);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  onAddDefinitionField(fieldProperty: PropertyElement) {
    this.definitionFormItems.push(fieldProperty);
    this.definition.addControl(fieldProperty.propertyID, new FormControl<string>(fieldProperty.propertyValue));
    this.definitionsMenuItems = this.definitionsMenuItems.filter(i => i.label !== fieldProperty.propertyID);
  }

  onAddMorphology() {
    const newMorph = { relation: '', value: '', external: false };
    this.morphology.push(new FormControl(newMorph));
    this._morphology.push(<{ relation: string, value: string, external: boolean }>{ ...newMorph });
  }

  onDeleteLexicalSense() {
    //TODO implementare metodo di cancellazione del senso e reindirizzamento dell'albero
  }

  onMorphSelection(event: { relation: string, value: string, external: boolean }, index: number) {
    const currentValue = this._morphology[index].value;
    if (currentValue !== event.value) {
      //TODO implementa salvatggio della selezione
      this.updateListControlList(this.morphology, this._morphology, index, event); //temporaneo
    }
  }

  onRemoveDefinitionElement(fieldName: string) {
    const confirmMsg = `Are you sure to remove "${fieldName}"?`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirmSimple(() => { this.definition.get(fieldName)?.setValue(''); });
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
        //TODO implementa rimozione della morfologia
        this.morphology.removeAt(index); //temporaneo
        this._morphology.splice(index, 1); //temporaneo
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
      this.senseEntry = <SenseCore>{ ...this.senseEntry, lastUpdate: resp };
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`"${relation}" update success `));
      this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.senseEntry.sense });
    });
  }

  private async updateSense(relation: string, value: string) {
    if (!this.currentUser.name) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Current user not found`));
      return;
    }
    const updater = <LexicalSenseUpdater>{
      relation: this.commonService.getSenseUpdateRelation(relation),
      value: value,
    };
    const updateObs = this.lexiconService.updateLexicalSense(this.currentUser.name, this.senseEntry.sense, updater);
    this.manageUpdateObservable(updateObs, relation);
  }

  private updateListControlList(list: FormArray<any>, controlList: { relation: string, value: string, external: boolean }[], index: number, value: { relation: string, value: string, external: boolean }) {
    list.at(index).setValue(value);
    controlList[index] = <{ relation: string, value: string, external: boolean }>{ ...value };
  }
}
