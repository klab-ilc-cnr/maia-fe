/**Model of a search request */
export class SearchRequest {
    selectedResourcesIds : Array<Number> = [];
    searchValue!: string;
    searchMode!: string
  }