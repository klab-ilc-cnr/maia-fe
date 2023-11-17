import { Component } from '@angular/core';
import { SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { GENERIC_RELATIONS, LINGUISTIC_RELATION_TYPE } from 'src/app/models/lexicon/lexicon-updater';
import { FormItem } from '../../base-relations/base-relations.component';
import { BaseSemanticInputComponent } from '../../base-relations/base-semantic-input.component';
import { MenuItem } from 'primeng/api';

export type PropertyItem = {
  menuItem: MenuItem;
  value: string;
  propertyURI: GENERIC_RELATIONS;
  indirectRelationshipURI: string;
}

@Component({
  selector: 'app-semantic-rel-indirect',
  templateUrl: './semantic-rel-indirect.component.html',
  styleUrls: ['./semantic-rel-indirect.component.scss']
})
export class SemanticRelIndirectComponent extends BaseSemanticInputComponent {

  properties = {
    Comment: GENERIC_RELATIONS.COMMENT,
    Description: GENERIC_RELATIONS.DESCRIPTION,
    Example: GENERIC_RELATIONS.EXAMPLE,
    Confidence: GENERIC_RELATIONS.CONFIDENCE,
  }

  menuItems: MenuItem[] = [];
  propertyItems : PropertyItem[] = [];

  private prepareMenuItems() {
    for (const [label, id] of Object.entries(this.properties)) {
      this.menuItems.push({label, id, command: this.onAddProperty});
    }
  }

  private populatePropertyItems() {
    if (!this.control.properties) return;
    for (const property of this.control.properties) {
      const index = this.menuItems.findIndex(p => p.id === property.link);
      if (index == -1) continue;
      this.onAddProperty({item: this.menuItems[index]}, property.entity);
    }
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.prepareMenuItems();
    this.populatePropertyItems();
  }

  onAddProperty = (event: {item: MenuItem}, value='') => {
    const index = this.menuItems.findIndex(e => e.id === event.item.id);
    this.menuItems.splice(index, 1);
    this.propertyItems.push({
      menuItem: event.item,
      indirectRelationshipURI: this.control.relationshipURI,
      propertyURI: <GENERIC_RELATIONS> event.item.id,
      value,
    })
  }

  onRemoveProperty = (propertyItem: PropertyItem) => {
    const index = this.propertyItems.findIndex(p => p === propertyItem);
    this.propertyItems.splice(index, 1);
    this.menuItems.push(propertyItem.menuItem);
  }

  override updateRelationship(senseListItem: SenseListItem | undefined, control: FormItem) {
    return this.lexiconService.updateLinguisticRelation(control.relationshipURI, {
      type: LINGUISTIC_RELATION_TYPE.LEXICOSEMANTIC_REL,
      relation: 'http://www.w3.org/ns/lemon/vartrans#target',
      currentValue: control.destinationURI,
      value: senseListItem?.sense || '',
    });
  }

  override removeRelationship(control: FormItem) {
    return this.lexiconService.deleteLexicoSemanticRelation(control.relationshipURI);
  }

}
