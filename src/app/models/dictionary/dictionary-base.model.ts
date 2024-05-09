export interface DictionaryBase {
    /**Identifier */
    id: string;
    /**Creator username */
    creator: string;
    lastUpdate: string;
    creationDate: string;
    type: string[];
    label: string;
    pos: string[];
    status: string;
    hasChildren: boolean;
}
