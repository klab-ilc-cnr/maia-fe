import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject, catchError, merge, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { WorkspaceChoice } from '../models/workspace-choice.model';
import { MessageConfigurationService } from './message-configuration.service';
import { WorkspaceService } from './workspace.service';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceStateService {
  addWorkspace = new Subject<WorkspaceChoice>();
  removeWorkspace = new Subject<number>();
  updateWorkspace = new Subject<WorkspaceChoice>();

  /** asks for the list again (see `refresh`) */
  private refreshWorkspaces = new Subject<void>();
  /** true once the first request of the list has been answered */
  private loaded = false;

  workspaces$ = merge(
    this.workspaceService.retrieveWorkspaceChoiceList().pipe(tap(() => this.loaded = true)),
    this.refreshWorkspaces.pipe(
      switchMap(() => this.workspaceService.retrieveWorkspaceChoiceList()),
    ),
    this.addWorkspace.pipe(
      switchMap(newWorkspace => this.workspaceService.createWorkspace(newWorkspace).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Workspace ${newWorkspace.name} added`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Adding workspace "${newWorkspace.name}" failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.workspaceService.retrieveWorkspaceChoiceList()),
    ),
    this.updateWorkspace.pipe(
      switchMap(updatedWorkspace => this.workspaceService.updateWorkspace(updatedWorkspace).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Workspace ${updatedWorkspace.name} updated`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Updating workspace "${updatedWorkspace.name}" failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.workspaceService.retrieveWorkspaceChoiceList()),
    ),
    this.removeWorkspace.pipe(
      switchMap(workspaceId => this.workspaceService.deleteWorkspace(workspaceId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Workspace removed`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Removing workspace failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.workspaceService.retrieveWorkspaceChoiceList()),
    ),
  ).pipe(
    shareReplay(1),
  );

  /**
   * Requests the list again. The list is shared and kept for the whole session (shareReplay), so without this the "Last
   * access" dates stayed those of the first load. Does nothing if the list has not been loaded yet (the first request
   * is still going to be made).
   */
  public refresh(): void {
    if (this.loaded) {
      this.refreshWorkspaces.next();
    }
  }

  constructor(
    private workspaceService: WorkspaceService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {
    this.addWorkspace.subscribe();
    this.removeWorkspace.subscribe();
    this.updateWorkspace.subscribe();
  }
}
