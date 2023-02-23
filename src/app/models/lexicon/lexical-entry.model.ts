//TODO verificare, sembra non esserci corrispondenza con i dati poi lavorati
/**Classe che rappresenta un'entrata lessicale */
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



/**Enum delle tipologie di entrata lesscale */
export enum LexicalEntryType {
  LEXICAL_ENTRY,
  FORM,
  SENSE,
  FORMS_ROOT,
  SENSES_ROOT
}