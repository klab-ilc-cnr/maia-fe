import { Injectable } from '@angular/core';
import { WorkspaceService } from './workspace.service';
import { Subject, catchError, merge, shareReplay, switchMap, take, tap, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MessageConfigurationService } from './message-configuration.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ElementType } from '../models/corpus/element-type';

@Injectable()
export class CorpusStateService {
  textoCurrentUserId!: number;
  refreshFileSystem = new Subject();
  addFolder = new Subject<{ parentFolderId: number, folderName: string }>();
  renameElement = new Subject<{ elementType: ElementType, elementId: number, newName: string }>();
  moveElement = new Subject<{ elementType: ElementType, elementId: number, targetId: number }>();
  filesystem$ = merge(
    this.workspaceService.retrieveCorpus(),
    this.refreshFileSystem.pipe(
      switchMap(() => this.workspaceService.retrieveCorpus())
    ),
    this.addFolder.pipe(
      switchMap(req => this.workspaceService.addFolder(req.parentFolderId, req.folderName, this.textoCurrentUserId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Folder ${req.folderName} added`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Add folder failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.workspaceService.retrieveCorpus()),
    ),
    this.renameElement.pipe(
      switchMap(req => this.workspaceService.renameElement(req.elementType, req.elementId, req.newName).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${req.elementType} renamed as ${req.newName}`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${req.elementType} renaming failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.workspaceService.retrieveCorpus()),
    ),
    this.moveElement.pipe(
      switchMap(req => this.workspaceService.moveElement(req.elementType, req.elementId, req.targetId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${req.elementType} moved`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${req.elementType} renaming failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.workspaceService.retrieveCorpus()),
    ),
  ).pipe(
    shareReplay(1),
  )

  constructor(
    private workspaceService: WorkspaceService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {
    this.workspaceService.getTextoCurrentUserId().pipe(take(1)).subscribe(resp => {
      this.textoCurrentUserId = resp.id;
    });
    this.refreshFileSystem.subscribe();
    this.addFolder.subscribe();
    this.renameElement.subscribe();
    this.moveElement.subscribe();
  }
}
