import { Component, SimpleChanges } from '@angular/core';
import { BaseLexEntityRelationsComponent } from '../../lex-entity-relations/base-lex-entity-relations/base-lex-entity-relations.component';
import { LexEntryIndirectRelationsStrategy } from './lex-entry-indirect-relations-strategy';

@Component({
  selector: 'app-lex-entry-indirect-relations',
  templateUrl: './lex-entry-indirect-relations.component.html',
  styleUrls: ['./lex-entry-indirect-relations.component.scss']
})

export class LexEntryIndirectRelationsComponent extends BaseLexEntityRelationsComponent  {

  override ngOnChanges(changes: SimpleChanges): void {
    if (changes['lexEntityId']) {
      this.strategy = new LexEntryIndirectRelationsStrategy(this.lexiconService, this.lexEntityId);
    }
    super.ngOnChanges(changes);
  }

}
