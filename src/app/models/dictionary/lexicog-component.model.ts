import { LexicogListItem } from "./lexicog-list-item.model";

/**Describes a Lexicographic Component and by extension an Entry (dictionary entry) as a special case */
export interface LexicogComponent extends LexicogListItem {
    confidence: number;
    /**Position in the component list (used for sorting the lexical entries of an entry and the senses of a lexical entry) */
    position: number;
    /**Identifier of the entity linked through the component (for example, the component of an entry will point to a lexical entry) */
    referredEntity: string;
    revisor: string;
    author: string;
    note: string;
    completionDate: string;
    revisionDate: string;
}
