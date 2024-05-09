import { searchModeEnum } from "../lexicon/lexical-entry-request.model";

export interface LexicogEntriesRequest {
    text: string;
    searchMode: searchModeEnum;
    pos: string;
    author: string;
    lang: string;
    status: string;
    offset: number;
    limit: number;
}
