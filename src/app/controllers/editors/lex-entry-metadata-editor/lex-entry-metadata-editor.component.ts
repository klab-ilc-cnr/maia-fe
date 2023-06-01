import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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
  lexicalEntry!: LexicalEntryCore;

  constructor() { }

  ngOnInit(): void {
    this.lexicalEntry$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(le => {
      this.lexicalEntry = le;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
