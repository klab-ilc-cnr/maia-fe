import { LexicogEntryCore } from "./lexicog-entry-core.model";

export interface LexicogListResponse {
    /**Total number of results */
    totalHits: number;
    /**List of lexicog entries retrieved */
    list: LexicogEntryCore[];
}
