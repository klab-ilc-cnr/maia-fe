import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { WorkspaceChoice } from 'src/app/models/workspace-choice.model';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { WorkspaceStateService } from 'src/app/services/workspace-state.service';
import { nameDuplicateValidator } from 'src/app/validators/not-duplicate-name.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';
import Swal from 'sweetalert2';

/**Componente della lista dei workspace */
@Component({
  selector: 'app-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss'],
})
export class WorkspaceListComponent {
  /**Subject for subscribe management */
  private readonly unsubscribe$ = new Subject();
  visibleWorkspaceDialog = false;
  /**
   * @private
   * Effettua la cancellazione di un workspace
   * @param id {number} identificativo numerico del workspace
   * @param name {string} nome del workspace
   */
  private delete = (id: number, name: string): void => {
    this.workspaceState.removeWorkspace.next(id);
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

  workspaces$ = this.workspaceState.workspaces$;
  workspaceNames: string[] = [];
  tWorkspaceForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    note: new FormControl<string | null>(null)
  });
  get name() { return this.tWorkspaceForm.controls.name }
  get note() { return this.tWorkspaceForm.controls.note }

  /**Workspace di tipo choice in lavorazione */
  workspace: WorkspaceChoice = new WorkspaceChoice;

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;
  /**Riferimento al form di modifica/creazione workspace */
  @ViewChild(NgForm) public workspaceForm!: NgForm;

  /**
   * Costruttore per WorkspaceListComponent
   * @param router {Router} servizi per la navigazione fra le viste
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param msgConfService {MessageConfigurationService} servizi per la configurazione dei messaggi per messageService
   */
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private workspaceState: WorkspaceStateService,
  ) {
    this.workspaces$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(w => {
      this.workspaceNames = w.map(ws => ws.name!);
    })
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per chiudere eventuali popup swal */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
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
    this.tWorkspaceForm.reset();
    this.name.setValue(workspace.name || '');
    this.note.setValue(workspace.note || null);
    const tempNames = this.workspaceNames.filter(w => w !== workspace.name);
    this.name.setValidators(nameDuplicateValidator(tempNames));
    this.resetForm();
    this.visibleWorkspaceDialog = true;
    this.workspace = JSON.parse(JSON.stringify(workspace));
  }

  /**Metodo che richiama l'apertua del modale di inserimento di un nuovo workspace */
  showWorkspaceModal() {
    this.tWorkspaceForm.reset();
    this.name.setValidators(nameDuplicateValidator(this.workspaceNames));
    this.resetForm();
    this.visibleWorkspaceDialog = true;
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
    if (this.isEditing && this.workspace.name?.trim() && this.workspace.id) {
      this.workspaceState.updateWorkspace.next(this.workspace);
    }
    else {
      this.workspaceState.addWorkspace.next(this.workspace);
    }
    this.visibleWorkspaceDialog = false;
  }

  /**
   * @private
   * Metodo che segna tutti i campi del form touched per segnalare errori
   */
  private saveWithFormErrors(): void {
    this.workspaceForm.form.markAllAsTouched();
  }
}
