
export class LinguisticRelationModel {
  entity: string | undefined;
  label: string | undefined;
  entityType: string[] | undefined; //NOTE test di modifica
  // entityType: LexicalEntryType[] | undefined;
  inferred: boolean | undefined;
  linkType: string | undefined;
  link: string | undefined;
}
