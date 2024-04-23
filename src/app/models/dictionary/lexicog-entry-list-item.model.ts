import { LexicogEntryBase } from "./lexicog-entry-base.model";

/**Interface of features of a dictionary entry in the list version */
export interface LexicogEntryListItem extends LexicogEntryBase {
    status: string;
    revisor: string;
    pos: string;
    language: string;
    author: string;
    note: string;
    hasChildren: boolean;
    dictionaryEntry: string;
    completionDate: string;
    revisionDate: string;
    images: string[];
}
