import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';
import { LexicalEntryCore } from 'src/app/models/lexicon/lexical-entry.model';

@Component({
  selector: 'app-lex-entry-metadata-editor',
  templateUrl: './lex-entry-metadata-editor.component.html',
  styleUrls: ['./lex-entry-metadata-editor.component.scss']
})
export class LexEntryMetadataEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  @Input() lexicalEntry$!: Observable<LexicalEntryCore>;
  form = new FormGroup({
    creator: new FormControl<string>({value: '', disabled: true}),
    creationDate: new FormControl<string>({value: '', disabled: true}),
    author: new FormControl<string>({value: '', disabled: true}),
    completionDate: new FormControl<string>({value: '', disabled: true}),
    revisor: new FormControl<string>({value: '', disabled: true}),
    revisionDate: new FormControl<string>({value: '', disabled: true}),
    provenance: new FormControl<string>(''),
    confidence: new FormControl<number|null>(null),
    note: new FormControl<string>(''),
  });
  lexicalEntry!: LexicalEntryCore;

  constructor() { }

  ngOnInit(): void {
    this.lexicalEntry$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(le => {
      this.lexicalEntry = le;
      const formControlList = this.form.controls;
      formControlList.creator.setValue(this.lexicalEntry.creator);
      if(this.lexicalEntry.creationDate !== '')formControlList.creationDate.setValue(new Date(this.lexicalEntry.creationDate).toLocaleString());
      formControlList.author.setValue(this.lexicalEntry.author);
      if(this.lexicalEntry.completionDate !== '')formControlList.completionDate.setValue(new Date(this.lexicalEntry.completionDate).toLocaleString());
      formControlList.revisor.setValue(this.lexicalEntry.revisor);
      if(this.lexicalEntry.revisionDate !== '')formControlList.revisionDate.setValue(new Date(this.lexicalEntry.revisionDate).toLocaleString());

    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
