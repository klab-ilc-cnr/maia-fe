import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { LexiconService } from 'src/app/services/lexicon.service';
import { take } from 'rxjs';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { LexicalEntityRelationsResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { BaseRelationsComponent, FormItem } from '../base-relations/base-relations.component';
import { HttpErrorResponse } from '@angular/common/http';

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

  override populateRelationships(model: LexicalEntityRelationsResponseModel): FormItem[] {
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
    const typeURI = "http://www.w3.org/ns/lemon/vartrans#LexicalRelation";

    this.lexiconService.createIndirectSenseRelation(
      this.senseEntry.sense, relationshipURI, typeURI,
    ).pipe(
      take(1)
    ).subscribe({
      next: (indirectRelationshipURI: string) => {
        newItem.relationshipURI = indirectRelationshipURI;
      },
      error: (error: HttpErrorResponse) => {
        console.error(error);
        const message = this.msgConfService.generateErrorMessageConfig(`${error.name}: ${error.error}`);
        this.messageService.add(message);
      }
    });
    return newItem;
  }

}
