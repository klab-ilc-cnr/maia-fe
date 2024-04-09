import { LexicalEntityResponseBase } from "../lexicon/lexical-entry-request.model";
import { LexicogEntryListItem } from "./lexicog-entry-list-item.model";

export interface LexicogEntriesResponse extends LexicalEntityResponseBase {
    /**List of lexicog entries retrieved */
    list: LexicogEntryListItem[];
}
