import { Component, Input } from '@angular/core';
import { LexicalSenseResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { BaseLexEntityRelationsComponent, FormItem } from '../base-lex-entity-relations/base-lex-entity-relations.component';

@Component({
  selector: 'app-lex-entity-direct-relations',
  templateUrl: './lex-entity-direct-relations.component.html',
  styleUrls: ['./lex-entity-direct-relations.component.scss']
})
export class LexEntityDirectRelationsComponent extends BaseLexEntityRelationsComponent {

  @Input() lexEntityId!: string;

  override populateRelationships(model: LexicalSenseResponseModel): FormItem[] {
    const formItems: FormItem[] = [];
    for (const [itemID, item] of model.directRelations.entries()) {
      const {link, entity, label} = item;
      if (!link) continue;
      const newItem : FormItem = {
        relationshipLabel: this.relationshipLabelByURI[link],
        relationshipURI: link,
        destinationURI: entity || '',
        destinationLabel: label || '',
        itemID
      };

      formItems.unshift(newItem);
    }
    return formItems;
  }

}
