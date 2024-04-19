import { LexicogEntryBase } from "./lexicog-entry-base.model";

/**Interface of the features of a dictionary entry in the full version */
export interface LexicogEntryCore extends LexicogEntryBase {
        component: null,
        describes: {
            entity: string;
            label: string;
            entityType: string[];
            inferred: boolean;
            linkType: string;
            link: string;
        },
        orderedMemebers: string[];
        unorderedMembers: string[];
}
