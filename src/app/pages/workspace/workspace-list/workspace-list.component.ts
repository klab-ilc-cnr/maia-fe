import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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

/**Class describing the workspace list component */
@Component({
  selector: 'app-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss'],
})
export class WorkspaceListComponent {
  /**Subject for subscribe management */
  private readonly unsubscribe$ = new Subject();
  /**Defines whether the workspace creation/editing modal is visible */
  visibleWorkspaceDialog = false;
  /**
   * Perform a workspace deletion
   * @param id {number} workspace identifier
   * @param name {string} workspace name
   */
  private delete = (id: number, name: string): void => {
    this.workspaceState.removeWorkspace.next(id);
  }

  /**
   * Getter for workspace modal title
   * @returns {string}
   */
  public get workspaceModalTitle(): string {
    if (((!this.tWorkspaceForm) || (!this.tWorkspaceForm.value)) || (!this.name.value)) { //caso di inserimento di un nuovo workspace
      return "New workspace";
    }
    return this.name.value;
  }

  /**
   * Getter, defines wheter the workspace is in edit mode
   * @returns {boolean}
   */
  public get isEditing(): boolean {
    if (this.workspace && this.workspace.id) {
      return true;
    }
    return false;
  }

  /**Observable of the list of workspaces */
  workspaces$ = this.workspaceState.workspaces$;
  /**List of workspace names already used */
  workspaceNames: string[] = [];
  /**Form to manage workspace data */
  tWorkspaceForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    note: new FormControl<string | null>(null)
  });
  /**Getter for workspace name field control */
  get name() { return this.tWorkspaceForm.controls.name }
  /**Getter for workspace note field control */
  get note() { return this.tWorkspaceForm.controls.note }

  /**Workspace di tipo choice in lavorazione */
  workspace: WorkspaceChoice = new WorkspaceChoice;

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costructor for WorkspaceListComponent
   * @param router {Router} A service that provides navigation among views and URL manipulation capabilities
   * @param activeRoute {ActivatedRoute} Provides access to information about a route associated with a component that is loaded in an outlet
   * @param messageService {MessageService} services for message management
   * @param msgConfService {MessageConfigurationService} services for configuration of messages
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

  /**OnDestroy interface method, used for closing any swal popups and managing unsubscribe */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
    Swal.close();
  }

  /**Method navigating to a new workspace */
  goToNewWorkspace() {
    this.router.navigate(["/workspace", "new"], { relativeTo: this.activeRoute });
  }

  /**
   * Method that navigates to an existing workspace
   * @param workspaceId {string} workspace identifier (covering also new as id)
   */
  goToWorkspace(workspaceId: string) {
    this.router.navigate(["/workspace", workspaceId], { relativeTo: this.activeRoute });
  }

  /**
   * Method that submits saving a new workspace
   * @returns {void}
   */
  onSubmitWorkspaceModal(): void {
    if (this.tWorkspaceForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }

  /**
   * Method that opens a workspace
   * @param event {any} table row selection event
   */
  openWorkspace(event: any) {
    if (event.data.id) {
      this.goToWorkspace(event.data.id)
    }
  }

  /**
   * Method that displays the popup confirming deletion of a workspace and possibly prompting its removal
   * @param workspace {WorkspaceChoice} workspace to be deleted
   */
  showDeleteWorkspaceModal(workspace: WorkspaceChoice) {
    const confirmMsg = 'Stai per cancellare il workspace \'' + workspace.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(workspace.id!, (workspace.name || "")), workspace.id, workspace.name);
  }

  /**
   * Method that invokes the opening of a workspace data editing modal
   * @param workspace {WorkspaceChoice} workspace to be updated
   */
  showEditWorkspaceModal(workspace: WorkspaceChoice) {
    this.tWorkspaceForm.reset();
    this.name.setValue(workspace.name || '');
    this.note.setValue(workspace.note || null);
    const tempNames = this.workspaceNames.filter(w => w !== workspace.name);
    this.name.setValidators(nameDuplicateValidator(tempNames));
    this.visibleWorkspaceDialog = true;
    this.workspace = JSON.parse(JSON.stringify(workspace));
  }

  /**Method that invokes the modal opening of inserting a new workspace */
  showWorkspaceModal() {
    this.tWorkspaceForm.reset();
    this.name.setValidators(nameDuplicateValidator(this.workspaceNames));
    this.visibleWorkspaceDialog = true;
  }

  /**
   * Method that handles saving the form of a new or editing workspace
   * @returns {void}
   */
  private save(): void {
    if (!this.workspace) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }
    this.workspace = <WorkspaceChoice>{
      ...this.workspace,
      name: this.name.value,
      note: this.note.value
    };
    if (this.isEditing && this.workspace.name?.trim() && this.workspace.id) {
      this.workspaceState.updateWorkspace.next(this.workspace);
    }
    else {
      this.workspaceState.addWorkspace.next(this.workspace);
    }
    this.visibleWorkspaceDialog = false;
  }

  /**
   * Method that marks all fields in the form touched to report errors
   */
  private saveWithFormErrors(): void {
    this.tWorkspaceForm.markAllAsTouched();
  }
}
