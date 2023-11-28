import { Component, OnInit } from '@angular/core';
import { BaseLexEntityRelationsComponent } from '../base-lex-entity-relations/base-lex-entity-relations.component';
import { LexEntryDirectRelationsStrategy } from './lex-entry-direct-relations-strategy';

@Component({
  selector: 'app-lex-entity-direct-relations',
  templateUrl: './lex-entity-direct-relations.component.html',
  styleUrls: ['./lex-entity-direct-relations.component.scss']
})
export class LexEntityDirectRelationsComponent extends BaseLexEntityRelationsComponent implements OnInit {

  ngOnInit(): void {
    console.error("ON INIT")
    super.strategy = new LexEntryDirectRelationsStrategy(this.lexiconService, this.lexEntityId);
  }

}
