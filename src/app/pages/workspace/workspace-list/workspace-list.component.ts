import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { LoaderService } from 'src/app/services/loader.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceChoice } from 'src/app/model/workspace-choice.model';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import Swal from 'sweetalert2';

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

  workspaces: WorkspaceChoice[] = [];

  workspace: WorkspaceChoice = new WorkspaceChoice;

  workspaceDialog: boolean = false;
  submitted: boolean = false;

  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

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

  openNew() {
    this.workspace = new WorkspaceChoice();
    this.submitted = false;
    this.workspaceDialog = true;
  }

  openWorkspace(event: any) {
    if (event.data.id) {
      this.goToWorkspace(event.data.id)
    }
  }

  public goToNewWorkspace() {
    this.router.navigate(["/workspace", "new"], { relativeTo: this.activeRoute });
  }

  editWorkspace(workspace: WorkspaceChoice) {
    this.workspace = { ...workspace };
    this.workspaceDialog = true;
  }

  public goToWorkspace(workspaceId: string) {
    this.router.navigate(["/workspace", workspaceId], { relativeTo: this.activeRoute });
  }

  hideDialog() {
    this.workspaceDialog = false;
    this.submitted = false;
  }

  saveWorkspace() {
    this.submitted = true;

    this.loaderService.show();
    //EDIT
    if (this.workspace.name?.trim()) {
      if (this.workspace.id) {
        this.workspaceService.updateWorkspace(this.workspace).subscribe({
          next: (wsChoice) => {
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Workspace aggiornato'));
            this.saveWorkspaceCompleted();
          }
        })
      }
      //CREATE
      else {
        //this.workspace.id = this.createId();
        this.workspaceService.createWorkspace(this.workspace).subscribe({
          next: (wsChoice) => {
            // this.workspace = wsChoice;
            // this.workspaces.push(this.workspace);
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Workspace creato'));
            this.saveWorkspaceCompleted();
          }
        })
      }

      //this.workspace = new WorkspaceChoice();
    }
  }

  findIndexById(id: number): number {
    return this.workspaces.findIndex(ws => ws.id === this.workspace.id)
  }

  deleteSelectedWorkspace(workspace: WorkspaceChoice) {
    let confirmMsg = 'Stai per cancellare il workspace \'' + workspace.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(workspace.id!, (workspace.name || "")), workspace.id, workspace.name);
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
