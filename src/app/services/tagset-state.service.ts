import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject, catchError, debounceTime, merge, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { TTagset } from '../models/texto/t-tagset';
import { TTagsetItem } from '../models/texto/t-tagset-item';
import { MessageConfigurationService } from './message-configuration.service';
import { TagsetService } from './tagset.service';

@Injectable()
export class TagsetStateService {
  addTagset = new Subject<TTagset>();
  addTagsetItem = new Subject<TTagsetItem>();
  removeTagset = new Subject<number>();
  removeTagsetItem = new Subject<TTagsetItem>();
  retrieveTagset = new Subject<number>();
  retrieveTagsetItems = new Subject<number>();
  updateTagset = new Subject<TTagset>();
  updateTagsetItem = new Subject<TTagsetItem>();
  tagset$ = merge(
    this.retrieveTagset.pipe(
      switchMap(tagsetId => this.tagsetService.getTagsetById(tagsetId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Fetching tagset failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
    )
  ).pipe(
    shareReplay(1),
  );
  tagsetItems$ = merge(
    this.retrieveTagsetItems.pipe(
      switchMap(tagsetId => this.tagsetService.getTagsetItemsById(tagsetId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Fetching tagset items failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
    ),
    this.addTagsetItem.pipe(
      switchMap(newTagsetItem => this.tagsetService.createTagsetItem(newTagsetItem).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset item added`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Adding tagset item failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(tagsetItem => this.tagsetService.getTagsetItemsById(tagsetItem.tagset!.id!)),
    ),
    this.removeTagsetItem.pipe(
      switchMap(tagsetItem => this.tagsetService.removeTagsetItemById(tagsetItem.id!).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset item removed`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Removing tagset item failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(tagsetItem => this.tagsetService.getTagsetItemsById(tagsetItem.tagset!.id!)),
    ),
    this.updateTagsetItem.pipe(
      switchMap(updatedIagsetItem => this.tagsetService.updateTagsetItem(updatedIagsetItem).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset item updated`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Updating tagset item failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(updatedIagsetItem => this.tagsetService.getTagsetItemsById(updatedIagsetItem.tagset!.id!)),
    ),
  ).pipe(
    shareReplay(1),
  );
  tagsets$ = merge(
    this.tagsetService.getTagsetsList(),
    this.removeTagset.pipe(
      switchMap(tagsetId => this.tagsetService.removeTagsetById(tagsetId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset removed`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Removing tagset failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.tagsetService.getTagsetsList()),
    ),
    this.addTagset.pipe(
      switchMap(newTagset => this.tagsetService.createTagset(newTagset).pipe(
        debounceTime(500),
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset "${newTagset.name}" added`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Adding tagset "${newTagset.name}" failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.tagsetService.getTagsetsList()),
    ),
    this.updateTagset.pipe(
      switchMap(updatedTagset => this.tagsetService.updateTagset(updatedTagset).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset "${updatedTagset.name}" updated`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Updating tagset "${updatedTagset.name}" failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.tagsetService.getTagsetsList()),
    ),
  ).pipe(
    shareReplay(1),
  );

  tagsetsTotal$ = this.tagsets$.pipe(
    switchMap(list => of(list.length)),
  ).pipe(
    shareReplay(1),
  );

  constructor(
    private tagsetService: TagsetService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {
    this.addTagset.subscribe();
    this.addTagsetItem.subscribe();
    this.removeTagset.subscribe();
    this.removeTagsetItem.subscribe();
    this.retrieveTagset.subscribe();
    this.retrieveTagsetItems.subscribe();
    this.updateTagset.subscribe();
    this.updateTagsetItem.subscribe();
  }
}
