import { Observable } from "rxjs";
import { FormItem } from "./base-lex-entity-relations.component";
import { LexicalSenseResponseModel } from "src/app/models/lexicon/lexical-sense-response.model";

export type SuggestionEntry = {
  relationshipLabel: string,
  relationshipURI: string,
};

export interface BaseLexEntityRelationsStrategy {
  populateRelationships(model: LexicalSenseResponseModel, relationshipLabelByURI: { [id: string] : string }): FormItem[];
  getSuggestions(text: string): Observable<SuggestionEntry[]>;
  updateRelationship(control: FormItem, suggestion: SuggestionEntry): Observable<unknown>;
  removeRelationship(control: FormItem): Observable<unknown>;
}
