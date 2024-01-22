import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { take } from 'rxjs';
import { LexicalEntityRelationsResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { BaseLexEntityRelationsStrategy } from './base-lex-entity-relations-strategy';

export interface FormItem {
  relationshipLabel: string,
  relationshipURI: string,
  destinationLabel: string,
  destinationURI: string,
  itemID: number,
  properties?: LinguisticRelationModel[],
}

@Component({ template: '' })
export abstract class BaseLexEntityRelationsComponent implements OnChanges {

  @Input() lexEntityId!: string;
  @Input() model!: LexicalEntityRelationsResponseModel;
  @Input() menuItems: MenuItem[] = [];

  protected strategy!: BaseLexEntityRelationsStrategy;
  formItems: FormItem[] = [];
  relationshipLabelByURI: { [id: string]: string } = {};

  /**Form per la modifica dei valori del senso */
  form = new FormGroup({});

  uniqueID = 0;

  public constructor(
    protected messageService: MessageService,
    protected msgConfService: MessageConfigurationService,
    protected lexiconService: LexiconService,
  ) { }

  protected showHttpError(err: HttpErrorResponse): void {
    console.error(err);
    const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error.message}`);
    this.messageService.add(message);
  }

  private assignMenuTree(root: MenuItem): MenuItem {
    const label = root.label || '';
    const uri = root.id || '';

    const dupItem: MenuItem = {
      ...root,
      items: root.items !== undefined ? [] : undefined,
      command: () => this.onMenuClickInsertFormItem(label, uri),
    };

    for (const menuItem of Object.values(root.items || [])) {
      const subItem: MenuItem = this.assignMenuTree(menuItem);
      dupItem.items?.push(subItem);
    }

    this.relationshipLabelByURI[uri] = label;

    return dupItem;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['menuItems']) {
      const items = changes['menuItems'].currentValue;
      this.menuItems = this.assignMenuTree({ items }).items || [];
    }

    if (changes['model']) {
      this.formItems = this.strategy.populateRelationships(changes['model'].currentValue, this.relationshipLabelByURI);
      this.uniqueID = this.formItems.length;
    }
  }

  private onMenuClickInsertFormItem(relationshipLabel: string, relationshipURI: string): FormItem {
    const newItem: FormItem = {
      itemID: this.uniqueID++,
      relationshipLabel,
      relationshipURI: '',
      destinationURI: '',
      destinationLabel: '',
    };

    this.strategy.createRelationship(relationshipURI).pipe(
      take(1)
    ).subscribe({
      next: (newItemRelationshipURI: string) => {
        newItem.relationshipURI = newItemRelationshipURI;
      },
      error: this.showHttpError
    });

    this.formItems.unshift(newItem);
    return newItem;
  }
}
