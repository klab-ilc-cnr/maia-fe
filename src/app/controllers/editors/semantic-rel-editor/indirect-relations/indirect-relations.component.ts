import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { LexiconService } from 'src/app/services/lexicon.service';
import { take } from 'rxjs';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { LexicalSenseResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { BaseRelationsComponent, FormItem } from '../base-relations/base-relations.component';

@Component({
  selector: 'app-indirect-relations',
  templateUrl: './indirect-relations.component.html',
  styleUrls: ['./indirect-relations.component.scss']
})

export class IndirectRelationsComponent extends BaseRelationsComponent {

  constructor(
    private lexiconService: LexiconService,
    private msgConfService: MessageConfigurationService,
    private messageService: MessageService,
  ) {
    super();
  }

  override populateRelationships(model: LexicalSenseResponseModel): FormItem[] {
    const formItems : FormItem[] = [];
    for (const [itemID, item] of model.indirectRelations.entries()) {
      const {category, target, targetLabel, relation, properties} = item;
      const newItem : FormItem = {
        relationshipLabel: this.relationshipLabelByURI[category] || 'unknown relationship',
        relationshipURI: relation,
        destinationURI: target,
        destinationLabel: targetLabel,
        itemID,
        properties,
      };
      formItems.unshift(newItem);
    }
    return formItems;
  }

  override onMenuClickInsertFormItem(relationshipLabel: string, relationshipURI: string): FormItem {
    const newItem = super.onMenuClickInsertFormItem(relationshipLabel, relationshipURI);

    this.lexiconService.createIndirectSenseRelation(
      this.senseEntry.sense, relationshipURI
    ).pipe(
      take(1),
    ).subscribe(
      (indirectRelationshipURI: string) => {
        newItem.relationshipURI = indirectRelationshipURI;
      },
      (err) => {
        console.error(err);
        const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error}`);
        this.messageService.add(message);
      }
    );
    return newItem;
  }

}
