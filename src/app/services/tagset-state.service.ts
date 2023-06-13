import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject, catchError, merge, of, switchMap, tap, throwError } from 'rxjs';
import { MessageConfigurationService } from './message-configuration.service';
import { TagsetService } from './tagset.service';

@Injectable()
export class TagsetStateService {
  removeTagset = new Subject<number>();
  tagsets$ = merge(
    this.tagsetService.getTagsetList(),
    this.removeTagset.pipe(
      switchMap(tagsetId => this.tagsetService.removeTagsetById(tagsetId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Tagset removed`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Removing tagset failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.tagsetService.getTagsetList()),
    ),
  );

  tagsetTotal$ = this.tagsets$.pipe(
    switchMap(list => of(list.length)),
  );

  constructor(
    private tagsetService: TagsetService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {
    this.removeTagset.subscribe();
  }
}
