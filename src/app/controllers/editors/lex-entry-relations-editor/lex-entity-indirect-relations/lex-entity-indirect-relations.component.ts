import { Component, Input } from '@angular/core';
import { MessageService } from 'primeng/api';
import { LexiconService } from 'src/app/services/lexicon.service';
import { take } from 'rxjs';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { LexicalSenseResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { BaseLexEntityRelationsComponent, FormItem } from '../base-lex-entity-relations/base-lex-entity-relations.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-lex-entity-indirect-relations',
  templateUrl: './lex-entity-indirect-relations.component.html',
  styleUrls: ['./lex-entity-indirect-relations.component.scss']
})

export class LexEntityIndirectRelationsComponent extends BaseLexEntityRelationsComponent {

  @Input() lexEntityId!: string;

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
      this.lexEntityId, relationshipURI
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
