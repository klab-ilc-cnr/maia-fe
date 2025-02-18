import { Component, ElementRef, EventEmitter, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FilterMetadata, MenuItem, TreeNode } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, Subject, debounceTime, of, switchMap, takeUntil } from 'rxjs';
import { ElementType } from 'src/app/models/corpus/element-type';
import { SearchRequest } from 'src/app/models/search/search-request';
import { SearchResultRow } from 'src/app/models/search/search-result';
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
  styleUrls: ['./workspace-search-tile.component.scss'],
  providers: [CorpusStateService]
})
export class WorkspaceSearchTileComponent implements OnInit {

  constructor(private corpusStateService: CorpusStateService,
    private searchService: SearchService,
    private commonService: CommonService,
    private renderer: Renderer2,
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
  tableContainerHeight!: number;
  tableHeaderHegith: number = 250;
  totalRecords: number = 0;
  visibleRows: number = 10;
  tableCleared = false;
  changingPage = false;
  filtersChanged = false;

  colDefaultWidths = [4, 6, 15, 15, 25, 10, 25];

  /** object used to memorize primeng table data */
  pTabelColumnWidthStates: any;


  /** Delta for correct resizing internal search result table */
  nativeTableDelta = 57;

  /**export button items */
  exportItems!: MenuItem[];

  @ViewChild('searchInput') searchInput: any;
  @ViewChild('dt') searchResultsTable!: Table;

  private filtersSubject: Subject<any> = new Subject();
  private readonly unsubscribe$ = new Subject<void>();

  ngOnInit(): void {
    this.files$ = this.corpusStateService.filesystem$.pipe(
      switchMap(docs => of(this.mapToTreeNodes(docs))),
      takeUntil(this.unsubscribe$)
    );

    this.initSearchMode();

    this.filtersSubject.pipe(debounceTime(1000), takeUntil(this.unsubscribe$))
      .subscribe({
        next: (event) => {
          this.lazyLoadSearchResultsDebounced(event);
        },
        error: (error) => {
          this.commonService.throwHttpErrorAndMessage(error, error.error.message);
        }
      });

    this.setExportMenuItems();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    this.filtersSubject.complete();

    this.pTabelColumnWidthStates = null;
    this.selectedSearchResults = [];
    this.searchResults = [];
    this.searchRequest = null!;
    this.selectedDocuments = [];
  }

  ngAfterViewInit(): void {
    this.pTabelColumnWidthStates = { columnWidths: '' }
    this.searchResultsTable.saveColumnWidths(this.pTabelColumnWidthStates);
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
        this.commonService.throwHttpErrorAndMessage(error, error.error.message);
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
        this.commonService.throwHttpErrorAndMessage(error, error.error.message);
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

  filterInputColumn(target: EventTarget | null, fieldName: string, matchMode: string) {
    if (target == null) { return; }

    const input = target as HTMLInputElement;
    this.filtersChanged = true;
    this.searchInput.control.markAsTouched();
    this.searchResultsTable.filter(input.value, fieldName, matchMode);
  }

  /**set the request filters based on the table ones */
  setColumnFilters() {
    this.searchRequest.filters.index = (<FilterMetadata>(this.searchResultsTable.filters['index']))?.value;
    this.searchRequest.filters.kwic = (<FilterMetadata>(this.searchResultsTable.filters['kwic']))?.value;
    this.searchRequest.filters.leftContext = (<FilterMetadata>(this.searchResultsTable.filters['leftContext']))?.value;
    this.searchRequest.filters.rightContext = (<FilterMetadata>(this.searchResultsTable.filters['rightContext']))?.value;
    this.searchRequest.filters.text = (<FilterMetadata>(this.searchResultsTable.filters['text']))?.value;
    this.searchRequest.filters.reference = (<FilterMetadata>(this.searchResultsTable.filters['textHeader']))?.value;
  }

  /**
 * Updates the height of the content of the panel
 * @param newHeight {any} newHeight
 */
  updateHeight(newHeight: number, newWidth: number) {
    this.currentPanelHeight = newHeight;
    this.tableContainerHeight = newHeight - this.tableHeaderHegith;
    this.setResizeTableWidth((newWidth - this.nativeTableDelta) + 'px')
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
    this.searchRequest.resources = this.mapSelectedDocumentsIds();
    this.searchRequest.filters.searchMode = this.selectedSearchMode.code;
    this.searchRequest.filters.searchValue = this.searchValue?.trim();
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

    if (this.filtersChanged) {
      this.searchRequest.start = 0;
      this.searchRequest.end = this.visibleRows;
    }

    this.searchService.search(this.searchRequest).subscribe({
      next: (result) => {
        this.searchResults = result.data;
        this.searchResults.forEach(res => res.id ? res.id : res.id = `id_${res.index}`);
        this.loading = false;
        this.totalRecords = result.count;
        this.updateTableHeight();
      },
      error: (error) => {
        this.loading = false;
        this.commonService.throwHttpErrorAndMessage(error, error.error.message);
      }
    });
  }

  setResizeTableWidth(width: string): void {
    const tableElement = this.searchResultsTable?.tableViewChild?.nativeElement;
    if (tableElement) {
      this.renderer.setStyle(tableElement, 'width', width);
      this.renderer.setStyle(tableElement, 'minWidth', '100%');
    }
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
    this.searchResultsTable.columnWidthsState = this.pTabelColumnWidthStates.columnWidths;
    this.setResizeTableWidth(this.pTabelColumnWidthStates.tableWidth);
    this.searchResultsTable.restoreColumnWidths();
  }

  onColResize(event: any) {
    const tableElement = this.searchResultsTable?.tableViewChild?.nativeElement;
    if (tableElement) {
      this.renderer.setStyle(tableElement, 'minWidth', '100%');
    }
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
  private mapSelectedDocumentsIds(): Array<number> {
    return this.selectedDocuments.filter(selectedNode => selectedNode.leaf).map(leaf => leaf.data?.id!);
  }

  /**
   *refresh documents data  
   */
  reloadSelectedDocuments(): void {
    this.corpusStateService.refreshFileSystem.next();
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
