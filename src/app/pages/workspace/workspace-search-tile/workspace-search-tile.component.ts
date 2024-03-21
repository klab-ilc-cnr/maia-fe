import { Component, OnInit, ViewChild } from '@angular/core';
import { FilterMetadata, MenuItem, TreeNode } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, Subject, debounceTime, of, switchMap, throttleTime } from 'rxjs';
import { ElementType } from 'src/app/models/corpus/element-type';
import { SearchRequest } from 'src/app/models/search/search-request';
import { SearchResult, SearchResultRow } from 'src/app/models/search/search-result';
import { CorpusElement, FolderElement } from 'src/app/models/texto/corpus-element';
import { CommonService } from 'src/app/services/common.service';
import { CorpusStateService } from 'src/app/services/corpus-state.service';
import { LoaderService } from 'src/app/services/loader.service';
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
    private commonService: CommonService,
    private loaderService: LoaderService) { }

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
  files$!: Observable<TreeNode<CorpusElement>[]>;
  selectedDocuments: TreeNode<CorpusElement>[] = [];

  //**kwic table data */
  searchResults: Array<SearchResultRow> = [];
  searchRequest = new SearchRequest();
  selectedSearchResults: Array<SearchResultRow> = [];
  loading: boolean = false;
  selectAll: boolean = false;
  tableContainerHeight!: number;
  tableHeaderHegith: number = 265;
  totalRecords: number = 0;
  visibleRows: number = 10;
  tableCleared = false;
  changingPage = false;

  /**export button items */
  exportItems!: MenuItem[];

  @ViewChild('searchInput') searchInput: any;
  @ViewChild('dt') searchResultsTable!: Table;

  private filtersSubject: Subject<any> = new Subject();

  ngOnInit(): void {
    this.files$ = this.corpusStateService.filesystem$.pipe(
      switchMap(docs => of(this.mapToTreeNodes(docs))),
    );

    this.initSearchMode();

    this.filtersSubject.pipe(debounceTime(1000))
      .subscribe((event) =>
        this.lazyLoadSearchResultsDebounced(event)
      );

    this.setExportMenuItems();
  }

  //**init for export menu button */
  setExportMenuItems() {
    this.exportItems = [
      {
        label: this.commonService.translateKey('SEARCH.exportAll'), command: () => {
          this.exportAll();
        }
      },
      {
        label: this.commonService.translateKey('SEARCH.exportSelected'), command: () => {
          this.exportSelected();
        },
        disabled: this.selectedSearchResults.length === 0
      }
    ];
  }

  isAnyRowSelected(): boolean {
    return this.selectedSearchResults.length === 0;
  }

  /**manages double click on a table row */
  tableRowDoubleClickHandler(event: any, rowNode: any) {
    this.commonService.notifyOther({ option: 'onSearchResultTableDoubleClickEvent', value: [rowNode] });
  }

  /** exports all the rows */
  exportAll() {
    this.loaderService.show();

    this.searchService.exportAll().subscribe({
      next: (document) => {
        this.loaderService.hide();
        (window as any)["saveAs"](
          document,
          `${this.commonService.translateKey('SEARCH.exportAllFileName')}.xlsx`
        );
      },
      error: (error) => {
        this.loaderService.hide();
      },
    });
  }

  /**exports only the selected rows */
  exportSelected() {
    if (!this.selectedSearchResults) { return; }

    this.searchService.exportSelected(this.selectedSearchResults.map(e => e.id)).subscribe({
      next: (document) => {
        this.loaderService.hide();
        (window as any)["saveAs"](
          document,
          `${this.commonService.translateKey('SEARCH.exportSelectedFileName')}.xlsx`
        );
      },
      error: (error) => {
        this.loaderService.hide();
      },
    });
  }

  /**handler for page change */
  onPage(event: any) {
    this.changingPage = true;
  }

  /**debouce the search on filters input */
  lazyLoadSearchResults(event: any) {
    if (this.changingPage) {
      this.changingPage = false;
      this.searchRequest.start = event.first;
      this.searchRequest.end = event.first + event.rows;
      this.lazyLoadSearchResultsDebounced(event);
      return;
    }

    this.filtersSubject.next(event);
  }

  //**executs the lazy load */
  lazyLoadSearchResultsDebounced(event: any) {
    if (this.tableCleared) {
      this.tableCleared = false;
      return;
    }

    this.setColumnFilters();
    this.search();
  }

  /**set the request filters based on the table ones */
  setColumnFilters() {
    this.searchRequest.filters.index = (<FilterMetadata>(this.searchResultsTable.filters['index']))?.value;
    this.searchRequest.filters.kwic = (<FilterMetadata>(this.searchResultsTable.filters['kwic']))?.value;
    this.searchRequest.filters.leftContext = (<FilterMetadata>(this.searchResultsTable.filters['leftContext']))?.value;
    this.searchRequest.filters.rightContext = (<FilterMetadata>(this.searchResultsTable.filters['rightContext']))?.value;
    this.searchRequest.filters.text = (<FilterMetadata>(this.searchResultsTable.filters['text']))?.value;
    this.searchRequest.filters.textHeader = (<FilterMetadata>(this.searchResultsTable.filters['textHeader']))?.value;
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
    this.searchRequest.start = 0;
    this.searchRequest.end = this.visibleRows;
    this.searchRequest.selectedResourcesIds = this.mapSelectedDocumentsIds();
    this.searchRequest.filters.searchMode = this.selectedSearchMode.code;
    this.searchRequest.filters.searchValue = this.searchValue?.trim();;
    this.searchRequest.filters.contextLength = this.contextLength;
    this.clearTable();
    this.setColumnFilters();

    this.search();
  }

  /**validate inputs and start the search */
  search() {
    this.searchInput.control.markAsTouched();

    if (!this.searchRequest.filters.searchValue) {
      return;
    }

    this.loading = true;

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

  /**clears table and prevent triggering lazy loading multiple times */
  clearTable() {
    this.searchResultsTable.clear();
    this.tableCleared = true;
  }

  /**reset table and prevent triggering lazy loading */
  resetTable() {
    this.searchResultsTable.reset();
    this.tableCleared = true;
  }

  /**clear function results and data */
  onClear() {
    this.searchRequest = new SearchRequest();
    this.searchResults = [];
    this.totalRecords = 0;
    this.selectedSearchResults = [];
    this.selectedDocuments = [];
    this.searchValue = '';
    this.selectedSearchMode = this.searchModes[0];
    this.contextLength = this.contextLenghtDefaultValue;
    this.resetTable();
    this.updateTableHeight();
  }

  /**update the table heigth */
  updateTableHeight() {
    this.tableContainerHeight = this.currentPanelHeight - this.tableHeaderHegith;
  }

  /**used for casting table filters of type input */
  toHtmlInputElement(target: EventTarget | null): HTMLInputElement {
    this.searchInput.control.markAsTouched();
    return target as HTMLInputElement;
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
