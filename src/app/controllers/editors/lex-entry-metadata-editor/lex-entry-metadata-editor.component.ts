import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, Subject, catchError, debounceTime, skip, take, takeUntil, throwError } from 'rxjs';
import { LexicalEntryCore } from 'src/app/models/lexicon/lexical-entry.model';
import { LEXICAL_ENTRY_RELATIONS, LexicalEntryUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { User } from 'src/app/models/user';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-lex-entry-metadata-editor',
  templateUrl: './lex-entry-metadata-editor.component.html',
  styleUrls: ['./lex-entry-metadata-editor.component.scss']
})
export class LexEntryMetadataEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  @Input() lexicalEntry$!: Observable<LexicalEntryCore>;
  form = new FormGroup({
    creator: new FormControl<string>({ value: '', disabled: true }),
    creationDate: new FormControl<string>({ value: '', disabled: true }),
    author: new FormControl<string>({ value: '', disabled: true }),
    completionDate: new FormControl<string>({ value: '', disabled: true }),
    revisor: new FormControl<string>({ value: '', disabled: true }),
    revisionDate: new FormControl<string>({ value: '', disabled: true }),
    provenance: new FormControl<string>(''),
    confidence: new FormControl<number | undefined>(undefined),
    note: new FormControl<string>(''),
  });
  lexicalEntry!: LexicalEntryCore;
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
    formControlList.note.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
      skip(1),
    ).subscribe(note => {
      this.updateLexicalEntryField(LEXICAL_ENTRY_RELATIONS.NOTE, note).then(() => {
        if (this.lexicalEntry.note !== note) {
          this.lexicalEntry = <LexicalEntryCore>{ ...this.lexicalEntry, note: note };
        }
      });
    });
  }

  ngOnInit(): void {
    this.lexicalEntry$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(le => {
      this.lexicalEntry = le;
      const formControlList = this.form.controls;
      formControlList.creator.setValue(this.lexicalEntry.creator);
      if (this.lexicalEntry.creationDate !== '') formControlList.creationDate.setValue(new Date(this.lexicalEntry.creationDate).toLocaleString());
      formControlList.author.setValue(this.lexicalEntry.author);
      if (this.lexicalEntry.completionDate !== '') formControlList.completionDate.setValue(new Date(this.lexicalEntry.completionDate).toLocaleString());
      formControlList.revisor.setValue(this.lexicalEntry.revisor);
      if (this.lexicalEntry.revisionDate !== '') formControlList.revisionDate.setValue(new Date(this.lexicalEntry.revisionDate).toLocaleString());
      formControlList.note.setValue(this.lexicalEntry.note);
      if (+this.lexicalEntry.confidence !== -1) formControlList.confidence.setValue(+this.lexicalEntry.confidence * 100);
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
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.lexicalEntry.label} update "${relation}" failed `));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(resp => {
      this.lexicalEntry = <LexicalEntryCore>{ ...this.lexicalEntry, lastUpdate: resp };
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${this.lexicalEntry.label} update "${relation}" success `));
      this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.lexicalEntry.lexicalEntry });
    });
  }

  private async updateLexicalEntryField(relation: LEXICAL_ENTRY_RELATIONS, value: any) {
    if (!this.currentUser.name) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Current user not found`));
      return;
    }
    const updater = <LexicalEntryUpdater>{
      relation: relation,
      value: value
    };
    this.manageUpdateObservable(this.lexiconService.updateLexicalEntry(this.currentUser.name, this.lexicalEntry.lexicalEntry, updater), relation);
  }
}
