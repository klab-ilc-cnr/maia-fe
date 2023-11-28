import { Component, Input, OnInit } from '@angular/core';
import { Observable, forkJoin, mergeMap, of, take } from 'rxjs';
import { BaseLexEntityEditorComponent } from './base-lex-entity-relations/base-lex-entity-editor.component';
import { LexicalEntryCore } from 'src/app/models/lexicon/lexical-entry.model';

@Component({
  selector: 'app-lex-entry-relations-editor',
  templateUrl: './lex-entry-relations-editor.component.html',
  styleUrls: ['./lex-entry-relations-editor.component.scss']
})
export class LexEntryRelationsEditorComponent extends BaseLexEntityEditorComponent implements OnInit {
  @Input() entry$!: Observable<LexicalEntryCore>;
  lexEntry?: LexicalEntryCore;

  ngOnInit(): void {

    this.entry$.pipe(
      take(1),
      mergeMap((lexEntry: LexicalEntryCore) =>
        forkJoin({
          relationTypes: this.lexiconService.getLexicalRelationTypes(),
          model: this.lexiconService.getLexicalEntryRelations(lexEntry.lexicalEntry),
          lexEntry: of(lexEntry)
        })
      )
    ).subscribe({
      next: results => {
          this.menuItems = this.buildMenuItems(results.relationTypes);
          this.model = results.model;
          this.lexEntry = results.lexEntry;
      },
      error: this.showHttpError
    });
  }
}
