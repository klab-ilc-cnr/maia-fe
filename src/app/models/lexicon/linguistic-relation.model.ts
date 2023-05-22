import { LexicalEntryType } from "./lexical-entry.model";

export class LinguisticRelationModel {
  entity: string | undefined;
  label: string | undefined;
  entityType: LexicalEntryType[] | undefined;
  inferred: boolean | undefined;
  linkType: string | undefined;
  link: string | undefined;
}
