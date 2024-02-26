import { Observable, map } from 'rxjs';
import { LexicalEntriesResponse, formTypeEnum, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntryListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LexicalEntityRelationsResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { LINGUISTIC_RELATION_TYPE } from 'src/app/models/lexicon/lexicon-updater';
import { LexiconService } from 'src/app/services/lexicon.service';
import { BaseLexEntityRelationsStrategy, SuggestionEntry } from '../../lex-entity-relations/base-lex-entity-relations/base-lex-entity-relations-strategy';
import { FormItem } from '../../lex-entity-relations/base-lex-entity-relations/base-lex-entity-relations.component';

export class LexEntryIndirectRelationsStrategy implements BaseLexEntityRelationsStrategy {

  constructor(
    private lexiconService: LexiconService,
    private lexEntityId: string,
  ) { }

  public populateRelationships(model: LexicalEntityRelationsResponseModel, relationshipLabelByURI: { [id: string]: string }): FormItem[] {
    let formItems: FormItem[] = [];
    for (const [itemID, item] of model.indirectRelations.entries()) {
      const { category, target, targetLabel, relation, properties } = item;
      const inferred = item.properties.find(p => p.entity === category)?.inferred;
      const newItem: FormItem = {
        relationshipLabel: relationshipLabelByURI[category] || 'unknown relationship',
        relationshipURI: relation,
        destinationURI: target,
        destinationLabel: targetLabel,
        itemID,
        inferred: inferred,
        properties,
      };
      formItems.unshift(newItem);
    }
    formItems = formItems.sort((a, b) => a.inferred === b.inferred ? 0 : (a.inferred! < b.inferred! ? -1 : 1));
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

  public createRelationship(relationshipURI: string): Observable<string> {
    return this.lexiconService.createIndirectSenseRelation(
      this.lexEntityId,
      relationshipURI,
      "http://www.w3.org/ns/lemon/vartrans#LexicalRelation",
    );
  }

  public updateRelationship(control: FormItem, suggestion: SuggestionEntry) {
    return this.lexiconService.updateLinguisticRelation(control.relationshipURI, {
      type: LINGUISTIC_RELATION_TYPE.LEXICOSEMANTIC_REL,
      relation: 'http://www.w3.org/ns/lemon/vartrans#target',
      currentValue: control.destinationURI,
      value: suggestion.relationshipURI,
    });
  }

  public removeRelationship(control: FormItem) {
    return this.lexiconService.deleteLexicoSemanticRelation(control.relationshipURI);
  }
}
