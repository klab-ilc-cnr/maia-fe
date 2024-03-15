/**Model of a search request */
export class SearchRequest {
    start!: number;
    end!: number;
    selectedResourcesIds : Array<Number> = [];
    searchValue!: string;
    searchMode!: string;
    contextLength!: number;
  }