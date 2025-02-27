/**Model of a search annotation request */
export class SearchAnnotationRequest {
    start!: number;
    end!: number;
    resources: Array<number> = [];
    filters : SearchAnnotationFilters = new SearchAnnotationFilters();
  }
  
  export class SearchAnnotationFilters {
    /**lexicalEntryId */
    searchValue!: string;
    /**SEMANTICS */
    searchMode!: string;
  }