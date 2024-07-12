import { LexicalEntityResponseBase } from "./lexical-entry-request.model";

export interface LexicalConceptListItem {
    creator: string,
    lastUpdate: string,
    creationDate: string,
    confidence: number,
    defaultLabel: string,
    language: string,
    lexicalConcept: string,
    hasChildren: boolean,
    children: number
}

export interface LexicalConceptsResponse extends LexicalEntityResponseBase {
    list: LexicalConceptListItem[];
}