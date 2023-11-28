import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SenseCore  } from 'src/app/models/lexicon/lexical-entry.model';
import { MenuItem } from 'primeng/api';
import { FormGroup } from '@angular/forms';
import { LexicalEntityRelationsResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';

export interface FormItem {
  relationshipLabel: string,
  relationshipURI: string,
  destinationLabel: string,
  destinationURI: string,
  itemID: number,
  properties?: LinguisticRelationModel[],
}

@Component({template: ''})
export abstract class BaseRelationsComponent implements OnChanges {

  @Input() senseEntry!: SenseCore;
  @Input() model!: LexicalEntityRelationsResponseModel;
  @Input() menuItems: MenuItem[] = [];

  formItems: FormItem[] = [];
  relationshipLabelByURI: { [id: string] : string } = {};

  /**Form per la modifica dei valori del senso */
  form = new FormGroup({});

  uniqueID = 0;

  abstract populateRelationships(model: LexicalEntityRelationsResponseModel): FormItem[];

  private assignMenuTree(root: MenuItem): MenuItem {
    const label = root.label || '';
    const uri = root.id || '';

    const dupItem : MenuItem = {
      ...root,
      items: root.items !== undefined? [] : undefined,
      command: () => this.onMenuClickInsertFormItem(label, uri),
    };

    for (const menuItem of Object.values(root.items || [])) {
      const subItem : MenuItem = this.assignMenuTree(menuItem);
      dupItem.items?.push(subItem);
    }

    this.relationshipLabelByURI[uri] = label;

    return dupItem;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['menuItems']) {
      const items = changes['menuItems'].currentValue;
      this.menuItems = this.assignMenuTree({items}).items || [];
    }

    if (changes['model']) {
      this.formItems = this.populateRelationships(changes['model'].currentValue);
      this.uniqueID = this.formItems.length;
    }
  }

  onMenuClickInsertFormItem(relationshipLabel: string, relationshipURI: string): FormItem {
    const newItem : FormItem = {
      itemID: this.uniqueID++,
      relationshipLabel,
      relationshipURI,
      destinationURI: '',
      destinationLabel: '',
    };
    this.formItems.unshift(newItem);
    return newItem;
  }
}
