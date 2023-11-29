import { Component, SimpleChanges } from '@angular/core';
import { LexSenseDirectRelationsStrategy } from './lex-sense-direct-relations-strategy';
import { BaseLexEntityRelationsComponent } from '../../lex-entity-relations/base-lex-entity-relations/base-lex-entity-relations.component';

@Component({
  selector: 'app-lex-sense-direct-relations',
  templateUrl: './lex-sense-direct-relations.component.html',
  styleUrls: ['./lex-sense-direct-relations.component.scss']
})
export class LexSenseDirectRelationsComponent extends BaseLexEntityRelationsComponent {

  override ngOnChanges(changes: SimpleChanges): void {
    if (changes['lexEntityId']) {
      this.strategy = new LexSenseDirectRelationsStrategy(this.lexiconService, this.lexEntityId);
    }
    super.ngOnChanges(changes);
  }
}
