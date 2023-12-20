import { LinguisticRelationModel } from "./linguistic-relation.model";

export type IndirectRelationModel = {
  category: string;
  relation: string;
  target: string;
  targetLabel: string;
  properties: LinguisticRelationModel[];
}

export type LexicalEntityRelationsResponseModel = {
  directRelations: LinguisticRelationModel[];
  indirectRelations: IndirectRelationModel[];
}
