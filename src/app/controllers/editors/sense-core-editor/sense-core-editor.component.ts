import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, take, takeUntil, throwError } from 'rxjs';
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
  @Input() senseEntry$!: Observable<SenseCore>;
  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;
  currentUser!: User;
  definitionFormItems: PropertyElement[] = [];
  definitionsMenuItems: { label: string, command: any }[] = [];
  form = new FormGroup({
    definition: new FormGroup({}),
  });
  senseEntry!: SenseCore;
  get definition() { return this.form.controls.definition; }

  constructor(
    private userService: UserService,
    private globalState: GlobalStateService,
    private commonService: CommonService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private lexiconService: LexiconService,
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
    this.senseEntry$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(sense => {
      this.senseEntry = sense;
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
    });

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

  onDeleteLexicalSense() {
    //TODO implementare metodo di cancellazione del senso e reindirizzamento dell'albero
  }

  onRemoveDefinitionElement(fieldName: string) {
    const confirmMsg = `Are you sure to remove "${fieldName}"?`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirmSimple(() => { this.definition.get(fieldName)?.setValue(''); });
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
}
