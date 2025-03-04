/**Model of a search annotation result */
export class SearchAnnotationResult {
    /**number of total elements */
    count!: number;
    /**row results*/
    data!: Array<SearchAnnotationResultRow>;
    first?: number;
    rows?: number;
}

export class SearchAnnotationOffset {
    start!: number;
    end!: number;
}

/**Model of a search annotation result row */
export class SearchAnnotationResultRow {
    /**index of the search result */
    index!: number;
    /**the index of the row in the text body*/
    rowIndex!: number;
    /**text id */
    textId!: number;
    /**text name */
    text!: string;
    /**the corpus index */
    reference: string = '';
    /**section text */
    section: string = '';
    offsets: SearchAnnotationOffset[] = [];
}