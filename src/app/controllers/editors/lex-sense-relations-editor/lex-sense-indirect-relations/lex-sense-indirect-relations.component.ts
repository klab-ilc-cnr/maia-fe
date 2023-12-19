import { Component, SimpleChanges } from '@angular/core';
import { BaseLexEntityRelationsComponent } from '../../lex-entity-relations/base-lex-entity-relations/base-lex-entity-relations.component';
import { LexSenseIndirectRelationsStrategy } from './lex-sense-indirect-relations-strategy';

@Component({
  selector: 'app-lex-sense-indirect-relations',
  templateUrl: './lex-sense-indirect-relations.component.html',
  styleUrls: ['./lex-sense-indirect-relations.component.scss']
})

export class LexSenseIndirectRelationsComponent extends BaseLexEntityRelationsComponent  {

  override ngOnChanges(changes: SimpleChanges): void {
    if (changes['lexEntityId']) {
      this.strategy = new LexSenseIndirectRelationsStrategy(this.lexiconService, this.lexEntityId);
    }
    super.ngOnChanges(changes);
  }

}
