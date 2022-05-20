import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Workspace } from '../model/workspace.model';
import { WorkspaceService } from '../services/workspace.service';

@Component({
  selector: 'app-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss']
})
export class WorkspaceListComponent implements OnInit {

  workspaces: Workspace[] = [];

  workspace: Workspace = new Workspace;

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private workspaceService: WorkspaceService) { }

  ngOnInit(): void {
    this.workspaceService.retrieveAll()
      .subscribe((data: Workspace[]) => {
        this.workspaces = data;
      });
  }

  public goToNewWorkspace() {
    this.router.navigate(["/workspace", "new"], { relativeTo: this.activeRoute });
  }

  editWorkspace(workspace: Workspace) {
    alert('edit');
    /*     this.workspace = {...workspace};
        this.workspaceDialog = true; */
  }

  deleteWorkspace(workspace: Workspace) {
    alert('delete');
    /*     this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + workspace.title + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.workspaces = this.workspaces.filter(val => val.id !== workspace.id);
                this.workspace = {};
                this.messageService.add({severity:'success', summary: 'Successful', detail: 'Product Deleted', life: 3000});
            }
        }); */
  }

  public goToWorkspace(workspaceId: string) {
    this.router.navigate(["/workspace", workspaceId], { relativeTo: this.activeRoute });
  }

}
