import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { LoaderService } from 'src/app/services/loader.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceChoice } from 'src/app/models/workspace-choice.model';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import Swal from 'sweetalert2';
import { NgForm } from '@angular/forms';

/**Componente della lista dei workspace */
@Component({
  selector: 'app-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss'],
})
export class WorkspaceListComponent implements OnInit {
  /**
   * @private
   * Effettua la cancellazione di un workspace
   * @param id {number} identificativo numerico del workspace
   * @param name {string} nome del workspace
   */
  private delete = (id: number, name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    const errorMsg = 'Errore nell\'eliminare il workspace \'' + name + '\'';
    const successMsg = 'Workspace \'' + name + '\' eliminato con successo';

    this.workspaceService.deleteWorkspace(id).subscribe({
      next: (data) => {
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
        Swal.close();
        this.loadData();
      },
      error: () => {
        this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
      }
    })
  }

  /**Getter del titolo del workspace per il modale */
  public get workspaceModalTitle(): string {
    if (((!this.workspaceForm) || (!this.workspaceForm.value)) || (!this.workspaceForm.value.name)) { //caso di inserimento di un nuovo workspace
      return "Nuovo workspace";
    }

    return this.workspaceForm.value.name;
  }

  /**Getter che definisce se siamo in modalità di modifica */
  public get isEditing(): boolean {
    if (this.workspace && this.workspace.id) {
      return true;
    }

    return false;
  }

  /**Lista dei workspace per la selezione */
  workspaces: WorkspaceChoice[] = [];

  /**Workspace di tipo choice in lavorazione */
  workspace: WorkspaceChoice = new WorkspaceChoice;

  /**Definisce se è aperto il dialog del workspace */
  workspaceDialog = false;
  /** ? */ //TODO verificare perché non sembra utilizzato
  submitted = false;

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;
  /**Riferimento al form di modifica/creazione workspace */
  @ViewChild(NgForm) public workspaceForm!: NgForm;

  /**
   * Costruttore per WorkspaceListComponent
   * @param router {Router} servizi per la navigazione fra le viste
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param workspaceService {WorkspaceService} servizi relativi ai workspace
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param msgConfService {MessageConfigurationService} servizi per la configurazione dei messaggi per messageService
   * @param confirmationService {ConfirmationService} servizi per i messaggi di conferma
   */
  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private workspaceService: WorkspaceService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private confirmationService: ConfirmationService) { } //TODO verificare se serve ancora

  /**Metodo dell'interfaccia OnInit, utilizzato per il caricamento iniziale dei dati */
  ngOnInit(): void {
    this.loadData();
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per chiudere eventuali popup swal */
  ngOnDestroy(): void {
    Swal.close();
  }

  /**Metodo che naviga verso un nuovo workspace */
  goToNewWorkspace() {
    this.router.navigate(["/workspace", "new"], { relativeTo: this.activeRoute });
  }

  /**
   * Metodo che naviga verso un workspace esistente
   * @param workspaceId {string} identificativo del workspace
   */
  goToWorkspace(workspaceId: string) {
    this.router.navigate(["/workspace", workspaceId], { relativeTo: this.activeRoute });
  }

  /**
   * Metodo che sottomette il salvataggio di un nuovo workspace
   * @param form {NgForm} form di modifica/creazione di un workspace
   * @returns {void}
   */
  onSubmitWorkspaceModal(form: NgForm): void {
    if (this.workspaceForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }

  /**
   * Metodo che apre un workspace
   * @param event {any} evento di selezione di una riga della tabella
   */
  openWorkspace(event: any) {
    if (event.data.id) {
      this.goToWorkspace(event.data.id)
    }
  }

  /**
   * Metodo che visualizza il popup di conferma cancellazione di un workspace ed eventualmente richiama la sua rimozione
   * @param workspace {WorkspaceChoice} workspace da cancellare
   */
  showDeleteWorkspaceModal(workspace: WorkspaceChoice) {
    const confirmMsg = 'Stai per cancellare il workspace \'' + workspace.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(workspace.id!, (workspace.name || "")), workspace.id, workspace.name);
  }

  /**
   * Metodo che richiama l'apertura del modale di modifica dei dati di un workspace
   * @param workspace {WorkspaceChoice} workspace da modificare
   */
  showEditWorkspaceModal(workspace: WorkspaceChoice) {
    this.resetForm();
    this.workspace = JSON.parse(JSON.stringify(workspace));

    $('#workspaceModal').modal('show');
  }

  /**Metodo che richiama l'apertua del modale di inserimento di un nuovo workspace */
  showWorkspaceModal() {
    this.resetForm();

    $('#workspaceModal').modal('show');
  }

  /**
   * @private
   * Metodo che carica i dati di base del componente
   */
  private loadData() {
    this.loaderService.show();
    this.workspaceService.retrieveWorkspaceChoiceList()
      .subscribe({
        next: (data: WorkspaceChoice[]) => {
          this.workspaces = data;
          this.loaderService.hide();
        }
      });
  }

  /**
   * @private
   * Metodo che resetta il workspace in lavorazione e marca i campi come nuovi
   */
  private resetForm() {
    this.workspace = new WorkspaceChoice();
    this.workspaceForm.form.markAsUntouched();
    this.workspaceForm.form.markAsPristine();
  }

  /**
   * @private
   * Metodo che gestisce il salvataggio del form di un workspace nuovo o in modifica
   * @returns {void}
   */
  private save(): void {
    if (!this.workspace) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }

    let successMsg = "Operazione effettuata con successo";
    let apiCall;

    if (this.isEditing && this.workspace.name?.trim() && this.workspace.id) {
      successMsg = "Workspace modificato con successo";
      apiCall = this.workspaceService.updateWorkspace(this.workspace);
    }
    else {
      successMsg = "Workspace creato con successo";
      apiCall = this.workspaceService.createWorkspace(this.workspace);
    }

    this.loaderService.show();
    apiCall.subscribe({
      next: () => {
        $('#workspaceModal').modal('hide');

        this.saveWorkspaceCompleted();
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
        this.loadData();
      },
      error: (err: string) => {
        $('#workspaceModal').modal('hide');

        this.saveWorkspaceCompleted();
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
      }
    });
  }

  /**
   * @private
   * Metodo che segna tutti i campi del form touched per segnalare errori
   */
  private saveWithFormErrors(): void {
    this.workspaceForm.form.markAllAsTouched();
  }

  /**
   * @private
   * Metodo che su completamento del salvatggio aggiorna la lista dei workspace, chiude il dialog e carica i dati iniziali
   */
  private saveWorkspaceCompleted() {
    this.workspaces = [...this.workspaces];
    this.workspaceDialog = false;

    this.loaderService.hide();
    this.loadData();
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
