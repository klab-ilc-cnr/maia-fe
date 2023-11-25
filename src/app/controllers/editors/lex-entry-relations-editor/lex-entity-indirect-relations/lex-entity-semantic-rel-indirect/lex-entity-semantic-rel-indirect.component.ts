import { Component } from '@angular/core';
import { LexicalEntryListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { GENERIC_RELATIONS, LINGUISTIC_RELATION_TYPE } from 'src/app/models/lexicon/lexicon-updater';
import { FormItem } from '../../base-lex-entity-relations/base-lex-entity-relations.component';
import { BaseLexEntitySemanticInputComponent, SuggestionEntry } from '../../base-lex-entity-relations/base-lex-entity-semantic-input.component';
import { MenuItem } from 'primeng/api';
import { Observable, map } from 'rxjs';
import { LexicalEntriesResponse, formTypeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';

export type PropertyItem = {
  menuItem: MenuItem;
  value: string;
  propertyURI: GENERIC_RELATIONS;
  indirectRelationshipURI: string;
}

@Component({
  selector: 'app-lex-entity-semantic-rel-indirect',
  templateUrl: './lex-entity-semantic-rel-indirect.component.html',
  styleUrls: ['./lex-entity-semantic-rel-indirect.component.scss']
})
export class LexEntitySemanticRelIndirectComponent extends BaseLexEntitySemanticInputComponent {

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

  override getSuggestions(text: string): Observable<SuggestionEntry[]> {
    return this.lexiconService.getLexicalEntriesList({
      text,
      searchMode: "startsWith",
      formType: formTypeEnum.entry,
      status: "",
      type: "",
      field: "",
      pos: "",
      author: "",
      lang: "",
      offset: 0,
      limit: 500,
    }).pipe(
      map((response: LexicalEntriesResponse) => response.list),
      map((entries: LexicalEntryListItem[]) =>
        entries.map((entry: LexicalEntryListItem) => {
          return {
            relationshipLabel: entry.label || 'no def',
            relationshipURI: entry.lexicalEntry,
          };
        })
      ),
    );
  }

  override updateRelationship(suggestion: SuggestionEntry, control: FormItem) {
    return this.lexiconService.updateLinguisticRelation(control.relationshipURI, {
      type: LINGUISTIC_RELATION_TYPE.LEXICOSEMANTIC_REL,
      relation: 'http://www.w3.org/ns/lemon/vartrans#target',
      currentValue: control.destinationURI,
      value: suggestion.relationshipURI,
    });
  }

  override removeRelationship(control: FormItem) {
    return this.lexiconService.deleteLexicoSemanticRelation(control.relationshipURI);
  }

}
