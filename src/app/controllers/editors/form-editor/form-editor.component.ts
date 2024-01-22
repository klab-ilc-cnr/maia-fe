import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subscription, forkJoin, take } from 'rxjs';
import { DropdownField } from 'src/app/models/dropdown-field';
import { FormCore, LexicalEntryTypeOld, LinkElement, LinkProperty, MorphologyProperty, PropertyElement } from 'src/app/models/lexicon/lexical-entry.model';
import { FORM_RELATIONS, FormUpdater, LINGUISTIC_RELATION_TYPE, LinguisticRelationUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { Morphology } from 'src/app/models/lexicon/morphology.model';
import { OntolexType } from 'src/app/models/lexicon/ontolex-type.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';

/**OLD Componente dell'editor per le forme */
@Component({
  selector: 'app-form-editor',
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.scss']
})
export class FormEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  /**Sottoscrizione per la gestione del notify */
  private subscription!: Subscription;

  /**Identificativo dell'entrata lessicale */
  @Input() lexicalEntryID!: string | undefined;

  /**Text input della rappresentazione scritta */
  writtenRepresentationInput?: string;
  /**Lista delle option per i tipi di forma */
  @Input() typesDropdownList!: DropdownField[];
  /**Tipo selezionato */
  selectedType?: DropdownField;
  /**Text input delle note */
  noteInput?: string;
  /**Lista delle attestazioni */
  attestationsList: { name: string, code: string }[] = [];
  /**Definisce se è in corso il caricamento */
  loading?: boolean;

  /**Lista delle option dei tratti */
  @Input() traitsDropdown!: DropdownField[];

  /**Lista delle informazioni morfologiche */
  @Input() morphologicalData!: Morphology[];

  /**Lista degli elementi dei singoli form morfologici */
  morphologicalForms: {
    /**Option del tratto selezionato */
    selectedTrait: DropdownField | undefined,
    /**Lista delle option dei valori delle proprietà */
    propertiesList: DropdownField[] | undefined,
    /**Option del valore di proprietà selezionato */
    selectedProperty: DropdownField | undefined
  }[] = [];

  /**Identificativo della forma */
  @Input() instanceName!: string;

  /**Ultimo aggiornamento */
  lastUpdate = '';

  /**Definisce se ci sono modifiche pendenti */
  pendingChanges = false;

  /**Valori iniziali del form */
  private initialValues!: { type: string, writtenRep: string, note: string, morphs: { trait: string, value: string }[] };
  /**Riferimento al popup di conferma cancellazione di un'annotazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Proprietà di cancellazione di un elemento
   * @param formID {string} identificativo della forma
   */
  private deleteElement = (formID: string): void => {
    this.showOperationInProgress("Sto cancellando");

    const errorMsg = "Errore nell'eliminare la forma";
    const successMsg = "Forma eliminata con successo";

    this.lexiconService.deleteForm(formID).pipe(take(1)).subscribe({
      next: () => {
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
        this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.lexicalEntryID, isRemove: true });
        Swal.close();
      },
      error: () => {
        this.showOperationFailed('Cancellazione Fallita: ' + errorMsg);
      }
    })
  }

  /**
   * Costruttore per FormEditorComponent
   * @param lexiconService {LexiconService} servizi relativi al lessico
   * @param commonService {CommonService} servizi di uso comune
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato
   * @param messageService {MessageService} servizi dei messaggi primeng
   * @param msgConfService {MessageConfigurationService} servizi di configurazione dei messaggi
   */
  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
    private loggedUserService: LoggedUserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per il caricamento iniziale dei dati */
  ngOnInit(): void {
    this.loadData();
  }

  /**Metodo dell'interfaccia AfterViewInit, utilizzato per sottoscrivere i notify */
  ngAfterViewInit(): void {
    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if ('option' in res && res.option === 'form_selected' && res.value !== this.instanceName && this.lexicalEntryID === res.lexEntryId) {
        this.instanceName = res.value;
        this.loadData();
      }
      if ('option' in res && res.option === 'form_editor_save' && this.instanceName === res.value) {
        this.handleSave();
      }
    });
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per rimuovere la sottoscrizione */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**Metodo che gestisce il salvataggio delle modifiche alla forma */
  handleSave() {
    const successMsg = "Forma aggiornata con successo";
    const currentUser = this.loggedUserService.currentUser;
    const currentUserName = currentUser?.name + '.' + currentUser?.surname;

    // eslint-disable-next-line prefer-const
    let httpList = [];

    if (this.selectedType?.code !== this.initialValues.type) {
      httpList.push(this.lexiconService.updateLexicalForm(currentUserName, this.instanceName, <FormUpdater>{ relation: FORM_RELATIONS.TYPE, value: this.selectedType?.code }));
      this.initialValues.type = this.selectedType!.code;
    }
    if (this.writtenRepresentationInput !== this.initialValues.writtenRep) {
      httpList.push(this.lexiconService.updateLexicalForm(currentUserName, this.instanceName, <FormUpdater>{ relation: FORM_RELATIONS.WRITTEN_REP, value: this.writtenRepresentationInput }));
      this.initialValues.writtenRep = this.writtenRepresentationInput!;
    }
    if (this.noteInput !== this.initialValues.note) {
      httpList.push(this.lexiconService.updateLexicalForm(currentUserName, this.instanceName, <FormUpdater>{ relation: FORM_RELATIONS.NOTE, value: this.noteInput }));
      this.initialValues.note = this.noteInput!;
    }
    if (this.morphologicalForms.length !== 1 || this.morphologicalForms[0].selectedProperty?.code !== "") {
      this.morphologicalForms.forEach(mf => {
        const currentValueIndex = this.initialValues.morphs.findIndex(e => mf.selectedTrait !== undefined && e.trait === mf.selectedTrait.code);
        const currentValue = this.initialValues.morphs.find(e => mf.selectedTrait !== undefined && e.trait === mf.selectedTrait.code)?.value;
        const newValue = mf.selectedProperty?.code;
        if (currentValue !== newValue) {
          httpList.push(this.lexiconService.updateLinguisticRelation(this.instanceName, <LinguisticRelationUpdater>{
            type: LINGUISTIC_RELATION_TYPE.MORPHOLOGY,
            relation: mf.selectedTrait?.code,
            value: newValue,
            currentValue: currentValue
          }));
        }
        if (currentValueIndex !== -1 && newValue) {
          this.initialValues.morphs[currentValueIndex].value = newValue;
        } else if (mf.selectedTrait && newValue) {
          this.initialValues.morphs.push({ trait: mf.selectedTrait.code, value: newValue });
        }
      });
    }

    if (httpList.length > 0) {
      forkJoin(httpList).pipe(take(1)).subscribe({
        next: (res: string[]) => {
          this.pendingChanges = false;
          this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryTypeOld.FORM })
          this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.lexicalEntryID });
          this.lastUpdate = new Date(res[0]).toLocaleString();
          this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
        },
        error: (error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
        }
      });
    }
  }

  /**Metodo che gestisce il caricamento dei dati */
  loadData() {
    this.loading = true;
    // this.loadFormTypes();
    this.loadForm();
  }

  /**Metodo che gestisce l'aggiunta di un nuovo elemento morfologico */
  onAddMorphForm() {
    this.morphologicalForms = [
      ...this.morphologicalForms,
      {
        selectedTrait: { name: '--none', code: '' },
        propertiesList: [],
        selectedProperty: { name: '--none', code: '' }
      }
    ]
  }

  /**
   * Metodo che gestisce la modifica della selezione del tratto di un elemento morfologico
   * @param traitDropdownField {DropdownField} option del tratto selezionato
   * @param mfIndex {number} indice dell'elemento morfologico modificato
   */
  onChangeTraitSelection(traitDropdownField: DropdownField, mfIndex: number) {
    this.morphologicalForms[mfIndex] = {
      selectedTrait: traitDropdownField,
      propertiesList: this.loadProperties(traitDropdownField.code),
      selectedProperty: { name: '--none--', code: '' }
    };
  }

  /**
   * Metodo che visualizza il modale di cancellazione ed eventualmente richiama la cancellazione stessa
   * @returns {void}
   */
  showDeleteModal(): void {
    const confirmMsg = 'Stai per cancellare una forma';

    this.popupDeleteItem.confirmMessage = confirmMsg;

    this.popupDeleteItem.showDeleteConfirm(() => this.deleteElement(this.instanceName), this.instanceName);
  }

  /**
   * Metodo che gestisce la presenza di modifiche pendenti
   * @returns {void}
   */
  onPendingChanges() {
    if (this.pendingChanges) {
      return;
    }

    this.pendingChanges = true;
    this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryTypeOld.FORM });
  }


  /**
   * Metodo che gestisce la rimozione di un elemento morfologico
   * @param morph {{ selectedTrait: DropdownField, propertiesList: DropdownField[], selectedProperty: DropdownField }}
   */
  onRemoveMorphForm(morph: { selectedTrait: DropdownField | undefined, propertiesList: DropdownField[] | undefined, selectedProperty: DropdownField | undefined }) {
    const successMsg = "Forma aggiornata con successo";
    this.morphologicalForms = this.morphologicalForms.filter(mf => mf !== morph);
    const initialValuesIndex = this.initialValues.morphs.findIndex(mf => mf.trait === morph.selectedTrait?.code);
    if (initialValuesIndex !== -1 && morph.selectedTrait && morph.selectedProperty) {
      this.lexiconService.deleteRelation(this.instanceName, { relation: morph.selectedTrait.code, value: morph.selectedProperty.code }).pipe(take(1)).subscribe({
        next: res => {
          this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
          this.initialValues.morphs = this.initialValues.morphs.filter(m => m.trait !== morph.selectedTrait?.code);
          this.lastUpdate = new Date(res).toLocaleString();
        },
        error: (error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message))
        }
      });
    }
  }

  /**
   * @private
   * Metodo per il caricamento dei dati della forma
   */
  private loadForm() {
    this.lexiconService.getForm(this.instanceName).subscribe({
      next: (data: FormCore) => {
        this.writtenRepresentationInput = data.label.find((el: PropertyElement) => el.propertyID === 'writtenRep')?.propertyValue;

        this.selectedType = this.typesDropdownList.find(el => el.code.split('#')[1] === data.type);

        this.noteInput = data.note;
        const attestations = data.links.find((el: LinkProperty) => el.type === 'Attestation')?.elements;
        this.attestationsList = attestations !== undefined ? attestations.map((le: LinkElement) => ({
          name: le.label,
          code: le.label
        })) : [];

        this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : '';

        this.morphologicalForms = data.morphology.map((el: MorphologyProperty) => {
          const propList = this.loadProperties(el.trait);
          return {
            selectedTrait: this.traitsDropdown.find((val: DropdownField) => val.code === el.trait),
            propertiesList: propList,
            selectedProperty: propList.find((p: DropdownField) => p.code === el.value)
          };
        });

        // this.morphologicalForms = data.morphology.map((el: any) => {
        //   const propList = this.loadProperties(el.trait);
        //   return {
        //     selectedTrait: this.traitsDropdown.find((val: any) => val.code === el.trait),
        //     propertiesList: propList,
        //     selectedProperty: propList.find((p: any) => p.code === el.value)
        //   };
        // });
        if (this.morphologicalForms.length === 0) {
          this.onAddMorphForm();
        }

        this.initialValues = {
          type: this.selectedType!.code,
          writtenRep: this.writtenRepresentationInput!,
          note: this.noteInput!,
          morphs: data.morphology
        };

        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(error.error))
      }
    })
  }

  /**
   * @private
   * Metodo che esegue il recupero della lista di proprietà/valori associate a un tratto
   * @param traitId {string} identificativo del tratto
   * @returns {DropdownField[]} lista delle option delle proprietà
   */
  private loadProperties(traitId: string) {
    if (traitId === '') {
      return [];
    }

    const morph = this.morphologicalData.find((el: Morphology) => el.propertyId === traitId)?.propertyValues;

    const values = morph ? morph.map((val: OntolexType) => (<DropdownField>{
      name: val.valueLabel,
      code: val.valueId
    })) : []

    return [<DropdownField>{
      name: '--none--',
      code: ''
    }, ...values];
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
      text: 'per favore attendere',
      customClass: {
        container: 'swal2-container'
      },
      showCancelButton: false,
      showConfirmButton: false
    });
  }

}
