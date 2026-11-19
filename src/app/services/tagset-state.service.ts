import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { EMPTY, Observable, Subject, catchError, debounceTime, map, merge, of, shareReplay, switchMap, tap } from 'rxjs';
import { httpErrorText } from '../helpers/http-error';
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
  /**Subject to set (item) or remove (null) the default value of the tagset shown */
  setDefaultItem = new Subject<TTagsetItem | null>();
  /** Tagset changed by the state itself (default value), to be shown */
  private tagsetChanged = new Subject<TTagset>();
  /** Last tagset shown: the update of the default value starts from it, because an update without `defaultItem` removes it */
  private currentTagset: TTagset | undefined;
  /**Observable of a tagset */
  tagset$ = merge(
    this.tagsetChanged,
    this.setDefaultItem.pipe(
      switchMap(item => this.updateDefaultItem(item)),
    ),
    this.retrieveTagset.pipe(
      switchMap(tagsetId => this.tagsetService.getTagsetById(tagsetId).pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.commonService.translateKey('TAGSET_STATE.fetchingTagsetFailed').replace('${errorMessage}', httpErrorText(error));
          return this.commonService.throwHttpErrorAndMessage(error, errorMessage).pipe(catchError(() => EMPTY)); // shows the message; the stream must go on
        }),
      )),
    )
  ).pipe(
    tap(tagset => this.currentTagset = tagset),
    shareReplay(1),
  );
  /**Observable of the items of a tagset */
  tagsetItems$ = merge(
    this.retrieveTagsetItems.pipe(
      switchMap(tagsetId => this.tagsetService.getTagsetItemsById(tagsetId).pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.commonService.translateKey('TAGSET_STATE.fetchingTagsetItemsFailed').replace('${errorMessage}', httpErrorText(error));
          return this.commonService.throwHttpErrorAndMessage(error, errorMessage).pipe(catchError(() => EMPTY)); // shows the message; the stream must go on
        }),
      )),
    ),
    this.addTagsetItem.pipe(
      switchMap(newTagsetItem => this.tagsetService.createTagsetItem(newTagsetItem).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(this.commonService.translateKey('TAGSET_STATE.addedTagsetItem')))),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.commonService.translateKey('TAGSET_STATE.addingTagsetItemFailed').replace('${errorMessage}', httpErrorText(error));
          return this.commonService.throwHttpErrorAndMessage(error, errorMessage).pipe(catchError(() => EMPTY)); // shows the message; the stream must go on
        }),
      )),
      switchMap(tagsetItem => this.tagsetService.getTagsetItemsById(tagsetItem.tagset!.id!)),
    ),
    this.removeTagsetItem.pipe(
      switchMap(tagsetItem => this.clearDefaultIfItem(tagsetItem).pipe(
        switchMap(() => this.tagsetService.removeTagsetItemById(tagsetItem.id!)),
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(this.commonService.translateKey('TAGSET_STATE.removedTagsetItem')))),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.commonService.translateKey('TAGSET_STATE.removingTagsetItemFailed').replace('${errorMessage}', httpErrorText(error));
          return this.commonService.throwHttpErrorAndMessage(error, errorMessage).pipe(catchError(() => EMPTY)); // shows the message; the stream must go on
        }),
      )),
      switchMap(tagsetItem => this.tagsetService.getTagsetItemsById(tagsetItem.tagset!.id!)),
    ),
    this.updateTagsetItem.pipe(
      switchMap(updatedIagsetItem => this.tagsetService.updateTagsetItem(updatedIagsetItem).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(this.commonService.translateKey('TAGSET_STATE.updatedTagsetItem')))),
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.commonService.translateKey('TAGSET_STATE.updatingTagsetItemFailed').replace('${errorMessage}', httpErrorText(error));
          return this.commonService.throwHttpErrorAndMessage(error, errorMessage).pipe(catchError(() => EMPTY)); // shows the message; the stream must go on
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
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Removing tagset failed: ${httpErrorText(error)}`));
          return EMPTY; // the stream must go on: an error would end it and the list would no longer be updated
        }),
      )),
      switchMap(() => this.tagsetService.getTagsetsList()),
    ),
    this.addTagset.pipe(
      switchMap(newTagset => this.tagsetService.createTagset(newTagset).pipe(
        debounceTime(500),
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset "${newTagset.name}" added`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Adding tagset "${newTagset.name}" failed: ${httpErrorText(error)}`));
          return EMPTY; // the stream must go on: an error would end it and the list would no longer be updated
        }),
      )),
      switchMap(() => this.tagsetService.getTagsetsList()),
    ),
    this.updateTagset.pipe(
      switchMap(updatedTagset => this.tagsetService.updateTagset(updatedTagset).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset "${updatedTagset.name}" updated`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Updating tagset "${updatedTagset.name}" failed: ${httpErrorText(error)}`));
          return EMPTY; // the stream must go on: an error would end it and the list would no longer be updated
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
   * Sets or removes the default value of the shown tagset. The tagset is sent whole (with name and description): the backend
   * replaces it, and an update without `defaultItem` removes the default.
   * @param item {TTagsetItem|null} new default value, null to remove it
   */
  private updateDefaultItem(item: TTagsetItem | null): Observable<TTagset> {
    const current = this.currentTagset;
    if (!current) { return EMPTY; }
    return this.tagsetService.updateTagset({ ...current, defaultItem: item ? { id: item.id } : null }).pipe(
      map(updated => <TTagset>{ ...current, ...updated }),
      tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(
        this.commonService.translateKey(item ? 'TAGSET_STATE.defaultSet' : 'TAGSET_STATE.defaultRemoved')))),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(
          this.commonService.translateKey('TAGSET_STATE.updatingDefaultFailed').replace('${errorMessage}', httpErrorText(error))));
        return EMPTY;
      }),
    );
  }

  /**
   * The backend does not delete the default value of a tagset: if the item is it, the default is removed first.
   * @param item {TTagsetItem} item about to be deleted
   */
  private clearDefaultIfItem(item: TTagsetItem): Observable<unknown> {
    const current = this.currentTagset;
    if (!current?.defaultItem || current.defaultItem.id !== item.id) { return of(null); }
    return this.tagsetService.updateTagset({ ...current, defaultItem: null }).pipe(
      tap(updated => this.tagsetChanged.next(<TTagset>{ ...current, ...updated })),
    );
  }

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
