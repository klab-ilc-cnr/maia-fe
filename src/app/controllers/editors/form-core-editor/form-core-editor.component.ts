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
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';
/**Componente dell'editor di lavorazione del core di una forma */
@Component({
  selector: 'app-form-core-editor',
  templateUrl: './form-core-editor.component.html',
  styleUrls: ['./form-core-editor.component.scss']
})
export class FormCoreEditorComponent implements OnInit, OnDestroy {
  /**Subject per la gestione della cancellazione delle subscribe */
  private readonly unsubscribe$ = new Subject();
  /**Stringa per il campo vuoto */
  emptyField = '-- Select --'
  /**Utente loggato */
  currentUser!: User;
  /**Forma in lavorazione */
  @Input() formEntry!: FormCore;
  /**Form di lavorazione della forma */
  form = new FormGroup({
    pos: new FormControl<string>(''),
    type: new FormControl<string>(''),
    label: new FormGroup({}),
    morphology: new FormArray<FormControl>([]),
  });
  /**Lista di controllo dei tratti morfologici */
  _morphology: { relation: string, value: string, external: boolean }[] = [];
  /**Getter del form array dei tratti morfologici */
  get morphology() { return this.form.controls['morphology'] as FormArray; }
  /**Observable dei valori pos disponibili */
  pos$ = this.globalState.pos$;
  /**Observable dei tipi di forma */
  types$ = this.globalState.formEntryTypes$;
  /**Lista di controllo dei campi label */
  labelFormItems: PropertyElement[] = [];
  /**Lista di voci del menu di aggiunta di un nuovo elemento di representations */
  representationItems: { label: string, command: any }[] = [{
    label: 'Variant',
    command: () => {
      console.info('variant');
    }
  }];
  /**Getter del form group delle label */
  get label() { return this.form.controls.label; }
  /**Observable delle relazioni morfologiche */
  morphRelations$ = this.globalState.morphologies$.pipe(
    switchMap(list => {
      const mappedElements = list.map(l => <{ label: string, id: string }>{ label: l.propertyLabel, id: l.propertyId });
      return of(mappedElements);
    }),
  );
  /**
   * Funzione di filtro delle relazioni morfologiche
   * @param relation {string} relazione selezionata
   * @returns {Observable<OntolexType[]>} observable della lista di valori associati a una relazione
   */
  morphRelationValues = (relation: string) => this.globalState.morphologies$.pipe(
    switchMap(list => {
      const values = list.find(morph => morph.propertyId === relation)?.propertyValues ?? [];
      return of(values);
    }),
  );
  /**
   * Funzione di cancellazione di una forma
   * @param formId {string} identificativo della forma
   */
  private deleteForm = (formId: string) => {
    this.showOperationInProgress("Deletion in progress");
    const successMsg = "Successfully removed form";
    this.lexiconService.deleteForm(formId).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.showOperationFailed("Deletion failed: " + error.message);
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(() => {
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
      this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.formEntry.lexicalEntry, isRemove: true });
      Swal.close();
    });
  }
  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per FormCoreEditorComponent
   * @param globalState {GlobalStateService} servizi per il recupero dello stato globale del lessico
   * @param lexiconService {LexiconService} servizi relativi al lessico
   * @param userService {UserService} servizi relativi agli utenti
   * @param messageService {MessageService} api primeng
   * @param msgConfService {MessageConfigurationService} servizi di configurazione dei messaggi
   * @param commonService {CommonService} servizi di utilità generale
   */
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
              this.movePropertyToMenu(key);
              return;
            }
            this.labelFormItems[currentPropertyId] = <PropertyElement>{ ...this.labelFormItems[currentPropertyId], propertyValue: resp[key] };
          });
        }
      }
    });
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per la valorizzazione iniziale del componente e del form */
  ngOnInit(): void {
    const pos = this.formEntry.inheritedMorphology.find(m => m.trait.endsWith('partOfSpeech'))?.value;
    if (pos) {
      this.form.get('pos')?.setValue(pos);
    }
    this.form.get('pos')?.disable();
    if (this.formEntry.type) this.form.get('type')?.setValue('http://www.w3.org/ns/lemon/ontolex#' + this.formEntry.type);

    for (const label of this.formEntry.label) {
      if (label.propertyID === 'variant') continue; //TODO capire come gestire il caso variant
      if (label.propertyValue != '')
        this.movePropertyToForm(label.propertyID, label.propertyValue);
      else
        this.movePropertyToMenu(label.propertyID);
    }
    this.formEntry.morphology.forEach(m => {
      const morphElement = { relation: m.trait, value: m.value, external: false };
      this.morphology.push(new FormControl(morphElement));
      this._morphology.push(<{ relation: string, value: string, external: boolean }>{ ...morphElement });
    });
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per l'emissione e chiusura del subject di gestione delle subscribe */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }


  /**
   * Metodo responsabile dell'aggiunta di una label nel form dinamico
   * @param propertyID {string} nome della label da aggiungere nel form
   * @param propertyValue {string} valore della label da aggiungere nel form
   */
  private movePropertyToForm(propertyID: string, propertyValue: string) {
    const formControl = new FormControl<string>(propertyValue, Validators.required);
    const property = <PropertyElement> { propertyID, propertyValue };
    this.label.addControl(propertyID, formControl);
    this.labelFormItems.push(property);
    this.representationItems = this.representationItems.filter(i => i.label !== propertyID);
  }

  /**
   * Metodo responsabile della rimozione di una label dal form dinamico
   * @param propertyID {string} nome della label da rimuovere dal form
   */
  private movePropertyToMenu(propertyID: string) {
    const index = this.labelFormItems.findIndex(e => e.propertyID === propertyID);
    this.labelFormItems.splice(index, 1);
    this.label.removeControl(propertyID);
    this.representationItems.push({
        label: propertyID,
        command: () => this.movePropertyToForm(propertyID, ''),
    });
  }

  /**Metodo di aggiunta di una riga di tratti morfologici */
  onAddMorphology() {
    const newMorph = { relation: '', value: '', external: false };
    this.morphology.push(new FormControl(newMorph));
    this._morphology.push(<{ relation: string, value: string, external: boolean }>{ ...newMorph });
  }

  /**Metodo per la cancellazione della forma */
  onDeleteLexicalForm() {
    const confirmMsg = "You are about to delete a form";
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteForm(this.formEntry.form), this.formEntry.form);
  }

  /**
   * Metodo che salva la selezione di un tratto morfologico e del suo valore
   * @param event {{ relation: string, value: string, external: boolean }} evento emesso dal componente su selezione
   * @param index {number} indice nella lista dei campi di morfologia
   */
  onMorphSelection(event: { relation: string, value: string, external: boolean }, index: number) {
    const currentValue = this._morphology[index].value;
    if (currentValue !== event.value) {
      this.updateLinguisticRelation(LINGUISTIC_RELATION_TYPE.MORPHOLOGY, event.relation, event.value, currentValue).then(() => {
        this.updateListControlList(this.morphology, this._morphology, index, event);
      });
    }
  }

  /**
   * Metodo che rimuove un elemento dalla lista di campi delle label
   * @param labelFieldName {string} nome del field label da rimuobre
   */
  onRemoveLabelElement(labelFieldName: string) {
    const confirmMsg = `Are you sure to remove "${labelFieldName}"?`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirmSimple(() => {
      const control = this.label.get(labelFieldName);
      if (control?.value === '') {
        this.movePropertyToMenu(labelFieldName);
      }
      else {
        control?.setValue('');
      }
    });
  }

  /**
   * Metodo che rimuove un elemento dalla lista dei tratti morfologici
   * @param index {number} indice del tratto morfologico nella lista
   * @returns {void}
   */
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

  /**
   * @private
   * Metodo che gestisce l'observable di update
   * @param updateObs {Observable<string>} observable del timestamp di ultimo aggiornamento
   * @param relation {string} relazione aggiornata
   */
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
  /**
   * @private
   * Metodo di rimozione di una relazione
   * @param updater {{ relation: string, value: string }} oggetto di aggiornamento
   */
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

  /**
   * @private
   * Metodo che aggiorna una forma
   * @param relation {string} relazione da aggiornare
   * @param value {string} nuovo valore dellazione
   * @returns {Promise<void>}
   */
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

  /**
   * @private
   * Metodo per l'aggiornamento di una relazione linguistica
   * @param type {LINGUISTIC_RELATION_TYPE} tipo di relazione linguistica
   * @param relation {string} relazione da aggiornare
   * @param value {any} nuovo valore
   * @param currentValue {any} eventuale valore corrente
   * @returns {Promise<void>}
   */
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

  /**
 * @private
 * Metodo che visualizza il popup di operazione fallita
 * @param errorMessage {string} messaggio di errore
 */
  private showOperationFailed(errorMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: errorMessage,
      showConfirmButton: true
    });
  }

  /**
 * @private
 * Metodo che visualizza il popup di operazione in corso
 * @param message {string} messaggio da visualizzare
 */
  private showOperationInProgress(message: string): void {
    Swal.fire({
      icon: 'warning',
      titleText: message,
      text: 'please wait',
      customClass: {
        container: 'swal2-container'
      },
      showCancelButton: false,
      showConfirmButton: false
    });
  }

  /**
   * Metodo che aggiorna la lista del formarray e la relativa lista di controllo con il nuovo valore
   * @param list {FormArrya<any>} lista di elementi del campo formarray
   * @param controlList { relation: string, value: string, external: boolean }[]} lista di controllo
   * @param index {number} indice dell'elemento nelle liste
   * @param value {{ relation: string, value: string, external: boolean }} valore aggiornato
   */
  private updateListControlList(list: FormArray<any>, controlList: { relation: string, value: string, external: boolean }[], index: number, value: { relation: string, value: string, external: boolean }) {
    list.at(index).setValue(value);
    controlList[index] = <{ relation: string, value: string, external: boolean }>{ ...value };
  }
}
