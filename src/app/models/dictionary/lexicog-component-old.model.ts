import { STATUSES } from "../lexicon/lexical-entry-request.model";
import { LexicogEntryBase } from "./lexicog-entry-base.model";

export interface _LexicogComponent extends LexicogEntryBase {
    component: string;
    position: number;
    /**Entity described by component
     * @example "http://lexica/mylexicon#sakarater_verb_osc_entry"
     */
    referredEntity: string;
    referredEntityType: string[];
    referredEntityLabel: string;
    pos: string;
    status: STATUSES;
    revisor: string;
    author: string;
    note: string;
    hasChildren: boolean;
    completionDate: string;
    revisionDate: string;
}
