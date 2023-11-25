import { Component, Input, OnInit } from '@angular/core';
import { Observable, take } from 'rxjs';
import { LexicalSenseResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { LexiconService } from 'src/app/services/lexicon.service';
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

  constructor(
    private lexiconService: LexiconService,
  ) { super() }

  private loadEntry(lexEntry: LexicalEntryCore) {
    this.lexEntry = lexEntry;
    this.lexiconService.getLexicalRelationTypes().pipe(
      take(1),
    ).subscribe(relationTypes => {
      this.menuItems = this.buildMenuItems(relationTypes);
    });

    this.lexiconService.getLexicalEntryRelations(lexEntry.lexicalEntry).pipe(
      take(1),
    ).subscribe((model: LexicalSenseResponseModel) => {
      this.model = model;
    });
  }

  ngOnInit(): void {
    this.entry$.pipe(
      take(1),
    ).subscribe(lexEntry => {
      this.loadEntry(lexEntry);
    });
  }
}
