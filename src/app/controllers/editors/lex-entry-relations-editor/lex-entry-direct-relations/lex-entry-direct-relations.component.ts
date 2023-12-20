import { Component, SimpleChanges } from '@angular/core';
import { BaseLexEntityRelationsComponent } from '../../lex-entity-relations/base-lex-entity-relations/base-lex-entity-relations.component';
import { LexEntryDirectRelationsStrategy } from './lex-entry-direct-relations-strategy';

@Component({
  selector: 'app-lex-entry-direct-relations',
  templateUrl: './lex-entry-direct-relations.component.html',
  styleUrls: ['./lex-entry-direct-relations.component.scss']
})
export class LexEntryDirectRelationsComponent extends BaseLexEntityRelationsComponent {

  override ngOnChanges(changes: SimpleChanges): void {
    if (changes['lexEntityId']) {
      this.strategy = new LexEntryDirectRelationsStrategy(this.lexiconService, this.lexEntityId);
    }
    super.ngOnChanges(changes);
  }


}
