import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { decode, encode } from 'html-entities';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, Observable, Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, take, takeUntil, throwError } from 'rxjs';
import { LexicalConceptListItem } from 'src/app/models/lexicon/lexical-concept-list-item.model';
import { PropertyElement, SenseCore } from 'src/app/models/lexicon/lexical-entry.model';
import { LexicalSenseUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { User } from 'src/app/models/user';
import { CommonService } from 'src/app/services/common.service';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';
/**Componente dell'editor di lavorazione del core di un senso */
@Component({
  selector: 'app-sense-core-editor',
  templateUrl: './sense-core-editor.component.html',
  styleUrls: ['./sense-core-editor.component.scss']
})
export class SenseCoreEditorComponent implements OnInit, OnDestroy {
  readonly translatePrefix = 'LEXICON_EDITOR.SENSE';
  private readonly partOfSpeechId = 'http://www.lexinfo.net/ontology/3.0/lexinfo#partOfSpeech';
  demoHide = environment.demoHide;
  /**Subject per la gestione della cancellazione delle subscribe */
  private readonly unsubscribe$ = new Subject();
  /**Senso in lavorazione */
  @Input() senseEntry!: SenseCore;
  /**Identificativo dell'entrata lessicale di appartenenza */
  @Input() lexEntryId!: string;
  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;
  /**Utente loggato */
  currentUser!: User;
  /**Lista di lingue disponibili per le definizioni */
  etymologyLanguages$ = this.lexiconService.getEtymologyLanguages();
  /**Form per la modifica dei valori del senso */
  form = new FormGroup({
    definitions: new FormArray<FormGroup>([]),
    marksOfUse: new FormControl<LexicalConceptListItem[]>([]),
    semanticMarks: new FormControl<LexicalConceptListItem[]>([]),
    grammaticalMarks: new FormControl<LexicalConceptListItem[]>([]),
    morphology: new FormArray<FormControl>([]),
  });
  /**Lista di controllo delle relazioni morfologiche */
  _morphology: { relation: string, value: string, external: boolean }[] = [];
  /**Getter del form array della morfologia */
  get morphology() { return this.form.controls.morphology as FormArray; }
  /**Getter del form array delle definizioni */
  get definitions() { return this.form.controls.definitions as FormArray<FormGroup>; }
  /**Observable della relazioni morfologiche */
  morphRelations$ = this.globalState.morphologies$.pipe(
    switchMap(list => {
      const mappedElements = list.filter(el => el.propertyId !== this.partOfSpeechId)
        .map(l => <{ label: string, id: string }>{ label: l.propertyLabel, id: l.propertyId });
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
      const values = list.filter(el => el.propertyId !== this.partOfSpeechId)
        .find(morph => morph.propertyId === relation)?.propertyValues ?? [];
      return of(values);
    }),
  );
  marksOfUse: LexicalConceptListItem[] = [];
  semanticMarks: LexicalConceptListItem[] = [];
  grammaticalMarks: LexicalConceptListItem[] = [];
  currentFilterMoU$ = new BehaviorSubject<string>('');
  currentFilterSM$ = new BehaviorSubject<string>('');
  currentFilterGM$ = new BehaviorSubject<string>('');
  marksOfUse$ = this.currentFilterMoU$.pipe(
    debounceTime(500),
    takeUntil(this.unsubscribe$),
    switchMap(text => of(this.marksOfUse.filter(l => l.defaultLabel.toLowerCase().includes(text.toLowerCase())))),
  );
  semanticMarks$ = this.currentFilterSM$.pipe(
    debounceTime(500),
    takeUntil(this.unsubscribe$),
    switchMap(text => of(this.semanticMarks.filter(l => l.defaultLabel.toLowerCase().includes(text.toLowerCase())))),
  );
  grammaticalMarks$ = this.currentFilterGM$.pipe(
    debounceTime(500),
    takeUntil(this.unsubscribe$),
    switchMap(text => of(this.grammaticalMarks.filter(l => l.defaultLabel.toLowerCase().includes(text.toLowerCase())))),
  );
  /**
   * Funzione di cancellazione di un senso
   * @param senseId {string} identificativo del senso
   */
  private deleteSense = (senseId: string) => {
    this.showOperationInProgress(this.commonService.translateKey(this.translatePrefix + '.deletionInProg'));
    const successMsg = this.commonService.translateKey(this.translatePrefix + '.removeSenseSuccess');
    this.lexiconService.deleteLexicalSense(senseId).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        const errMess = JSON.parse(error.error)['message']
        this.showOperationFailed(errMess);
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(() => {
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
      this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.lexEntryId, isRemove: true });
      Swal.close();
    });
  }

  /**
   * Costruttore per SenseCoreEditorComponent
   * @param userService {UserService} servizi relativi agli utenti
   * @param commonService {CommonService} servizi di utilità generale
   * @param messageService {MessageService} api primeng
   * @param msgConfService {MessageConfigurationService} servizi di configurazione dei messaggi
   * @param lexiconService {LexiconService} servizi relativi al lessico
   * @param globalState {GlobalStateService} servizi dello stato del lessico
   */
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

    this.definitions.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe(() => {
      // Salva sempre la prima definizione (principale) al backend
      const firstDefinition = this.definitions.at(0);
      if (firstDefinition) {
        const defValue = firstDefinition.value;
        const detailsValue = defValue.details || '';
        const languageValue = defValue.language || '';
        const etymonValue = defValue.etymon || '';
        
        // Recupera i valori correnti dal backend
        const existingDef = this.senseEntry.definition.find(def => def.propertyID === 'definition');
        const currentValue = existingDef?.propertyValue ? decode(existingDef.propertyValue) : '';
        const currentLanguage = this.senseEntry.definition.find(def => def.propertyID === 'definitionLanguage')?.propertyValue || '';
        const currentEtymon = this.senseEntry.definition.find(def => def.propertyID === 'definitionEtymon')?.propertyValue || '';
        
        // Salva details
        if (detailsValue !== currentValue) {
          if (detailsValue === '') {
            // Se il campo è vuoto, elimina la relazione
            if (existingDef) {
              const deleteRelObs = this.lexiconService.deleteRelation(this.senseEntry.sense, { 
                relation: 'definition', 
                value: existingDef.propertyValue 
              });
              this.manageUpdateObservable(deleteRelObs, 'definition', '');
            }
          } else {
            // Salva il valore encoded
            const encodedValue = encode(detailsValue);
            this.updateSense('definition', encodedValue).then(() => {
              this.updateDefinitionProperty('definition', encodedValue);
            });
          }
        }
        
        // Salva language
        if (languageValue !== currentLanguage) {
          if (languageValue === '') {
            // Se il campo è vuoto, elimina la relazione
            const existingLanguage = this.senseEntry.definition.find(def => def.propertyID === 'definitionLanguage');
            if (existingLanguage) {
              const deleteRelObs = this.lexiconService.deleteRelation(this.senseEntry.sense, { 
                relation: 'definitionLanguage', 
                value: currentLanguage 
              });
              this.manageUpdateObservable(deleteRelObs, 'definitionLanguage', '');
            }
          } else {
            // Salva language tramite updateSense
            this.updateSense('definitionLanguage', languageValue).then(() => {
              this.updateDefinitionProperty('definitionLanguage', languageValue);
            });
          }
        }
        
        // Salva etymon
        if (etymonValue !== currentEtymon) {
          if (etymonValue === '') {
            // Se il campo è vuoto, elimina la relazione
            const existingEtymon = this.senseEntry.definition.find(def => def.propertyID === 'definitionEtymon');
            if (existingEtymon) {
              const deleteRelObs = this.lexiconService.deleteRelation(this.senseEntry.sense, { 
                relation: 'definitionEtymon', 
                value: currentEtymon 
              });
              this.manageUpdateObservable(deleteRelObs, 'definitionEtymon', '');
            }
          } else {
            // Salva etymon tramite updateSense
            this.updateSense('definitionEtymon', etymonValue).then(() => {
              this.updateDefinitionProperty('definitionEtymon', etymonValue);
            });
          }
        }
      }
    });
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per prevalorizzare il form */
  ngOnInit(): void {
    this.globalState.marksOfUse$.pipe(
      take(1),
    ).subscribe(resp => {
      this.marksOfUse = resp;
    });
    this.globalState.semanticMarks$.pipe(
      take(1),
    ).subscribe(resp => {
      this.semanticMarks = resp;
    });
    this.globalState.grammaticalMarks$.pipe(
      take(1),
    ).subscribe(resp => {
      this.grammaticalMarks = resp;
      this.initLexicalConcepts();
    });
    //TODO aggiungere prevalorizzazione delle restrizioni morfologiche
    this.initDefinitions();
  }

  /**
   * Inizializza le definizioni dal senso esistente
   * Migra i dati esistenti nella nuova struttura
   */
  private initDefinitions() {
    // Cerca la definizione principale (propertyID === 'definition')
    const mainDefinition = this.senseEntry.definition.find(def => def.propertyID === 'definition');
    const languageDefinition = this.senseEntry.definition.find(def => def.propertyID === 'definitionLanguage');
    const etymonDefinition = this.senseEntry.definition.find(def => def.propertyID === 'definitionEtymon');
    
    if (mainDefinition && mainDefinition.propertyValue) {
      // Decodifica il valore HTML se è stato encoded
      const decodedValue = decode(mainDefinition.propertyValue);
      // Crea una nuova definizione con il contenuto esistente
      const newDefinition = new FormGroup({
        language: new FormControl<string>(languageDefinition?.propertyValue || ''),
        etymon: new FormControl<string>(etymonDefinition?.propertyValue || ''),
        details: new FormControl<string>(decodedValue)
      });
      this.definitions.push(newDefinition);
    } else {
      // Se non c'è una definizione principale ma ci sono language o etymon, crea comunque una definizione
      if (languageDefinition || etymonDefinition) {
        const newDefinition = new FormGroup({
          language: new FormControl<string>(languageDefinition?.propertyValue || ''),
          etymon: new FormControl<string>(etymonDefinition?.propertyValue || ''),
          details: new FormControl<string>('')
        });
        this.definitions.push(newDefinition);
      }
    }
    
    // Se non c'è una definizione principale, aggiungi comunque un elemento vuoto
    if (this.definitions.length === 0) {
      this.onAddDefinition();
    }
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per l'emissione e chiusura del subject di gestione delle subscribe */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  private initLexicalConcepts() {
    this.lexiconService.getLexicalConceptsBySenseId(this.senseEntry.sense).pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(rels => {
      const selectedMarksOfUse: LexicalConceptListItem[] = [];
      const selectedSemanticMarks: LexicalConceptListItem[] = [];
      const selectedGrammaticalMarks: LexicalConceptListItem[] = [];
      rels.forEach(r => {
        if (r?.entityType && r.entityType[0] === "Marche d'uso") {
          const tempMoU = this.marksOfUse.find(mou => mou.lexicalConcept === r.entity);
          if (tempMoU !== undefined) selectedMarksOfUse.push(tempMoU);
        } else if (r?.entityType && r.entityType[0] === "Marche semantiche") {
          const tempSM = this.semanticMarks.find(sm => sm.lexicalConcept === r.entity);
          if (tempSM !== undefined) selectedSemanticMarks.push(tempSM);
        } else if (r?.entityType && r?.entityType[0] === "Marche grammaticali") {
          const tempGM = this.grammaticalMarks.find(gm => gm.lexicalConcept === r.entity);
          if (tempGM !== undefined) selectedGrammaticalMarks.push(tempGM);
        }
      })
      this.form.controls.marksOfUse.setValue(selectedMarksOfUse);
      this.form.controls.semanticMarks.setValue(selectedSemanticMarks);
      this.form.controls.grammaticalMarks.setValue(selectedGrammaticalMarks);
    });
  }

  /**
   * Metodo che gestisce l'inserimento di una nuova definizione
   */
  onAddDefinition() {
    const newDefinition = new FormGroup({
      language: new FormControl<string>(''),
      etymon: new FormControl<string>(''),
      details: new FormControl<string>('')
    });
    this.definitions.push(newDefinition);
  }

  /**
   * Metodo che gestisce la rimozione di una definizione
   * @param index {number} indice della definizione da rimuovere
   */
  onRemoveDefinition(index: number) {
    const definitionGroup = this.definitions.at(index);
    const detailsValue = definitionGroup?.value.details;
    
    if (detailsValue && detailsValue.trim() !== '') {
      const confirmMsg = this.commonService.translateKey(this.translatePrefix + '.confirmRemoveDefinition') || 
                        `Are you sure to remove this definition?`;
      this.popupDeleteItem.confirmMessage = confirmMsg;
      this.popupDeleteItem.showDeleteConfirmSimple(() => {
        // TODO: implementare rimozione dal backend se necessario
        this.definitions.removeAt(index);
      });
    } else {
      this.definitions.removeAt(index);
    }
  }

  /**Metodo che gestisce l'inserimento di un nuovo elemento nei tratti morfologici */
  onAddMorphology() {
    const newMorph = { relation: '', value: '', external: false };
    this.morphology.push(new FormControl(newMorph));
    this._morphology.push(<{ relation: string, value: string, external: boolean }>{ ...newMorph });
  }

  onAssociateLexicalConcept(selectedConcept: LexicalConceptListItem) {
    console.info(selectedConcept)
    if (!selectedConcept) return
    this.lexiconService.associateLexicalConceptToSense(this.senseEntry.sense, selectedConcept.lexicalConcept).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe(() => {
      console.info(`${selectedConcept.defaultLabel} associated`);
    });
  }

  /**Metodo che gestisce la cancellazione del senso in lavorazione */
  onDeleteLexicalSense() {
    const confirmMsg = this.commonService.translateKey(this.translatePrefix + '.confirmDelSense');
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteSense(this.senseEntry.sense), this.senseEntry.sense);
  }

  onDissociateLexicalConcept(removedConcept: LexicalConceptListItem) {
    console.info(removedConcept)
    if (!removedConcept) return;
    this.lexiconService.dissociateLexicalConceptFromSense(this.senseEntry.sense, removedConcept.lexicalConcept).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe(() => {
      console.info(removedConcept)
    });
  }

  onFilter(type: string, event: { originalEvent: { isTrusted: boolean }, query: string }) {
    if (type === 'marksOfUse') {
      this.currentFilterMoU$.next(event.query);
    } else if (type === 'semanticMarks') {
      this.currentFilterSM$.next(event.query);
    } else if (type === 'grammaticalMarks') {
      this.currentFilterGM$.next(event.query);
    }
  }


  /**
   * Metodo che salva un nuovo inserimento nei tratti morfologici
   * @param event {{ relation: string, value: string, external: boolean }} evento emesso alla selezione dei valori di un tratto morfologico
   * @param index {number} indice nella lista e nella lista di controllo
   */
  onMorphSelection(event: { relation: string, value: string, external: boolean }, index: number) {
    const currentValue = this._morphology[index].value;
    if (currentValue !== event.value) {
      //TODO implementa salvataggio della selezione non appena disponibile il servizio relativo
      this.updateListControlList(this.morphology, this._morphology, index, event); //temporaneo
    }
  }


  /**
   * Metodo che gestisce la rimozione di un elemento dalla lista dei tratti morfologici
   * @param index {number} indice nell'elenco dei tratti morfologici
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
      const confirmMsg = this.commonService.translateKey(this.translatePrefix + '.confirmRemoveMorph').replace('#VALUE#', currentValue);
      this.popupDeleteItem.confirmMessage = confirmMsg;
      this.popupDeleteItem.showDeleteConfirmSimple(() => {
        //TODO implementa rimozione della morfologia
        this.morphology.removeAt(index); //temporaneo
        this._morphology.splice(index, 1); //temporaneo
      });
    }
  }

  /**
   * TrackBy function based on the index of the element in the array, added to avoid losing the focus
   * @param index {number} index of the element in the ngFor
   * @param item {any} element
   * @returns {number}
   */
  trackByIndexFn(index: number, item: any) {
    return index;
  }

  /**
   * @private
   * Metodo che gestisce l'observable di update
   * @param updateObs {Observable<string>} observable del timestamp di ultimo aggiornamento
   * @param relation {string} relazione aggiornata
   */
  private async manageUpdateObservable(updateObs: Observable<string>, relation: string, newValue: string) {
    updateObs.pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        return this.commonService.throwHttpErrorAndMessage(error, error.error.message);
        // this.messageService.add(this.msgConfService.generateWarningMessageConfig(`"${relation}" update failed `));
        // return throwError(() => new Error(error.error));
      }),
    ).subscribe(resp => {
      const updatedDefinitions: PropertyElement[] = [...this.senseEntry.definition];
      const relIndex = updatedDefinitions.findIndex(x => x.propertyID === relation);
      updatedDefinitions[relIndex].propertyValue = newValue;
      this.senseEntry = <SenseCore>{
        ...this.senseEntry,
        definition: updatedDefinitions,
        lastUpdate: resp
      };
      // this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`"${relation}" update success `));

      if (relation === 'definition') {
        this.commonService.notifyOther({
          option: 'lexicon_edit_tree_data',
          lexicalEntry: '',
          uri: this.senseEntry.sense,
          field: 'label',
          newValue
        })
      }
    });
  }

  /**
   * @private
   * Metodo che aggiorna un senso
   * @param relation {string} relazione da aggiornare
   * @param newValue {string} nuovo valore della relazione
   */
  private async updateSense(relation: string, newValue: string) {
    if (!this.currentUser.name) {
      const msg = this.msgConfService.generateWarningMessageConfig(`Current user not found`);
      this.messageService.add(msg);
      return;
    }

    const updater = <LexicalSenseUpdater>{
      relation: this.commonService.getSenseUpdateRelation(relation),
      value: newValue,
    };
    const updateObs = this.lexiconService.updateLexicalSense(this.currentUser.name, this.senseEntry.sense, updater);
    this.manageUpdateObservable(updateObs, relation, newValue);
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

  /**
   * Metodo che aggiorna una proprietà nell'array definition
   * @param propertyID {string} identificativo della proprietà
   * @param propertyValue {string} valore della proprietà
   */
  private updateDefinitionProperty(propertyID: string, propertyValue: string) {
    const updatedDefinitions: PropertyElement[] = [...this.senseEntry.definition];
    const propIndex = updatedDefinitions.findIndex(x => x.propertyID === propertyID);
    
    if (propertyValue === '') {
      // Rimuovi la proprietà se il valore è vuoto
      if (propIndex >= 0) {
        updatedDefinitions.splice(propIndex, 1);
      }
    } else {
      // Aggiorna o aggiungi la proprietà
      if (propIndex >= 0) {
        updatedDefinitions[propIndex].propertyValue = propertyValue;
      } else {
        updatedDefinitions.push({ propertyID, propertyValue });
      }
    }
    
    this.senseEntry = <SenseCore>{
      ...this.senseEntry,
      definition: updatedDefinitions
    };
  }
}
