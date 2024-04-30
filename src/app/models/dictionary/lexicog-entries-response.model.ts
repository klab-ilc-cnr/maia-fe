import { LexicalEntityResponseBase } from "../lexicon/lexical-entry-request.model";
import { DictionaryListItem } from "./dictionary-list-item.model";

export interface LexicogEntriesResponse extends LexicalEntityResponseBase {
    /**List of lexicog entries retrieved */
    list: DictionaryListItem[];
}
