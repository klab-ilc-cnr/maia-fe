import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subscription, forkJoin, take } from 'rxjs';
import { LexicalEntryTypeOld, LinkElement, LinkProperty, PropertyElement, SenseCore } from 'src/app/models/lexicon/lexical-entry.model';
import { LEXICAL_SENSE_RELATIONS, LexicalSenseUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';

/** OLD Componente dell'editor per i sensi */
@Component({
  selector: 'app-sense-editor',
  templateUrl: './sense-editor.component.html',
  styleUrls: ['./sense-editor.component.scss']
})
export class SenseEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  /**Sottoscrizione per la gestione del notify */
  private subscription!: Subscription;

  /**Text input delle note */
  noteInput?: string;
  /**Text input della definizione */
  definitionInput?: string;
  /**Text input del riferimento */
  referenceInput?: string;
  /**Lista delle attestazioni */
  attestationsList: any[] = [];
  /**Definisce se è in corso il caricamento */
  loading?: boolean;

  /**Identificativo del senso */
  @Input() instanceName!: string;
  /**Identificativo dell'entrata lessicale di appartenenza */
  @Input() lexicalEntryID!: string | undefined;

  /**Data di ultimo aggiornamento */
  lastUpdate?: string = '';

  /**Definisce se ci sono modifiche pendenti */
  pendingChanges = false;

  /**Valori iniziali del form */
  private initialValues!: { definition: string, reference: string, note: string };
  /**Riferimento al popup di conferma cancellazione di un'annotazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * @private
   * Proprietà di cancellazione di un elemento
   * @param senseID {string} identificativo del senso
   */
  private deleteElement = (senseID: string): void => {
    this.showOperationInProgress("Sto cancellando");

    const errorMsg = "Errore nell'eliminare il senso";
    const successMsg = "Senso eliminato con successo";

    this.lexiconService.deleteLexicalSense(senseID).pipe(take(1)).subscribe({
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
   * Costruttore per SenseEditorComponent
   * @param commonService {CommonService} servizi di uso comune
   * @param lexiconService {LexiconService} servizi relativi al lessico
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato
   * @param messageService {MessageService} servizi dei messaggi primeng
   * @param msgConfService {MessageConfigurationSevice} servizi di configurazione dei messaggi
   */
  constructor(
    private commonService: CommonService,
    private lexiconService: LexiconService,
    private loggedUserService: LoggedUserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per il caricamento preliminare dei dati */
  ngOnInit(): void {
    this.loadData();
  }

  /**Metodo dell'interfaccia AfterViewInit, utilizzato per sottoscrivere il notify */
  ngAfterViewInit(): void {
    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if ('option' in res && res.option === 'sense_selected' && res.value !== this.instanceName && this.lexicalEntryID === res.lexEntryId) {
        this.instanceName = res.value;
        this.loadData();
      }
      if ('option' in res && res.option === 'sense_editor_save' && this.instanceName === res.value) {
        this.handleSave();
      }
    });
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per la cancellazione della sottoscrizione */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**Metodo per la gestione del salvataggio delle modifiche al senso */
  handleSave() {
    const successMsg = "Senso aggiornato con successo";

    const currentUser = this.loggedUserService.currentUser;
    const currentUserName = currentUser?.name + '.' + currentUser?.surname;

    // eslint-disable-next-line prefer-const
    let httpList = [];

    if (this.definitionInput !== this.initialValues.definition) {
      httpList.push(this.lexiconService.updateLexicalSense(currentUserName, this.instanceName, <LexicalSenseUpdater>{ relation: LEXICAL_SENSE_RELATIONS.DEFINITION, value: this.definitionInput }))
      this.initialValues.definition = this.definitionInput!;
    }
    if (this.referenceInput !== this.initialValues.reference) {
      httpList.push(this.lexiconService.updateLexicalSense(currentUserName, this.instanceName, <LexicalSenseUpdater>{ relation: LEXICAL_SENSE_RELATIONS.REFERENCE, value: this.referenceInput }))
      this.initialValues.reference = this.referenceInput!;
    }
    if (this.noteInput !== this.initialValues.note) {
      httpList.push(this.lexiconService.updateLexicalSense(currentUserName, this.instanceName, <LexicalSenseUpdater>{ relation: LEXICAL_SENSE_RELATIONS.NOTE, value: this.noteInput }))
      this.initialValues.note = this.noteInput!;
    }

    if (httpList.length > 0) {
      forkJoin(httpList).pipe(take(1)).subscribe({
        next: (res: string[]) => {
          this.pendingChanges = false;
          this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryTypeOld.SENSE })
          this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.lexicalEntryID });
          this.lastUpdate = new Date(res[0]).toLocaleString();
          this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
        },
        error: (error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message))
        }
      });
    }
  }

  /**Metodo per la gestione del caricamento dei dati */
  loadData() {
    this.loading = true;

    this.loadSense();
  }

  /**
   * Metodo per la gestione delle modifiche pendenti
   * @returns {void}
   */
  onPendingChanges() {
    if (this.pendingChanges) {
      return;
    }

    this.pendingChanges = true;
    this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryTypeOld.SENSE });
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
   * @private
   * Metodo per il caricamento dei dati del senso
   */
  private loadSense() {
    this.lexiconService.getSense(this.instanceName).subscribe({
      next: (data: SenseCore) => {
        this.definitionInput = data.definition.find((el: PropertyElement) => el.propertyID === 'definition')?.propertyValue;
        this.noteInput = data.note;

        const attestations = data.links.find((el: LinkProperty) => el.type === 'Attestation')?.elements;

        this.attestationsList = !attestations ? [] : attestations.map((att: LinkElement) => ({
          name: att['label'],
          code: att['label']
        }));

        this.initialValues = {
          definition: this.definitionInput!,
          reference: this.referenceInput!,
          note: data.note
        };

        this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : '';

        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(error.error))
      }
    })
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
