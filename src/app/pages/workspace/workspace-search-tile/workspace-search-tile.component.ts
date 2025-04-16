import { AfterViewChecked, Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FilterMetadata, MenuItem, TreeNode } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, Subject, debounceTime, of, switchMap, takeUntil, map, catchError } from 'rxjs';
import { ElementType } from 'src/app/models/corpus/element-type';
import { SearchRequest } from 'src/app/models/search/search-request';
import { SearchResultRow } from 'src/app/models/search/search-result';
import { CorpusElement, FolderElement } from 'src/app/models/texto/corpus-element';
import { TLayer } from 'src/app/models/texto/t-layer';
import { AnnotationService, WordAnnotationRequest } from 'src/app/services/annotation.service';
import { CommonService } from 'src/app/services/common.service';
import { CorpusStateService } from 'src/app/services/corpus-state.service';
import { LayerStateService } from 'src/app/services/layer-state.service';
import { LoaderService } from 'src/app/services/loader.service';
import { SearchService } from 'src/app/services/search.service';

export enum RestrictionEnum {
  none = 'none',
  annotedOnly = 'annotedOnly',
  notAnnotedOnly = 'notAnnotedOnly',
}

interface SearchMode {
  name: string,
  code: string
  inactive: boolean
}

interface Restriction {
  name: string,
  code: RestrictionEnum
}

@Component({
  selector: 'app-workspace-search-tile',
  templateUrl: './workspace-search-tile.component.html',
  styleUrls: ['./workspace-search-tile.component.scss'],
  providers: [CorpusStateService, LayerStateService]
})
export class WorkspaceSearchTileComponent implements OnInit, AfterViewChecked {

  constructor(private corpusStateService: CorpusStateService,
    private searchService: SearchService,
    private commonService: CommonService,
    private layerState: LayerStateService,
    private annotationService: AnnotationService,
    private renderer: Renderer2,
    private loaderService: LoaderService) { }

  /**initial panel size */
  currentPanelHeight: number = 0;

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
  selectedLayer?: TLayer;
  searchResultHighlightColor?: string;
  layers$: Observable<TLayer[]> = this.layerState.layers$.pipe(
    switchMap(layers => of(layers.sort((a, b) => (a.name && b.name && a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1))),
  );
  restrictionOptions = [
    { name: this.commonService.translateKey('SEARCH.restriction.none'), code: RestrictionEnum.none },
    { name: this.commonService.translateKey('SEARCH.restriction.annotedOnly'), code: RestrictionEnum.annotedOnly },
    { name: this.commonService.translateKey('SEARCH.restriction.notAnnotedOnly'), code: RestrictionEnum.notAnnotedOnly }
  ];
  selectedRestriction?: Restriction;

  //**kwic table data */
  searchResults: Array<SearchResultRow> = [];
  searchRequest = new SearchRequest();
  selectedSearchResults: Array<SearchResultRow> = [];
  loading: boolean = false;
  tableContainerHeight!: number;
  tableHeaderHegith: number = 270;
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

  /**annotate button items */
  annotateItems!: MenuItem[];

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

  ngAfterViewChecked() {
    this.currentPanelHeight = document.getElementById("searchTile")!.clientHeight;

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

  showAnnotationTile(event: any) {

  }

  //**init for annotate menu button */
  setAnnotateMenuItems() {
    this.annotateItems = [
      {
        label: this.commonService.translateKey('SEARCH.buttons.removeAnnotations'), command: () => {
          this.showRemoveAnnotationTile();
        }
      }
    ];
  }

  /**manages double click on a table row */
  tableRowDoubleClickHandler(event: any, rowNode: any) {
    this.commonService.notifyOther({ option: 'onSearchResultTableDoubleClickEvent', value: [rowNode] });
  }

  showRemoveAnnotationTile() {

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

  filterInputColumn(target: EventTarget | null, fieldName: string, matchMode: string) {
    if (target == null) { return; }

    const input = target as HTMLInputElement;
    this.filtersChanged = true;
    this.searchInput.control.markAsTouched();
    this.searchResultsTable.filter(input.value, fieldName, matchMode);
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
    this.searchRequest.layerId = this.selectedLayer?.id;
    this.searchRequest.restriction = this.selectedRestriction?.code;
    this.searchRequest.filters.searchMode = this.selectedSearchMode.code;
    this.searchRequest.filters.searchValue = this.searchValue?.trim();
    this.searchRequest.filters.contextLength = this.contextLength;
    this.clearTable();
    this.setColumnFilters();

    this.search();
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

  onChangeLayerSelection(event: any) {
    this.emptyTableResultsOnly();

    if (!this.selectedLayer) {
      this.selectedRestriction = undefined;
    }
    if (this.selectedLayer && !this.selectedRestriction) {
      this.selectedRestriction = this.restrictionOptions[0];
    }
  }

  onChangeRestrictionSelection(event: any) {
    this.emptyTableResultsOnly();
  }

  highlightAnnotation(searchResult: SearchResultRow) {
    if (!searchResult.annotated
      || this.selectedRestriction?.code === RestrictionEnum.notAnnotedOnly) { return; }

    const backgroundColor = this.searchResultHighlightColor;
    const textColor = backgroundColor ? (this.getContrastYIQ(backgroundColor) === 'dark' ? '#FFFFFF' : '#000000') : '#000000';

    return {
      'background-color': backgroundColor,
      'color': textColor
    };
  }

  showKwicTooltip = (tooltipId: string, searchResult?: SearchResultRow): Observable<string> => {
    if (!this.selectedLayer
      || this.selectedRestriction?.code === RestrictionEnum.notAnnotedOnly) { return of(''); }

    const request = new WordAnnotationRequest();
    request.start = this.searchRequest.start;
    request.end = this.searchRequest.end;
    request.layers = this.selectedLayer ? [this.selectedLayer.id!] : [];

    return this.annotationService.retrieveWordAnnotations(Number(searchResult?.textId), request).pipe(
      map(result => {
        // Assuming the backend returns the desired text in a property called `tooltipText`
        // return result.tooltipText || 'No data available';
        return 'test'
      }),
      catchError(() => of('Error retrieving tooltip data'))
    );
  }

  /**
 *refresh documents data  
 */
  reloadSelectedDocuments(): void {
    this.corpusStateService.refreshFileSystem.next();
  }

  /** exports all the rows */
  private exportAll() {
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
  private exportSelected() {
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

  //**executs the lazy load */
  private lazyLoadSearchResultsDebounced(event: any) {
    if (this.tableCleared) {
      this.tableCleared = false;
      return;
    }

    this.setColumnFilters();
    this.search();
  }

  /**set the request filters based on the table ones */
  private setColumnFilters() {
    this.searchRequest.filters.index = (<FilterMetadata>(this.searchResultsTable.filters['index']))?.value;
    this.searchRequest.filters.kwic = (<FilterMetadata>(this.searchResultsTable.filters['kwic']))?.value;
    this.searchRequest.filters.leftContext = (<FilterMetadata>(this.searchResultsTable.filters['leftContext']))?.value;
    this.searchRequest.filters.rightContext = (<FilterMetadata>(this.searchResultsTable.filters['rightContext']))?.value;
    this.searchRequest.filters.text = (<FilterMetadata>(this.searchResultsTable.filters['text']))?.value;
    this.searchRequest.filters.reference = (<FilterMetadata>(this.searchResultsTable.filters['textHeader']))?.value;
  }

  /**validate inputs and start the search */
  private search() {
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
        this.searchResultHighlightColor = this.selectedLayer?.color;
        this.updateTableHeight();
      },
      error: (error) => {
        this.loading = false;
        this.commonService.throwHttpErrorAndMessage(error, error.error.message);
      }
    });
  }

  /**clears table and prevent triggering lazy loading multiple times */
  private clearTable() {
    this.searchResultsTable.clear();
    this.tableCleared = true;
  }

  /**reset table and prevent triggering lazy loading */
  private resetTable() {
    this.searchResultsTable.reset();
    this.tableCleared = true;
    this.searchResultsTable.columnWidthsState = this.pTabelColumnWidthStates.columnWidths;
    this.setResizeTableWidth(this.pTabelColumnWidthStates.tableWidth);
    this.searchResultsTable.restoreColumnWidths();
  }

  private setResizeTableWidth(width: string): void {
    const tableElement = this.searchResultsTable?.tableViewChild?.nativeElement;
    if (tableElement) {
      this.renderer.setStyle(tableElement, 'width', width);
      this.renderer.setStyle(tableElement, 'minWidth', '100%');
    }
  }

  /**update the table heigth */
  private updateTableHeight() {
    this.tableContainerHeight = this.currentPanelHeight - this.tableHeaderHegith;
  }

  private emptyTableResultsOnly() {
    this.searchResults = [];
    this.searchResultHighlightColor = this.selectedLayer?.color;
  }

  /** Determines if the text color should be light or dark based on the background color */
  private getContrastYIQ(hexColor: string): 'light' | 'dark' {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'light' : 'dark';
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
