interface LexiconUpdater {
  value: string;
}

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

export enum LEXICAL_ENTRY_RELATIONS {
  LABEL = 'label',
  TYPE = 'type',
  LANGUAGE = 'language',
  STATUS = 'status',
  NOTE = 'note'
}

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

export enum LINGUISTIC_RELATIONS {
  MORPHOLOGY = 'morphology',
  DECOMP = 'decomp',
  CONCEPT_REF = 'conceptRef',
  LEXICAL_REL = 'lexicalRel',
  SENSE_REL = 'senseRel',
  CONCEPT_REL = 'conceptRel',
  ETY_LINK = 'etyLink'
}

export interface FormUpdater extends LexiconUpdater {
  relation: FORM_RELATIONS
}

export interface LexicalEntryUpdater extends LexiconUpdater {
  relation: LEXICAL_ENTRY_RELATIONS;
}

export interface LexicalSenseUpdater extends LexiconUpdater {
  relation: LEXICAL_SENSE_RELATIONS
}

export interface LinguisticRelationUpdater extends LexiconUpdater {
  type: LINGUISTIC_RELATIONS,
  relation: string,
  currentValue: string
}
