import { Component } from '@angular/core';
import { LINGUISTIC_RELATION_TYPE } from 'src/app/models/lexicon/lexicon-updater';
import { FormItem } from '../../base-relations/base-relations.component';
import { BaseSemanticInputComponent } from '../../base-relations/base-semantic-input.component';
import { SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';

@Component({
  selector: 'app-semantic-rel-direct',
  templateUrl: './semantic-rel-direct.component.html',
  styleUrls: ['./semantic-rel-direct.component.scss']
})
export class SemanticRelDirectComponent extends BaseSemanticInputComponent {

  override updateRelationship(senseListItem: SenseListItem, control: FormItem) {
    return this.lexiconService.updateLinguisticRelation(this.senseEntry.sense, {
      type: LINGUISTIC_RELATION_TYPE.SENSE_REL,
      relation: control.relationshipURI,
      currentValue: control.destinationURI,
      value: senseListItem?.sense || '',
    });
  }

  override removeRelationship(control: FormItem) {
    return this.lexiconService.deleteRelation(this.senseEntry.sense, {
      relation: control.relationshipURI,
      value: control.destinationURI,
    });
  }

}
