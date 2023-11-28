import { Component } from '@angular/core';
import { LexicalEntityRelationsResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { BaseRelationsComponent, FormItem } from '../base-relations/base-relations.component';

@Component({
  selector: 'app-direct-relations',
  templateUrl: './direct-relations.component.html',
  styleUrls: ['./direct-relations.component.scss']
})
export class DirectRelationsComponent extends BaseRelationsComponent {

  override populateRelationships(model: LexicalEntityRelationsResponseModel): FormItem[] {
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
