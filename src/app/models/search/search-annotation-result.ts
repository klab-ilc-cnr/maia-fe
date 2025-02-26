/**Model of a search annotation result */
export class SearchAnnotationResult {
    /**number of total elements */
    count!:number;
    /**row results*/
    data!:Array<SearchAnnotationResultRow>;
}

/**Model of a search annotation result row */
export class SearchAnnotationResultRow {
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
    /**annotation label */
    annotation!: string;
    /**absolute annotation text offset */
    annotationOffset!: number;
}