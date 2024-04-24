/**Describes a dictionary entry as an item in a list and reports its basic data */
export interface LexicogListItem {
    id: string;
    creator: string;
    lastUpdate: string;
    creationDate: string;
    status: string;
    pos: string[];
    label: string;
    /**defines whether the item has children (components) */
    hasChildren: boolean;
    type: string[];
    /**defines whether it is a pointer with sameAs relationship (and thus corresponds to an empty entry) */
    isReferralItem: boolean;
}