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

@Component({
  selector: 'app-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss'],
})
export class WorkspaceListComponent implements OnInit {
  private delete = (id: number, name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare il workspace \'' + name + '\'';
    let successMsg = 'Workspace \'' + name + '\' eliminato con successo';

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

  public get workspaceModalTitle(): string {
    if (((!this.workspaceForm) || (!this.workspaceForm.value)) || (!this.workspaceForm.value.name)) {
      return "Nuovo workspace";
    }

    return this.workspaceForm.value.name;
  }

  public get isEditing(): boolean {
    if (this.workspace && this.workspace.id) {
      return true;
    }

    return false;
  }

  workspaces: WorkspaceChoice[] = [];

  workspace: WorkspaceChoice = new WorkspaceChoice;

  workspaceDialog: boolean = false;
  submitted: boolean = false;

  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;
  @ViewChild(NgForm) public workspaceForm!: NgForm;

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private workspaceService: WorkspaceService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    Swal.close();
  }

  goToNewWorkspace() {
    this.router.navigate(["/workspace", "new"], { relativeTo: this.activeRoute });
  }

  goToWorkspace(workspaceId: string) {
    this.router.navigate(["/workspace", workspaceId], { relativeTo: this.activeRoute });
  }

  onSubmitWorkspaceModal(form: NgForm): void {
    if (this.workspaceForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }

  openWorkspace(event: any) {
    if (event.data.id) {
      this.goToWorkspace(event.data.id)
    }
  }

  showDeleteWorkspaceModal(workspace: WorkspaceChoice) {
    let confirmMsg = 'Stai per cancellare il workspace \'' + workspace.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(workspace.id!, (workspace.name || "")), workspace.id, workspace.name);
  }

  showEditWorkspaceModal(workspace: WorkspaceChoice) {
    this.resetForm();
    this.workspace = JSON.parse(JSON.stringify(workspace));

    $('#workspaceModal').modal('show');
  }

  showWorkspaceModal() {
    this.resetForm();

    $('#workspaceModal').modal('show');
  }

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

  private resetForm() {
    this.workspace = new WorkspaceChoice();
    this.workspaceForm.form.markAsUntouched();
    this.workspaceForm.form.markAsPristine();
  }

  private save(): void {
    if (!this.workspace) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }

    let msgSuccess = "Operazione effettuata con successo";
    let apiCall;

    if (this.isEditing && this.workspace.name?.trim() && this.workspace.id) {
      msgSuccess = "Workspace modificato con successo";
      apiCall = this.workspaceService.updateWorkspace(this.workspace);
    }
    else {
      msgSuccess = "Workspace creato con successo";
      apiCall = this.workspaceService.createWorkspace(this.workspace);
    }

    this.loaderService.show();
    apiCall.subscribe({
      next: () => {
        $('#workspaceModal').modal('hide');

        this.saveWorkspaceCompleted();
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(msgSuccess));
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

  private saveWithFormErrors(): void {
    this.workspaceForm.form.markAllAsTouched();
  }

  private saveWorkspaceCompleted() {
    this.workspaces = [...this.workspaces];
    this.workspaceDialog = false;

    this.loaderService.hide();
    this.loadData();
  }

  private showOperationFailed(errorMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: errorMessage,
      showConfirmButton: true
    });
  }

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
