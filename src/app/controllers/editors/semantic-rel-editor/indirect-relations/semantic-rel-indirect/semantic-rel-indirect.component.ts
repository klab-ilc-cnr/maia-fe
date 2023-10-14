import { Component } from '@angular/core';
import { SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LINGUISTIC_RELATION_TYPE } from 'src/app/models/lexicon/lexicon-updater';
import { FormItem } from '../../base-relations/base-relations.component';
import { BaseSemanticInputComponent } from '../../base-relations/base-semantic-input.component';

@Component({
  selector: 'app-semantic-rel-indirect',
  templateUrl: './semantic-rel-indirect.component.html',
  styleUrls: ['./semantic-rel-indirect.component.scss']
})
export class SemanticRelIndirectComponent extends BaseSemanticInputComponent {

  override updateRelationship(senseListItem: SenseListItem | undefined, control: FormItem) {
    return this.lexiconService.updateLinguisticRelation(control.relationshipURI, {
      type: LINGUISTIC_RELATION_TYPE.LEXICOSEMANTIC_REL,
      relation: 'http://www.w3.org/ns/lemon/vartrans#target',
      currentValue: control.destinationURI,
      value: senseListItem?.sense || '',
    });
  }

  removeRelationship(control: FormItem) {
    return this.lexiconService.deleteLexicoSemanticRelation(control.relationshipURI);
  }

}
