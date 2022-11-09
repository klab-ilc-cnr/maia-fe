export class LexicalEntry {
    name?: string
    instanceName?: string
    label?: string
    creator?: string
    creationDate?: string
    lastUpdate?: string
    status?: string
    type?: LexicalEntryType
    uri?: string
}




export enum LexicalEntryType {
  LEXICAL_ENTRY,
  FORM,
  SENSE,
  FORMS_ROOT,
  SENSES_ROOT
}