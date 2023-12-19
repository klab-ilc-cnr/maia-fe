import { Component, Input, OnInit } from '@angular/core';
import { SenseCore } from 'src/app/models/lexicon/lexical-entry.model';
import { forkJoin } from 'rxjs';
import { BaseLexEntityEditorComponent } from '../lex-entity-relations/base-lex-entity-relations/base-lex-entity-editor.component';

@Component({
  selector: 'app-lex-sense-relations-editor',
  templateUrl: './lex-sense-relations-editor.component.html',
  styleUrls: ['./lex-sense-relations-editor.component.scss']
})
export class LexSenseRelationsEditorComponent extends BaseLexEntityEditorComponent implements OnInit {
  @Input() senseEntry!: SenseCore;

  ngOnInit(): void {

    forkJoin({
      relationTypes: this.lexiconService.getSenseRelationTypes(),
      model: this.lexiconService.getLexicalSenseRelations(this.senseEntry.sense),
    }).subscribe({
      next: results => {
          this.menuItems = this.buildMenuItems(results.relationTypes);
          this.model = results.model;
      },
      error: this.showHttpError
    });
  }
}
