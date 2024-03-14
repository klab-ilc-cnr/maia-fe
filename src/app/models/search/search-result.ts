/**Model of a search result */
export class SearchResult {
    /**string id of the search result */
    id!:string;
    /**index of the search result */
    index!: number;
    /**the index of the row in the text body*/
    rowIndex!: number;
    /**text name */
    text!: string;
    /**text id */
    textId!: number;
    /**the corpus index */
    textHeader: string = '';
    /**partial text to show before */
    leftContext: string = '';
    /**partial text to show after */
    rightContext: string = '';
    /**keyword */
    kwic!: string;
}