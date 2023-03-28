/**Interfaccia di base dell'updater di Lexicon */
interface LexiconUpdaterBase {
  /**Valore di aggiornamento */
  value: string;
}

/**Enumerazione delle relazioni per forma */
export enum FORM_RELATIONS {
  TYPE = 'type',
  NOTE = 'note',
  WRITTEN_REP = 'writtenRep',
  PHONETIC_REP = 'phoneticRep',
  PRONUNCIATION = 'pronunciation',
  ROMANIZATION = 'romanization',
  SEGMENTATION = 'segmentation',
  TRANSLITERATION = 'transliteration'
}

/**Enumerazione delle relazioni per entrata lessicale */
export enum LEXICAL_ENTRY_RELATIONS {
  LABEL = 'label',
  TYPE = 'type',
  LANGUAGE = 'language',
  STATUS = 'status',
  NOTE = 'note'
}

/**Enumerazione delle relazioni per senso lessicale */
export enum LEXICAL_SENSE_RELATIONS {
  NOTE = 'note',
  USAGE = 'usage',
  REFERENCE = 'reference',
  SUBJECT = 'subject',
  DEFINITION = 'definition',
  DESCRIPTION = 'description',
  EXPLANATION = 'explanation',
  GLOSS = 'gloss',
  SENSE_EXAMPLE = 'senseExample',
  SENSE_TRANSLATION = 'senseTranslation'
}

/**Enumerazione per le relazioni linguistiche */
export enum LINGUISTIC_RELATIONS {
  MORPHOLOGY = 'morphology',
  DECOMP = 'decomp',
  CONCEPT_REF = 'conceptRef',
  LEXICAL_REL = 'lexicalRel',
  SENSE_REL = 'senseRel',
  CONCEPT_REL = 'conceptRel',
  ETY_LINK = 'etyLink'
}

/**Interfaccia dell'updater per forma */
export interface FormUpdater extends LexiconUpdaterBase {
  /**Relazione da aggiornare */
  relation: FORM_RELATIONS
}

/**Interfaccia dell'updater per entrata lessicale */
export interface LexicalEntryUpdater extends LexiconUpdaterBase {
  /**Relazione da aggiornare */
  relation: LEXICAL_ENTRY_RELATIONS;
}

/**Interfaccia dell'updater per senso lessicale */
export interface LexicalSenseUpdater extends LexiconUpdaterBase {
  /**Relazione da aggiornare */
  relation: LEXICAL_SENSE_RELATIONS
}

/**Interfaccia dell'updater per relazione linguistica */
export interface LinguisticRelationUpdater extends LexiconUpdaterBase {
  /**Tipo di relazione linguistica da aggiornare */
  type: LINGUISTIC_RELATIONS,
  /**Proprietà da aggiornare */
  relation: string,
  /**Precedente valore da sostituire */
  currentValue: string
}
