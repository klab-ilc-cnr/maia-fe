/**Interfaccia di base dell'updater di Lexicon */
interface LexiconUpdaterBase {
  /**Valore di aggiornamento */
  value: string;
}

/**Enumerazione delle relazioni per forma */
export enum FORM_RELATIONS {
  TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  NOTE = 'http://www.w3.org/2004/02/skos/core#note',
  WRITTEN_REP = 'http://www.w3.org/ns/lemon/ontolex#writtenRep',
  PHONETIC_REP = 'http://www.w3.org/ns/lemon/ontolex#phoneticRep',
  PRONUNCIATION = 'http://www.lexinfo.net/ontology/3.0/lexinfo#pronunciation',
  ROMANIZATION = 'http://www.lexinfo.net/ontology/3.0/lexinfo#romanization',
  SEGMENTATION = 'http://www.lexinfo.net/ontology/3.0/lexinfo#segmentation',
  TRANSLITERATION = 'http://www.lexinfo.net/ontology/3.0/lexinfo#transliteration',
  CONFIDENCE = "http://www.lexinfo.net/ontology/3.0/lexinfo#confidence"
}

export enum GENERIC_RELATION_TYPE {
  REFERENCE = 'reference',
  BIBLIOGRAPHY = 'bibliography',
  ATTESTATION = 'attestation',
  MULTIMEDIA = 'multimedia',
  METADATA = 'metadata',
}

export enum GENERIC_RELATIONS {
  SEEALSO = 'http://www.w3.org/2000/01/rdf-schema#seeAlso',
  SAMEAS = 'http://www.w3.org/2002/07/owl#sameAs',
  COMMENT = 'http://www.w3.org/2000/01/rdf-schema#comment',
  DESCRIPTION = 'http://purl.org/dc/terms/description',
  EXAMPLE = 'http://www.lexinfo.net/ontology/3.0/lexinfo#example',
  CONFIDENCE = 'http://www.lexinfo.net/ontology/3.0/lexinfo#confidence',
}

/**Enumerazione delle relazioni per entrata lessicale */
export enum LEXICAL_ENTRY_RELATIONS {
  LABEL = "http://www.w3.org/2000/01/rdf-schema#label",
  TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  TERM_STATUS = "http://www.w3.org/2003/06/sw-vocab-status/ns#term_status",
  NOTE = "http://www.w3.org/2004/02/skos/core#note",
  ENTRY = "http://www.w3.org/ns/lemon/lime#entry", //LANGUAGE anche se si chiama entry
  DENOTES = "http://www.w3.org/ns/lemon/ontolex#denotes",
  CONFIDENCE = "http://www.lexinfo.net/ontology/3.0/lexinfo#confidence"
}

/**Enumerazione delle relazioni per senso lessicale */
export enum LEXICAL_SENSE_RELATIONS {
  NOTE = 'http://www.w3.org/2004/02/skos/core#note',
  USAGE = 'http://www.w3.org/ns/lemon/ontolex#usage',
  REFERENCE = 'http://www.w3.org/ns/lemon/ontolex#reference',
  SUBJECT = 'http://purl.org/dc/terms/subject',
  DEFINITION = 'http://www.w3.org/2004/02/skos/core#definition',
  DESCRIPTION = 'http://www.lexinfo.net/ontology/3.0/lexinfo#description',
  EXPLANATION = 'http://www.lexinfo.net/ontology/3.0/lexinfo#explanation',
  GLOSS = 'http://www.lexinfo.net/ontology/3.0/lexinfo#gloss',
  SENSE_EXAMPLE = 'http://www.lexinfo.net/ontology/3.0/lexinfo#senseExample',
  SENSE_TRANSLATION = 'http://www.lexinfo.net/ontology/3.0/lexinfo#senseTranslation',
  CONFIDENCE = 'http://www.lexinfo.net/ontology/3.0/lexinfo#confidence'
}

/**Enumerazione per le relazioni linguistiche */
export enum LINGUISTIC_RELATION_TYPE {
  MORPHOLOGY = 'morphology',
  DECOMP = 'decomp',
  CONCEPT_REF = 'conceptRef',
  LEXICAL_REL = 'lexicalRel',
  LEXICOSEMANTIC_REL = 'LexicosemanticRel',
  SENSE_REL = 'senseRel',
  CONCEPT_REL = 'conceptRel',
  ETY_LINK = 'etyLink',
  LEXICON = 'lexicon'
}

/**Interfaccia dell'updater per forma */
export interface FormUpdater extends LexiconUpdaterBase {
  /**Relazione da aggiornare */
  relation: FORM_RELATIONS
}

export interface GenericRelationUpdater extends LexiconUpdaterBase {
  type: GENERIC_RELATION_TYPE,
  relation: GENERIC_RELATIONS,
  currentValue: string,
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
  type: LINGUISTIC_RELATION_TYPE,
  /**Proprietà da aggiornare */
  relation: string,
  /**Precedente valore da sostituire */
  currentValue: string
}
