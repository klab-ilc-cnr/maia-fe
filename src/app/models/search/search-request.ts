/**Model of a search request */
export class SearchRequest {
  start!: number;
  end!: number;
  resources: Array<number> = [];
  filters : SearchFilters = new SearchFilters();
}

export class SearchFilters {
  /**search value text */
  searchValue!: string;
  /**form or lemma */
  searchMode!: string;
  contextLength!: number;
  index?: string;
  kwic?: string;
  leftContext?: string;
  rightContext?: string;
  text?: string;
  reference?: string;
}