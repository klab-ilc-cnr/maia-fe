import { LexicalEntityRelationsResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { Observable, map } from 'rxjs';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LINGUISTIC_RELATION_TYPE } from 'src/app/models/lexicon/lexicon-updater';
import { BaseLexEntityRelationsStrategy, SuggestionEntry } from '../../lex-entry-relations-editor/base-lex-entity-relations/base-lex-entity-relations-strategy';
import { FilteredSenseModel } from 'src/app/models/lexicon/filtered-sense.model';
import { formTypeEnum, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { FormItem } from '../../lex-entry-relations-editor/base-lex-entity-relations/base-lex-entity-relations.component';

export class LexSenseIndirectRelationsStrategy implements BaseLexEntityRelationsStrategy {

  constructor(
    private lexiconService: LexiconService,
    private lexEntityId: string,
  ) {}

  public populateRelationships(model: LexicalEntityRelationsResponseModel, relationshipLabelByURI: { [id: string] : string }): FormItem[] {
    const formItems : FormItem[] = [];
    for (const [itemID, item] of model.indirectRelations.entries()) {
      const {category, target, targetLabel, relation, properties} = item;
      const newItem : FormItem = {
        relationshipLabel: relationshipLabelByURI[category] || 'unknown relationship',
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

  public getSuggestions(text: string): Observable<SuggestionEntry[]> {
    return this.lexiconService.getFilteredSenses({
      text,
      searchMode: searchModeEnum.startsWith,
      formType: formTypeEnum.flexed,
      status: "",
      type: "",
      field: "",
      pos: "",
      author: "",
      lang: "",
      offset: 0,
      limit: 500,
    }).pipe(
      map((response: FilteredSenseModel) =>
        response.list.map((entry: SenseListItem) => {
          return {
            relationshipLabel: `${entry.lemma} - ${entry.label || 'no def'}`,
            relationshipURI: entry.sense,
          };
        })
      ),
    );
  }

  public createRelationship(relationshipURI: string): Observable<string> {
    return this.lexiconService.createIndirectSenseRelation(
      this.lexEntityId,
      relationshipURI,
      "http://www.w3.org/ns/lemon/vartrans#SenseRelation",
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
