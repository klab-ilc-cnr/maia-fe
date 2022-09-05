import { LoaderService } from 'src/app/services/loader.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceChoice } from 'src/app/model/workspace-choice.model';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss'],
})
export class WorkspaceListComponent implements OnInit {

  workspaces: WorkspaceChoice[] = [];

  workspace: WorkspaceChoice = new WorkspaceChoice;

  workspaceDialog: boolean = false;
  submitted: boolean = false;

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private workspaceService: WorkspaceService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.loaderService.show();
    this.workspaceService.retrieveWorkspaceChoiceList()
      .subscribe({
        next: (data: WorkspaceChoice[]) => {
          this.workspaces = data;
        },
        complete: () => {
          this.loaderService.hide();
        }
      });
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
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare il workspace',
      header: 'Conferma',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.workspaceService.deleteWorkspace(workspace.id).subscribe({
          next: (data) => {
            let indexOfDeleted = this.workspaces.findIndex(ws => ws.id === data);
            this.workspaces.splice(indexOfDeleted, 1);
            this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Workspace eliminato', life: 3000 });
          }
        })
      }
    });
  }

  private saveWorkspaceCompleted() {
    this.workspaces = [...this.workspaces];
    this.workspaceDialog = false;

    this.loaderService.hide();
  }
}
