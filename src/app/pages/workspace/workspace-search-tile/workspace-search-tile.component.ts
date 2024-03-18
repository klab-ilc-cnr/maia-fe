import { Component, OnInit, ViewChild } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, of, switchMap } from 'rxjs';
import { ElementType } from 'src/app/models/corpus/element-type';
import { SearchRequest } from 'src/app/models/search/search-request';
import { SearchResult, SearchResultRow } from 'src/app/models/search/search-result';
import { CorpusElement, FolderElement } from 'src/app/models/texto/corpus-element';
import { CommonService } from 'src/app/services/common.service';
import { CorpusStateService } from 'src/app/services/corpus-state.service';
import { SearchService } from 'src/app/services/search.service';

/**selectButton model for search mode*/
interface SearchMode {
  name: string,
  code: string
  inactive: boolean
}

@Component({
  selector: 'app-workspace-search-tile',
  templateUrl: './workspace-search-tile.component.html',
  styleUrls: ['./workspace-search-tile.component.scss']
})
export class WorkspaceSearchTileComponent implements OnInit {

  constructor(private corpusStateService: CorpusStateService,
    private searchService: SearchService,
    private commonService: CommonService) { }

  /**initial panel size */
  currentPanelHeight: number = 500;

  /**search data parameters */
  searchValue: string = '';
  searchModes!: Array<SearchMode>;
  selectedSearchMode!: SearchMode;
  searchLabel: string = '';
  contextLenghtDefaultValue = 5;
  contextLength: number = this.contextLenghtDefaultValue;
  contextMaxLenght: number = 10;
  files!: TreeNode<CorpusElement>[];
  selectedDocuments: TreeNode<CorpusElement>[] = [];

  //**kwic table data */
  searchResults: Array<SearchResultRow> = [];
  searchRequest = new SearchRequest();
  selectedSearchResults: Array<SearchResultRow> = [];
  loading: boolean = false;
  selectAll: boolean = false;
  tableContainerHeight: number = window.innerHeight / 2;
  tableHeaderHegith: number = 265;
  totalRecords: number = 0;
  visibleRows: number = 10;
  tableCleared = false;

  @ViewChild('searchInput') searchInput: any;
  @ViewChild('dt') searchResultsTable!: Table;

  ngOnInit(): void {
    this.corpusStateService.filesystem$.pipe(
      switchMap(docs => of(this.mapToTreeNodes(docs))),
    ).subscribe(result => {
      this.files = result;
    });

    this.initSearchMode();
  }

  loadSearchResults(event: any) {
    if (this.tableCleared) {
      return;
    }

    this.loading = true;
    setTimeout(() => {//FIXME eliminare quando ci sarà il backend
      this.searchRequest.start = event.first;
      this.searchRequest.end = event.first + event.rows;
      this.searchService.search(this.searchRequest).subscribe(result => {
        // this.searchResults = result.data; //FIXME ripristinare quando ci sarà il backend
        this.searchResults = result.data.slice(this.searchRequest.start, (this.searchRequest.start + this.searchRequest.end)); //FIXME eliminare quando ci sarà il backend
        this.totalRecords = result.totalRecords;
      })
      this.loading = false;
    }, 1000);
  }

  /**
 * Updates the height of the content of the panel
 * @param newHeight {any} newHeight
 */
  updateHeight(newHeight: number) {
    this.currentPanelHeight = newHeight;
    this.tableContainerHeight = newHeight - this.tableHeaderHegith;
  }

  /**search mode handler */
  onSearchModeChange() {
    if (this.selectedSearchMode.code === 'form') {
      this.searchLabel = this.commonService.translateKey('SEARCH.insertForm');
      return;
    }

    this.searchLabel = this.commonService.translateKey('SEARCH.insertLemma');
  }

  /**prepare data and send search request */
  onSearch() {
    this.searchInput.control.markAsTouched();
    const searchValue = this.searchValue?.trim();

    if (!searchValue) {
      return;
    }

    this.loading = true;

    this.tableCleared = false;
    this.searchRequest.start = 0;
    this.searchRequest.end = this.visibleRows;
    this.searchRequest.selectedResourcesIds = this.mapSelectedDocumentsIds();
    this.searchRequest.searchMode = this.selectedSearchMode.code;
    this.searchRequest.searchValue = searchValue;
    this.searchRequest.contextLength = this.contextLength;
    this.searchResultsTable.clear();

    setTimeout(() => {//FIXME eliminare quando ci sarà il backend
      this.searchService.search(this.searchRequest).subscribe(result => {
        // this.searchResults = result.data; //FIXME ripristinare quando ci sarà il backend
        this.searchResults = result.data.slice(this.searchRequest.start, (this.searchRequest.start + this.searchRequest.end)); //FIXME eliminare quando ci sarà il backend
        this.loading = false;
        this.totalRecords = result.totalRecords;
        this.updateTableHeight();
      });
    }, 1000);
  }

  /**clear function results and data */
  onClear() {
    this.searchRequest = new SearchRequest();
    this.searchResults = [];
    this.totalRecords = 0;
    this.tableCleared = true;
    this.selectedSearchResults = [];
    this.selectedDocuments = [];
    this.searchValue = '';
    this.selectedSearchMode = this.searchModes[0];
    this.contextLength = this.contextLenghtDefaultValue;
    this.searchResultsTable.reset();
    this.updateTableHeight();
  }

  /**update the table heigth */
  updateTableHeight() {
    this.tableContainerHeight = this.currentPanelHeight - this.tableHeaderHegith;
  }

  /**init searchMode data */
  private initSearchMode() {
    this.searchModes = [
      { name: this.commonService.translateKey('SEARCH.form'), code: 'form', inactive: false },
      { name: this.commonService.translateKey('SEARCH.lemma'), code: 'lemma', inactive: true },
    ];

    this.selectedSearchMode = this.searchModes[0];
    this.onSearchModeChange();
  }

  /**extract only ids of the files from the document tree */
  private mapSelectedDocumentsIds(): Array<Number> {
    return this.selectedDocuments.filter(selectedNode => selectedNode.leaf).map(leaf => leaf.data?.id!);
  }

  /**
   *refresh documents data  
   */
  reloadSelectedDocuments(): void {
    this.corpusStateService.refreshFileSystem.next(null);
  }

  /**
   * mapper to the treenode element
   */
  private mapToTreeNodes(elements: CorpusElement[]): TreeNode<CorpusElement>[] {
    const result: TreeNode<CorpusElement>[] = [];
    elements.forEach(element => {
      result.push(this.mapToTreeNode(element));
    });
    return result;
  }

  private mapToTreeNode(element: CorpusElement): TreeNode<CorpusElement> {
    const node: TreeNode<CorpusElement> = {};
    if ('children' in element) {
      node.key = element.id.toString();
      const e = <FolderElement>element;
      node.children = this.mapToTreeNodes(e.children);
      node.expandedIcon = "pi pi-folder-open";
      node.collapsedIcon = "pi pi-folder";
    }
    if (element.type === ElementType.RESOURCE) {
      node.key = element.id.toString();
      node.icon = "pi pi-file";
      node.leaf = true;
    }
    node.label = element.name;
    node.data = element;
    return node;
  }

}
