import { Component, Input } from '@angular/core';
import { BaseLexEntityRelationsComponent } from '../base-lex-entity-relations/base-lex-entity-relations.component';
import { LexEntryDirectRelationsStrategy } from './lex-entry-direct-relations-strategy';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-lex-entity-direct-relations',
  templateUrl: './lex-entity-direct-relations.component.html',
  styleUrls: ['./lex-entity-direct-relations.component.scss']
})
export class LexEntityDirectRelationsComponent extends BaseLexEntityRelationsComponent {

  @Input() lexEntityId!: string;

  constructor(lexiconService: LexiconService) {
    super();
    super.strategy = new LexEntryDirectRelationsStrategy(lexiconService, this.lexEntityId);
  }
}
