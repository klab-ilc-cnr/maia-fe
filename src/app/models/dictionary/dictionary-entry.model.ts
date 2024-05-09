import { DictionaryBase } from "./dictionary-base.model";
import { DictionaryListItem } from "./dictionary-list-item.model";

export interface DictionaryEntry extends DictionaryBase, DictionaryListItem {
    confidence: number;
    revisor: string;
    author: string;
    completionDate: string;
    revisionDate: string;
    images: string[];
    note: string[];
    /**List of entities (dictionary entries) to which it is linked by a type relationship see also */
    seeAlso: any[]; //TODO sostituire con il modello dati corretto
}
