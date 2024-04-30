import { DictionaryBase } from "./dictionary-base.model";

export interface LexicographicComponent extends DictionaryBase {
    confidence: number;
    /**Position in the ordered list of components of an entity */
    position: number;
    /**Identifier of the entity to which it points */
    referredEntity: string;
    revisor: string;
    author: string;
    note: string[];
    completionDate: string;
    revisionDate: string;
}
