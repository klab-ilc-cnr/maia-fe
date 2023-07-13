import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, Subject, catchError, debounceTime, skip, take, takeUntil, throwError } from 'rxjs';
import { SenseCore } from 'src/app/models/lexicon/lexical-entry.model';
import { LEXICAL_SENSE_RELATIONS } from 'src/app/models/lexicon/lexicon-updater';
import { User } from 'src/app/models/user';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-sense-metadata-editor',
  templateUrl: './sense-metadata-editor.component.html',
  styleUrls: ['./sense-metadata-editor.component.scss']
})
export class SenseMetadataEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  @Input() entry$!: Observable<SenseCore>;
  @Input() confidenceLabel = 'Confidence';
  form = new FormGroup({
    creator: new FormControl<string>({ value: '', disabled: true }),
    creationDate: new FormControl<string>({ value: '', disabled: true }),
    provenance: new FormControl<string>(''),
    confidence: new FormControl<number | undefined>(undefined),
    note: new FormControl<string>(''),
  });
  entry!: SenseCore;
  currentUser!: User;

  constructor(
    private lexiconService: LexiconService,
    private userService: UserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private commonService: CommonService,
  ) {
    this.userService.retrieveCurrentUser().pipe(
      take(1),
    ).subscribe(cu => {
      this.currentUser = cu;
    });

    const formControlList = this.form.controls;
    this.subscribe(formControlList.note, LEXICAL_SENSE_RELATIONS.NOTE, 'note');
    this.subscribe(formControlList.confidence, LEXICAL_SENSE_RELATIONS.CONFIDENCE, 'confidence');
  }

  private subscribe(control: FormControl, fieldType: any, fieldName:string) {
    control.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
      skip(1),
    ).subscribe(value => {
      this.updateLexicalSenseField(fieldType, fieldName, value?? '').then(() => {
        this.entry = { ...this.entry, [fieldName]: value?? '' };
      });
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.entry$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(le => {
      this.entry = le;
      const formControlList = this.form.controls;
      formControlList.creator.setValue(this.entry.creator);
      if (this.entry.creationDate !== '') formControlList.creationDate.setValue(new Date(this.entry.creationDate).toLocaleString());
      formControlList.note.setValue(this.entry.note?? '');
      if (+this.entry.confidence !== -1) formControlList.confidence.setValue(+this.entry.confidence * 100);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  private async manageUpdateObservable(updateObs: Observable<string>, relation: string) {
    updateObs.pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        const msg = this.msgConfService.generateWarningMessageConfig(`Update "${relation}" failed `);
        this.messageService.add(msg);
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(resp => {
      this.entry = { ...this.entry, lastUpdate: resp };
      const msg = this.msgConfService.generateSuccessMessageConfig(`Update "${relation}" success `);
      this.messageService.add(msg);
    });
  }

  private async updateLexicalSenseField(relation: LEXICAL_SENSE_RELATIONS, fieldName: string, value: any) {
    if (value === this.entry[fieldName as keyof SenseCore]) return;

    if (!this.currentUser.name) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Current user not found`));
      return;
    }

    if (relation === LEXICAL_SENSE_RELATIONS.CONFIDENCE) {
      value /= 100;
    }

    const obs = this.lexiconService.updateLexicalSense(
      this.currentUser.name,
      this.entry.sense,
      {relation, value}
    );

    this.manageUpdateObservable(obs, relation);
  }
}
