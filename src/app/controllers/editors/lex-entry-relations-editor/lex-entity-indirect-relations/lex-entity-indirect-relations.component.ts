import { Component, OnInit } from '@angular/core';
import { BaseLexEntityRelationsComponent } from '../base-lex-entity-relations/base-lex-entity-relations.component';
import { LexEntryIndirectRelationsStrategy } from './lex-entry-indirect-relations-strategy';

@Component({
  selector: 'app-lex-entity-indirect-relations',
  templateUrl: './lex-entity-indirect-relations.component.html',
  styleUrls: ['./lex-entity-indirect-relations.component.scss']
})

export class LexEntityIndirectRelationsComponent extends BaseLexEntityRelationsComponent implements OnInit {

  ngOnInit() {
    this.strategy = new LexEntryIndirectRelationsStrategy(this.lexiconService, this.lexEntityId);
  }
}
