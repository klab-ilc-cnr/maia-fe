import { Component, Input } from '@angular/core';
import { LINGUISTIC_RELATION_TYPE } from 'src/app/models/lexicon/lexicon-updater';
import { FormItem } from '../../base-lex-entity-relations/base-lex-entity-relations.component';
import { BaseLexEntitySemanticInputComponent, SuggestionEntry } from '../../base-lex-entity-relations/base-lex-entity-semantic-input.component';
import { LexicalEntryListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { Observable, map, of } from 'rxjs';
import { LexicalEntriesResponse, formTypeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';

@Component({
  selector: 'app-lex-entity-semantic-rel-direct',
  templateUrl: './lex-entity-semantic-rel-direct.component.html',
  styleUrls: ['./lex-entity-semantic-rel-direct.component.scss']
})
export class LexEntitySemanticRelDirectComponent extends BaseLexEntitySemanticInputComponent {
  @Input() lexEntityId!: string;

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
            relationshipLabel: `${entry.label}@${entry.language} (${entry.pos})`,
            relationshipURI: entry.lexicalEntry,
          };
        })
      ),
    );
  }

  override updateRelationship(suggestion: SuggestionEntry, control: FormItem) {
    return this.lexiconService.updateLinguisticRelation(this.lexEntityId, {
      type: LINGUISTIC_RELATION_TYPE.LEXICAL_REL,
      relation: control.relationshipURI,
      currentValue: control.destinationURI,
      value: suggestion.relationshipURI,
    });
  }

  override removeRelationship(control: FormItem) {
    if (!this.selectedSuggestion?.relationshipURI) return of('');
    return this.lexiconService.deleteRelation(this.lexEntityId, {
      relation: control.relationshipURI,
      value: control.destinationURI,
    });
  }

}
