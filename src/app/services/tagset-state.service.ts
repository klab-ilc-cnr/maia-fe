import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject, catchError, debounceTime, merge, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { TTagset } from '../models/texto/t-tagset';
import { TTagsetItem } from '../models/texto/t-tagset-item';
import { CommonService } from './common.service';
import { MessageConfigurationService } from './message-configuration.service';
import { TagsetService } from './tagset.service';

/**Services for tagset state management */
@Injectable()
export class TagsetStateService {
  /**Subject to add a tagset */
  addTagset = new Subject<TTagset>();
  /**Subject to add a tagset item (or value) */
  addTagsetItem = new Subject<TTagsetItem>();
  /**Subject to remove a tagset */
  removeTagset = new Subject<number>();
  /**Subject to remove a tagset value */
  removeTagsetItem = new Subject<TTagsetItem>();
  /**Subject to retrieve a tagset by id */
  retrieveTagset = new Subject<number>();
  /**Subject to retrieve tagset items by tagset id */
  retrieveTagsetItems = new Subject<number>();
  /**Subject to update a tagset */
  updateTagset = new Subject<TTagset>();
  /**Subject to update a tagset item */
  updateTagsetItem = new Subject<TTagsetItem>();
  /**Observable of a tagset */
  tagset$ = merge(
    this.retrieveTagset.pipe(
      switchMap(tagsetId => this.tagsetService.getTagsetById(tagsetId).pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.commonService.translateKey('TAGSET_STATE.fetchingTagsetFailed').replace('${errorMessage}', error.error.message);
          return this.commonService.throwHttpErrorAndMessage(error,errorMessage);
        }),
      )),
    )
  ).pipe(
    shareReplay(1),
  );
  /**Observable of the items of a tagset */
  tagsetItems$ = merge(
    this.retrieveTagsetItems.pipe(
      switchMap(tagsetId => this.tagsetService.getTagsetItemsById(tagsetId).pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.commonService.translateKey('TAGSET_STATE.fetchingTagsetItemsFailed').replace('${errorMessage}', error.error.message);
          return this.commonService.throwHttpErrorAndMessage(error,errorMessage);
        }),
      )),
    ),
    this.addTagsetItem.pipe(
      switchMap(newTagsetItem => this.tagsetService.createTagsetItem(newTagsetItem).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(this.commonService.translateKey('TAGSET_STATE.addedTagsetItem')))),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.commonService.translateKey('TAGSET_STATE.addingTagsetItemFailed').replace('${errorMessage}', error.error.message);
          return this.commonService.throwHttpErrorAndMessage(error, errorMessage);
        }),
      )),
      switchMap(tagsetItem => this.tagsetService.getTagsetItemsById(tagsetItem.tagset!.id!)),
    ),
    this.removeTagsetItem.pipe(
      switchMap(tagsetItem => this.tagsetService.removeTagsetItemById(tagsetItem.id!).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(this.commonService.translateKey('TAGSET_STATE.removedTagsetItem')))),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.commonService.translateKey('TAGSET_STATE.removingTagsetItemFailed').replace('${errorMessage}', error.error.message);
          return this.commonService.throwHttpErrorAndMessage(error, errorMessage);
        }),
      )),
      switchMap(tagsetItem => this.tagsetService.getTagsetItemsById(tagsetItem.tagset!.id!)),
    ),
    this.updateTagsetItem.pipe(
      switchMap(updatedIagsetItem => this.tagsetService.updateTagsetItem(updatedIagsetItem).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(this.commonService.translateKey('TAGSET_STATE.updatedTagsetItem')))),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.commonService.translateKey('TAGSET_STATE.updatingTagsetItemFailed').replace('${errorMessage}', error.error.message);
          return this.commonService.throwHttpErrorAndMessage(error, errorMessage);
        }),
      )),
      switchMap(updatedIagsetItem => this.tagsetService.getTagsetItemsById(updatedIagsetItem.tagset!.id!)),
    ),
  ).pipe(
    shareReplay(1),
  );
  /**Observable of the tagset list */
  tagsets$ = merge(
    this.tagsetService.getTagsetsList(),
    this.removeTagset.pipe(
      switchMap(tagsetId => this.tagsetService.removeTagsetById(tagsetId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset removed`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Removing tagset failed: ${error.error.message}`));
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
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Adding tagset "${newTagset.name}" failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.tagsetService.getTagsetsList()),
    ),
    this.updateTagset.pipe(
      switchMap(updatedTagset => this.tagsetService.updateTagset(updatedTagset).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset "${updatedTagset.name}" updated`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Updating tagset "${updatedTagset.name}" failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.tagsetService.getTagsetsList()),
    ),
  ).pipe(
    shareReplay(1),
  );
  /**Observable of the total number of tagsets */
  tagsetsTotal$ = this.tagsets$.pipe(
    switchMap(list => of(list.length)),
  ).pipe(
    shareReplay(1),
  );

  /**
   * Constructor for TagsetStateService
   * @param tagsetService {TagsetServive} tagset-related services
   * @param messageService {MessageService} message-related services
   * @param msgConfService {MessageConfigurationService} services for message configuration
   * @param commonService {CommonService} services related to shared functionality
   */
  constructor(
    private tagsetService: TagsetService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private commonService: CommonService,
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
