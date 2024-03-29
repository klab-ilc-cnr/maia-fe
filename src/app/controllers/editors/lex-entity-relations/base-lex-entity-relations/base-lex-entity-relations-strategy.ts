import { Observable } from "rxjs";
import { FormItem } from "./base-lex-entity-relations.component";
import { LexicalEntityRelationsResponseModel } from "src/app/models/lexicon/lexical-sense-response.model";

export type SuggestionEntry = {
  relationshipLabel: string,
  relationshipURI: string,
};

export interface BaseLexEntityRelationsStrategy {
  populateRelationships(model: LexicalEntityRelationsResponseModel, relationshipLabelByURI: { [id: string] : string }): FormItem[];
  getSuggestions(text: string): Observable<SuggestionEntry[]>;
  createRelationship(relationshipURI: string): Observable<string>;
  updateRelationship(control: FormItem, suggestion: SuggestionEntry): Observable<unknown>;
  removeRelationship(control: FormItem): Observable<unknown>;
}
