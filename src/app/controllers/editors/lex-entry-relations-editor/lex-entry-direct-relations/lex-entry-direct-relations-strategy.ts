import { LexicalEntityRelationsResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { FormItem } from '../../lex-entity-relations/base-lex-entity-relations/base-lex-entity-relations.component';
import { BaseLexEntityRelationsStrategy, SuggestionEntry } from '../../lex-entity-relations/base-lex-entity-relations/base-lex-entity-relations-strategy';
import { Observable, map, of } from 'rxjs';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LexicalEntriesResponse, formTypeEnum, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntryListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LINGUISTIC_RELATION_TYPE } from 'src/app/models/lexicon/lexicon-updater';

export class LexEntryDirectRelationsStrategy implements BaseLexEntityRelationsStrategy {

  constructor(
    private lexiconService: LexiconService,
    private lexEntityId: string,
  ) {}

  public populateRelationships(model: LexicalEntityRelationsResponseModel, relationshipLabelByURI: { [id: string] : string }): FormItem[] {
    const formItems: FormItem[] = [];
    for (const [itemID, item] of model.directRelations.entries()) {
      const {link, entity, label} = item;
      if (!link) continue;
      const newItem : FormItem = {
        relationshipLabel: relationshipLabelByURI[link],
        relationshipURI: link,
        destinationURI: entity || '',
        destinationLabel: label || '',
        itemID
      };

      formItems.unshift(newItem);
    }
    return formItems;
  }

  public getSuggestions(text: string): Observable<SuggestionEntry[]> {
    return this.lexiconService.getLexicalEntriesList({
      text,
      searchMode: searchModeEnum.startsWith,
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
      map((response: LexicalEntriesResponse) =>
        response.list.map((entry: LexicalEntryListItem) => {
          return {
            relationshipLabel: `${entry.label}@${entry.language} (${entry.pos})`,
            relationshipURI: entry.lexicalEntry,
          };
        })
      ),
    );
  }

  public createRelationship(relationShipURI: string): Observable<string> {
    return of(relationShipURI);
  }

  public updateRelationship(control: FormItem, suggestion: SuggestionEntry) {
    return this.lexiconService.updateLinguisticRelation(this.lexEntityId, {
      type: LINGUISTIC_RELATION_TYPE.LEXICAL_REL,
      relation: control.relationshipURI,
      currentValue: control.destinationURI,
      value: suggestion.relationshipURI,
    });
  }

  public removeRelationship(control: FormItem) {
    if (!control.destinationURI) {
      return of('');
    }

    return this.lexiconService.deleteRelation(this.lexEntityId, {
      relation: control.relationshipURI,
      value: control.destinationURI,
    });
  }
}
