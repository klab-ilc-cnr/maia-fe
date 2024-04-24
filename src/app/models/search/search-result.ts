/**Model of a search result */
export class SearchResult {
    /**number of total elements */
    count!:number;
    /**row results*/
    data!:Array<SearchResultRow>;
}

/**Model of a search result row */
export class SearchResultRow {
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
    reference: string = '';
    /**partial text to show before */
    leftContext: string = '';
    /**partial text to show after */
    rightContext: string = '';
    /**keyword */
    kwic!: string;
}