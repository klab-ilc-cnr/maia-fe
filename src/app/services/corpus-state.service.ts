import { Injectable } from '@angular/core';
import { WorkspaceService } from './workspace.service';
import { Subject, catchError, merge, shareReplay, switchMap, take, tap, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MessageConfigurationService } from './message-configuration.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ElementType } from '../models/corpus/element-type';
import { FolderElement } from '../models/texto/corpus-element';

@Injectable()
export class CorpusStateService {
  textoCurrentUserId!: number;
  private textoUserRootFolder!: FolderElement;
  refreshFileSystem = new Subject();
  addElement = new Subject<{ elementType: ElementType, parentFolderId: number, elementName: string }>();
  renameElement = new Subject<{ elementType: ElementType, elementId: number, newName: string }>();
  moveElement = new Subject<{ elementType: ElementType, elementId: number, targetId: number }>();
  uploadFile = new Subject<{ parentId: number, resourceName: string, file: File }>();
  removeElement = new Subject<{ elementType: ElementType, elementId: number }>();
  filesystem$ = merge(
    this.workspaceService.retrieveCorpus(),
    this.refreshFileSystem.pipe(
      switchMap(() => this.workspaceService.retrieveCorpus())
    ),
    this.addElement.pipe(
      switchMap(req => this.workspaceService.addElement(req.elementType, (req.parentFolderId<0 ? this.textoUserRootFolder.id : req.parentFolderId), req.elementName, this.textoCurrentUserId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${req.elementType} ${req.elementName} added`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Add ${req.elementType.toLowerCase()} failed: ${error.error}`));
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
      switchMap(req => this.workspaceService.moveElement(req.elementType, req.elementId, req.targetId < 0 ? this.textoUserRootFolder.id : req.targetId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${req.elementType} moved`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${req.elementType} renaming failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.workspaceService.retrieveCorpus()),
    ),
    this.uploadFile.pipe(
      switchMap(req => this.workspaceService.addElement(ElementType.RESOURCE, req.parentId<0 ? this.textoUserRootFolder.id : req.parentId, req.resourceName, this.textoCurrentUserId).pipe(
        switchMap(resp => this.workspaceService.uploadFile(resp.id, req.file).pipe(
          tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${req.resourceName} uploaded`))),
          catchError((error: HttpErrorResponse) => {
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${req.resourceName} uploading failed: ${error.error}`));
            return throwError(() => new Error(error.error));
          }),
        )),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Resource ${req.resourceName} creation failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.workspaceService.retrieveCorpus()),
    ),
    this.removeElement.pipe(
      switchMap(req => this.workspaceService.removeElement(req.elementType, req.elementId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${req.elementType} removed`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${req.elementType} removing failed: ${error.error}`));
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
    this.workspaceService.getTextoUserRootFolder().pipe(take(1)).subscribe(resp => {
      this.textoUserRootFolder = resp;
    });
    this.refreshFileSystem.subscribe();
    this.addElement.subscribe();
    this.renameElement.subscribe();
    this.moveElement.subscribe();
    this.uploadFile.subscribe();
    this.removeElement.subscribe();
  }
}
