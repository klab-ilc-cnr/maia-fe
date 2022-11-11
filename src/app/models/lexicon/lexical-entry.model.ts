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
  LEXICAL_ENTRY = "LEXICAL_ENTRY",
  FORM = "FORM",
  SENSE = "SENSE",
  FORMS_ROOT = "FORMS_ROOT",
  SENSES_ROOT = "SENSES_ROOT"
}