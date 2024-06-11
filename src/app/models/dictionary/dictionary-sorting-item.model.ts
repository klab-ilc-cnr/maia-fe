export interface DictionarySortingItem {
    /**Identifier */
    id: string;
    /**Item type @example 'lexicalEntry'||'sense' */
    type: string;
    /**List of string to be visualized before the label @example semantic marks */
    prefix: string[];
    /**Visualized label */
    label: string;
    /**List of string to be visualized after the label @example pos */
    suffix: string[];
    children?: DictionarySortingItem[];
}
