//TODO verificare, sembra non esserci corrispondenza con i dati poi lavorati
/**Classe che rappresenta un'entrata lessicale */
export class LexicalEntryOld {
  name?: string
  instanceName?: string
  label?: string
  note?: string
  creator?: string
  creationDate?: string
  lastUpdate?: string
  status?: string
  type?: LexicalEntryTypeOld
  uri?: string
  sub?: string
  isCanonical?: boolean
  isDescribedByLexicographicComponent?: boolean
}

export interface LexicalElementBase {
  /**Utente che ha creato l'elemento */
  creator: string,
  lastUpdate: string,
  creationDate: string,
  confidence: string,
  images?: string[]
}

export interface LexoLanguage extends LexicalElementBase {
  language: string,
  label: string,
  lexvo: string,
  catalog: string[],
  description: string,
  entries: number
}

export interface MorphologyProperty {
  trait: string,
  value: string
}

export interface LinkElement {
  label: string,
  count: number,
  hasChildren: boolean
}

export interface LinkProperty {
  type: string,
  elements: LinkElement[]
}

export interface LexicalEntryListItem extends LexicalElementBase {
  status: string,
  revisor: string,
  type: LexicalEntryType[],
  pos: string,
  label: string,
  language: string,
  /**Utente che messo in stato completato */
  author: string,
  note: string,
  hasChildren: boolean,
  isDescribedByLexicographicComponent: boolean,
  lexicalEntry: string,
  morphology: MorphologyProperty[],
  completionDate: string,
  revisionDate: string,
}

export interface LexicalEntryCore extends LexicalEntryListItem {
  links: LinkProperty[],
  stemType: string,
}

export interface PropertyElement {
  propertyID: string,
  propertyValue: string
}

export interface FormListItem extends LexicalElementBase {
  type: string,
  label: string,
  note: string,
  phoneticRep: string,
  lexicalEntry: string,
  morphology: MorphologyProperty[],
  form: string,
  // targetSense: string
}

export interface FormCore extends LexicalElementBase {
  note: string,
  phoneticRep: string,
  lexicalEntry: string,
  morphology: MorphologyProperty[],
  form: string,
  lexicalEntryLabel: string,
  label: PropertyElement[],
  language: string,
  type: string,
  inheritedMorphology: MorphologyProperty[],
  links: LinkProperty[]
}

export interface SenseListItem extends LexicalElementBase {
  sense: string,
  lexicalEntry: string,
  pos: string,
  lemma: string,
  hasChildren: false,
  label: string,
  definition: string,
  note: string,
  usage: string,
  concept: string,
  description: string,
  gloss: string,
  senseExample: string,
  senseTranslation: string
}

export interface SenseCore extends LexicalElementBase {
  concept: string;
  definition: PropertyElement[];
  description: string | null;
  explanation: string | null;
  gloss: string | null;
  links: LinkProperty[];
  note: string;
  sense: string;
  senseExample: string | null;
  senseTranslation: string | null;
  topic: string;
  usage: string;
}

export enum LexicalEntryType {
  LEXICAL_ENTRY = "LexicalEntry",
  AFFIX = "Affix",
  MULTI_WORD_EXPRESSION = "MultiWordExpression",
  WORD = "Word"
}

/**Enum delle tipologie di entrata lesscale */
export enum LexicalEntryTypeOld {
  LEXICAL_ENTRY,
  FORM,
  SENSE,
  FORMS_ROOT,
  SENSES_ROOT
}
