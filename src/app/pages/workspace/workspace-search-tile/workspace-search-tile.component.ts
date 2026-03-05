import { AfterViewChecked, Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FilterMetadata, MenuItem, MessageService, TreeNode } from 'primeng/api';
import { Table } from 'primeng/table';
import { Observable, Subject, Subscription, catchError, debounceTime, map, of, switchMap, takeUntil } from 'rxjs';
import { TextOffset } from 'src/app/controllers/editors/multiple-text-annotation-editor/multiple-text-annotation-editor.component';
import { HtmlHelper } from 'src/app/helpers/html.helper';
import { ElementType } from 'src/app/models/corpus/element-type';
import { SearchRequest } from 'src/app/models/search/search-request';
import { SearchResultRow } from 'src/app/models/search/search-result';
import { CorpusElement, FolderElement } from 'src/app/models/texto/corpus-element';
import { TLayer } from 'src/app/models/texto/t-layer';
import { AnnotationService, FeatureWordResponse, MultipleAnnotationResponse, WordAnnotationRequest, WordAnnotationResponse } from 'src/app/services/annotation.service';
import { CommonService } from 'src/app/services/common.service';
import { LexicalEntryLabelService } from 'src/app/services/lexical-entry-label.service';
import { CorpusStateService } from 'src/app/services/corpus-state.service';
import { LayerStateService } from 'src/app/services/layer-state.service';
import { LoaderService } from 'src/app/services/loader.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { SearchService } from 'src/app/services/search.service';
import Swal from 'sweetalert2';

export interface EnrichedWordAnnotationResponse extends WordAnnotationResponse {
  resource_display_label?: string;
  features: (FeatureWordResponse & { displayValue?: string })[];
}

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

  constructor(
    private corpusStateService: CorpusStateService,
    private searchService: SearchService,
    private commonService: CommonService,
    private layerState: LayerStateService,
    private annotationService: AnnotationService,
    private lexicalEntryLabelService: LexicalEntryLabelService,
    private renderer: Renderer2,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private loaderService: LoaderService,
  ) { }

  private searchSubscription?: Subscription;
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
  lastSearchRequestLayer?: TLayer;
  layers$: Observable<TLayer[]> = this.layerState.layers$.pipe(
    switchMap(layers => of(layers.sort((a, b) => (a.name && b.name && a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1))),
  );
  restrictionOptions = [
    { name: this.commonService.translateKey('SEARCH.restriction.none'), code: RestrictionEnum.none },
    { name: this.commonService.translateKey('SEARCH.restriction.annotedOnly'), code: RestrictionEnum.annotedOnly },
    { name: this.commonService.translateKey('SEARCH.restriction.notAnnotedOnly'), code: RestrictionEnum.notAnnotedOnly }
  ];
  selectedRestriction?: Restriction;

  pos$ = this.searchService.retrieveUpos();
  posValue: string[] = [];

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
  annotateItems: MenuItem[] = [];

  showMultipleAnnotationDialog: boolean = false;
  textOffsets: TextOffset[] = [];
  isDeleting: boolean = false;
  isEditing: boolean = false;
  annotationEnabled: boolean = false;

  @ViewChild('searchInput') searchInput: any;
  @ViewChild('dt') searchResultsTable!: Table;

  private filtersSubject: Subject<any> = new Subject();
  private readonly unsubscribe$ = new Subject<void>();

  get annotationAllowed(): boolean {
    return this.annotationEnabled && this.selectedSearchResults && this.selectedSearchResults.length > 0;
  }

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

  showAnnotationTile(isDeleting: boolean = false, isEditing: boolean = false) {
    const offsetArray: TextOffset[] = [];
    this.selectedSearchResults.forEach((row: SearchResultRow) => {
      let offset: TextOffset = {
        index: row.index,
        resourceId: row.textId,
        start: row.kwicOffset,
        end: row.kwicOffset + row.kwic.length
      };
      offsetArray.push(offset);
    });
    this.textOffsets = offsetArray;

    // Importante: prima settiamo gli offsets, poi apriamo la finestra (evita race-condition sugli @Input)
    this.isDeleting = isDeleting;
    this.isEditing = isEditing;
    this.showMultipleAnnotationDialog = true;
  }

  //**init for annotate menu button */
  setAnnotateMenuItems() {
    this.annotateItems = [
      {
        label: this.commonService.translateKey('SEARCH.buttons.editAnnotations'), command: () => {
          this.showAnnotationTile(false, true);
        }
      },
      {
        label: this.commonService.translateKey('SEARCH.buttons.removeAnnotations'), command: () => {
          this.showAnnotationTile(true, false);
        }
      }
    ];
  }

  /**
   * Handles the double-click event on a table row.
   * @param event The event triggered by the double-click.
   * @param rowNode The data of the row that was double-clicked.
   */
  tableRowDoubleClickHandler(event: any, rowNode: any) {
    this.commonService.notifyOther({ option: 'onSearchResultTableDoubleClickEvent', value: [rowNode] });
  }

  /**handler for page change */
  /**
   * Handles the page change event in the table.
   * @param event The event triggered by the page change.
   */
  onPage(event: any) {
    this.changingPage = true;
  }

  /**
   * Debounces the search on filter input changes.
   * @param event The event triggered by the filter input change.
   */
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

  /**
   * Filters the input column based on the provided field name and match mode.
   * @param target The target input element.
   * @param fieldName The name of the field to filter.
   * @param matchMode The match mode for filtering.
   */
  filterInputColumn(target: EventTarget | null, fieldName: string, matchMode: string) {
    if (target == null) { return; }

    const input = target as HTMLInputElement;
    this.filtersChanged = true;
    this.searchInput.control.markAsTouched();
    this.searchResultsTable.filter(input.value, fieldName, matchMode);
  }

  /**

   * Updates the height and width of the panel content.
   * @param newHeight The new height of the panel.
   * @param newWidth The new width of the panel.
   */
  updateHeight(newHeight: number, newWidth: number) {
    this.currentPanelHeight = newHeight;
    this.tableContainerHeight = newHeight - this.tableHeaderHegith;
    this.setResizeTableWidth((newWidth - this.nativeTableDelta) + 'px')
  }

  /**
   * Handles changes in the selected search mode.
   */
  onSearchModeChange() {
    if (this.selectedSearchMode.code === 'form') {
      this.searchLabel = this.commonService.translateKey('SEARCH.insertForm');
      return;
    }

    this.searchLabel = this.commonService.translateKey('SEARCH.insertLemma');
  }

  /**
   * Prepares data and sends the search request.
   */
  onSearch() {
    this.searchRequest.start = 0;
    this.searchRequest.end = this.visibleRows;
    this.searchRequest.resources = this.mapSelectedDocumentsIds();
    this.searchRequest.layerId = this.selectedLayer?.id;
    this.searchRequest.filters.annotated = this.setAnnotadeFilter(this.selectedRestriction?.code);
    this.searchRequest.filters.searchMode = this.selectedSearchMode.code;
    this.searchRequest.filters.searchValue = this.searchValue?.trim();
    this.searchRequest.filters.contextLength = this.contextLength;
    this.searchRequest.filters.pos = this.posValue;
    this.searchRequest.reload = true;
    this.lastSearchRequestLayer = this.selectedLayer;
    this.clearTable();
    this.resetColumnFilters();
    this.setColumnFilters();

    this.search();
  }

  /**
   * Handles the column resize event in the table.
   * @param event The event triggered by column resizing.
   */
  onColResize(event: any) {
    const tableElement = this.searchResultsTable?.tableViewChild?.nativeElement;
    if (tableElement) {
      this.renderer.setStyle(tableElement, 'minWidth', '100%');
    }
  }

  /**
   * Clears the search results and resets the search parameters.
   */
  onClear() {
    this.searchRequest = new SearchRequest();
    this.searchResults = [];
    this.totalRecords = 0;
    this.selectedSearchResults = [];
    this.selectedDocuments = [];
    this.searchValue = '';
    this.selectedSearchMode = this.searchModes[0];
    this.contextLength = this.contextLenghtDefaultValue;
    this.selectedLayer = undefined;
    this.selectedRestriction = undefined;
    this.resetTable();
    this.updateTableHeight();
  }

  /**
   * Handles changes in the selected layer.
   * @param event The event triggered by the layer selection change.
   */
  onChangeLayerSelection(event: any) {
    // this.emptyTableResultsOnly();

    if (!this.selectedLayer) {
      this.selectedRestriction = undefined;
    }
    if (this.selectedLayer && !this.selectedRestriction) {
      this.selectedRestriction = this.restrictionOptions[0];
    }
  }

  /**
   * Handles changes in the selected restriction.
   * @param event The event triggered by the restriction selection change.
   */
  onChangeRestrictionSelection(event: any) {
    // this.onSearch();
  }

  /**
   * Highlights the annotation for a search result row.
   * @param searchResult The search result row to highlight.
   * @returns The style object for the highlighted row.
   */
  highlightAnnotation(searchResult: SearchResultRow) {
    if (!searchResult.annotated || !this.lastSearchRequestLayer?.id) { return; }

    const backgroundColor = this.lastSearchRequestLayer?.color;
    const textColor = backgroundColor ? (this.getContrastYIQ(backgroundColor) === 'dark' ? '#FFFFFF' : '#000000') : '#000000';

    return {
      'background-color': backgroundColor,
      'color': textColor
    };
  }

  /**
   * Displays the KWIC tooltip for a search result.
   * Resolves lexical entry codes to human-readable labels for tooltip display.
   * @param tooltipId The ID of the tooltip element.
   * @param searchResult The search result row for which the tooltip is displayed.
   * @returns An observable of word annotation responses.
   */
  showKwicTooltip = (tooltipId: string, searchResult?: SearchResultRow): Observable<EnrichedWordAnnotationResponse[]> => {
    if (!this.lastSearchRequestLayer?.id) { return of([]); }

    const request = new WordAnnotationRequest();
    request.start = searchResult!.kwicOffset;
    request.end = searchResult!.kwicOffset + searchResult!.kwic.length;
    request.layers = this.lastSearchRequestLayer?.id ? [this.lastSearchRequestLayer.id] : [];

    return this.annotationService.retrieveWordAnnotations(Number(searchResult?.textId), request).pipe(
      takeUntil(this.unsubscribe$),
      switchMap(annotations => {
        const codes: string[] = [];
        annotations.forEach(ann => {
          if (this.lexicalEntryLabelService.isLexicalEntryCode(ann.resource_name)) {
            codes.push(ann.resource_name.trim());
          }
          ann.features?.forEach(f => {
            if (this.lexicalEntryLabelService.isLexicalEntryCode(f.value)) {
              codes.push(f.value.trim());
            }
          });
        });
        if (codes.length === 0) {
          return of(annotations.map(ann => this.toEnriched(ann, new Map())));
        }
        return this.lexicalEntryLabelService.getLabels(codes).pipe(
          map(labelMap => annotations.map(ann => this.toEnriched(ann, labelMap)))
        );
      }),
      catchError(() => of([]))
    );
  }

  private toEnriched(ann: WordAnnotationResponse, labelMap: Map<string, string>): EnrichedWordAnnotationResponse {
    const resource_display_label = ann.resource_name && labelMap.has(ann.resource_name.trim())
      ? labelMap.get(ann.resource_name.trim())! : undefined;
    const features = (ann.features || []).map(f => ({
      ...f,
      displayValue: f.value && labelMap.has(f.value.trim()) ? labelMap.get(f.value.trim())! : undefined
    }));
    return { ...ann, resource_display_label, features };
  }

  stripHtml(html: string | undefined | null): string {
    return HtmlHelper.stripHtml(html);
  }

  /**
 *refresh documents data  
 */
  /**
   * Refreshes the documents data.
   */
  reloadSelectedDocuments(): void {
    this.corpusStateService.refreshFileSystem.next();
  }

  /**
   * Displays a loading indicator when a save operation starts.
   */
  onSaveStart() {
    this.showProgressBar();
  }

  /**
   * Handles the end of a save operation.
   * @param event The event triggered by the save operation.
   */
  onSaveEnd(event: any) {
    this.endMultipleAnnotationOperation(event);
  }

  /**
   * Displays a loading indicator when a delete operation starts.
   */
  onDeleteStart() {
    this.showProgressBar();
  }

  /**
   * Displays a loading indicator when an edit operation starts.
   */
  onEditStart() {
    this.showProgressBar();
  }

  /**
   * Handles the end of a delete operation.
   * @param event The event triggered by the delete operation.
   */
  onDeleteEnd(event: MultipleAnnotationResponse) {
    Swal.close();
    this.showMultipleAnnotationDialog = false;
    this.isDeleting = false;
    switch (event.status) {
      case 'ERROR':
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.commonService.translateKey('SEARCH.annotations.deleteFailed')} ${event.errors.map((index: number) => index + 1).join(', ')}`));
        break;
      case 'SUCCESS':
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${event.success} ${this.commonService.translateKey('SEARCH.annotations.deleteSuccess')}`));
        break;
      case 'PARTIAL':
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.commonService.translateKey('SEARCH.annotations.deleteFailed')} ${event.errors.map((index: number) => index + 1).join(', ')}`));
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${event.success} ${this.commonService.translateKey('SEARCH.annotations.deleteSuccess')}`));
        break;
      default:
        console.error('Unknown status:', event.status);
        break;
    }
    this.searchRequest.reload = true;
    this.search();
    this.selectedSearchResults = [];
  }

  /**
   * Handles the end of an edit operation.
   * @param event The event triggered by the edit operation.
   */
  onEditEnd(event: MultipleAnnotationResponse) {
    Swal.close();
    this.showMultipleAnnotationDialog = false;
    this.isEditing = false;
    switch (event.status) {
      case 'ERROR':
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.commonService.translateKey('SEARCH.annotations.editFailed')} ${event.errors.map((index: number) => index + 1).join(', ')}`));
        break;
      case 'SUCCESS':
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${event.success} ${this.commonService.translateKey('SEARCH.annotations.editSuccess')}`));
        break;
      case 'PARTIAL':
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.commonService.translateKey('SEARCH.annotations.editFailed')} ${event.errors.map((index: number) => index + 1).join(', ')}`));
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${event.success} ${this.commonService.translateKey('SEARCH.annotations.editSuccess')}`));
        break;
      default:
        console.error('Unknown status:', event.status);
        break;
    }
    this.searchRequest.reload = true;
    this.search();
    this.selectedSearchResults = [];
  }

  /**
   * Handles the end of a save operation for multiple annotations.
   * @param event The event triggered by the save operation.
   */
  private endMultipleAnnotationOperation(event: MultipleAnnotationResponse) {
    Swal.close();
    this.showMultipleAnnotationDialog = false;
    this.isDeleting = false;
    this.isEditing = false;
    switch (event.status) {
      case 'ERROR':
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.commonService.translateKey('SEARCH.annotations.saveFailed')} ${event.errors.map((index: number) => index + 1).join(', ')}`));
        break;
      case 'SUCCESS':
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${event.success} ${this.commonService.translateKey('SEARCH.annotations.saveSuccess')}`));
        break;
      case 'PARTIAL':
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.commonService.translateKey('SEARCH.annotations.saveFailed')} ${event.errors.map((index: number) => index + 1).join(', ')}`));
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${event.success} ${this.commonService.translateKey('SEARCH.annotations.saveSuccess')}`));
        break;
      default:
        console.error('Unknown status:', event.status);
        break;
    }
    this.searchRequest.reload = true;
    this.search();
    this.selectedSearchResults = [];
  }

  /**
* Displays a progress bar when a save operation is in progress.
*/
  private showProgressBar() {
    Swal.fire({
      title: `${this.commonService.translateKey('GENERAL.operationInProgress')}`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  /**
   * Exports all rows in the search results.
   */
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

  /**
   * Exports only the selected rows in the search results.
   */
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

  /**
   * Executes the lazy load for search results with debounce.
   * @param event The event triggered by the lazy load.
   */
  private lazyLoadSearchResultsDebounced(event: any) {
    if (this.tableCleared) {
      this.tableCleared = false;
      return;
    }

    this.setColumnFilters();
    this.search();
  }

  /**
   * Sets the column filters for the search request.
   */
  private setColumnFilters() {
    this.searchRequest.filters.index = (<FilterMetadata>(this.searchResultsTable.filters['index']))?.value;
    this.searchRequest.filters.kwic = (<FilterMetadata>(this.searchResultsTable.filters['kwic']))?.value;
    this.searchRequest.filters.leftContext = (<FilterMetadata>(this.searchResultsTable.filters['leftContext']))?.value;
    this.searchRequest.filters.rightContext = (<FilterMetadata>(this.searchResultsTable.filters['rightContext']))?.value;
    this.searchRequest.filters.text = (<FilterMetadata>(this.searchResultsTable.filters['text']))?.value;
    this.searchRequest.filters.reference = (<FilterMetadata>(this.searchResultsTable.filters['textHeader']))?.value;
  }

  /**
   * Resets the column filters in the search results table.
   */
  private resetColumnFilters() {
    if (this.searchResultsTable) {
      delete this.searchResultsTable.filters['index'];
      delete this.searchResultsTable.filters['kwic'];
      delete this.searchResultsTable.filters['leftContext'];
      delete this.searchResultsTable.filters['rightContext'];
      delete this.searchResultsTable.filters['text'];
      delete this.searchResultsTable.filters['textHeader'];
      const tableElement = this.searchResultsTable?.tableViewChild?.nativeElement;
      if (tableElement) {
        const filterInputs = tableElement.querySelectorAll('.p-column-filter .p-inputtext');
        filterInputs.forEach((input: any) => {
          if (input) {
            input.value = '';
          }
        });
      }
    }
  }

  /**
   * Validates inputs and starts the search process.
   */
  private search() {
    this.searchInput.control.markAsTouched();

    if (!this.searchRequest.filters.searchValue) {
      return;
    }

    this.loading = true;

    if (this.filtersChanged) {
      this.searchRequest.start = 0;
      this.searchRequest.end = this.visibleRows;
      this.filtersChanged = false;
    }

    // Cancel the previous search if it is still ongoing
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    // Start a new search and track its subscription
    this.searchSubscription = this.searchService.search(this.searchRequest).subscribe({
      next: (result) => {
        this.searchRequest.reload = false;
        this.searchResults = result.data;
        this.searchResults.forEach(res => res.id ? res.id : res.id = `id_${res.index}`);
        this.loading = false;
        this.totalRecords = result.count;
        this.updateTableHeight();
        this.enableDisableAnnotationButtons();
      },
      error: (error) => {
        this.searchRequest.reload = false;
        this.loading = false;
        this.commonService.throwHttpErrorAndMessage(error, error.error.message);
      }
    });
  }

  /**
   * Enables or disables the annotation buttons based on the selected layer and search results.
   */
  private enableDisableAnnotationButtons() {
    if (!this.selectedLayer || !this.searchResults || this.searchResults.length === 0) {
      this.annotationEnabled = false;
    } else {
      this.annotationEnabled = true;
    }
  }

  /**
   * Clears the table and prevents triggering lazy loading multiple times.
   */
  private clearTable() {
    this.selectedSearchResults = [];
    this.searchResultsTable.clear();
    this.tableCleared = true;
  }

  /**
   * Resets the table and prevents triggering lazy loading.
   */
  private resetTable() {
    this.searchResultsTable.reset();
    this.tableCleared = true;
    this.searchResultsTable.columnWidthsState = this.pTabelColumnWidthStates.columnWidths;
    this.setResizeTableWidth(this.pTabelColumnWidthStates.tableWidth);
    this.searchResultsTable.restoreColumnWidths();
    this.resetColumnFilters();
    this.enableDisableAnnotationButtons();
  }

  private setResizeTableWidth(width: string): void {
    const tableElement = this.searchResultsTable?.tableViewChild?.nativeElement;
    if (tableElement) {
      this.renderer.setStyle(tableElement, 'width', width);
      this.renderer.setStyle(tableElement, 'minWidth', '100%');
    }
  }

  /**
   * Updates the height of the table container.
   */
  private updateTableHeight() {
    this.tableContainerHeight = this.currentPanelHeight - this.tableHeaderHegith;
  }

  /**
   * Determines if the text color should be light or dark based on the background color.
   * @param hexColor The hex color code of the background.
   * @returns 'light' if the text color should be light, 'dark' otherwise.
   */
  private getContrastYIQ(hexColor: string): 'light' | 'dark' {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? 'light' : 'dark';
  }

  /**
   * Initializes the search mode data.
   */
  private initSearchMode() {
    this.searchModes = [
      { name: this.commonService.translateKey('SEARCH.form'), code: 'form', inactive: false },
      { name: this.commonService.translateKey('SEARCH.lemma'), code: 'lemma', inactive: true },
    ];

    this.selectedSearchMode = this.searchModes[0];
    this.onSearchModeChange();
  }

  /**
   * Extracts only the IDs of the files from the document tree.
   * @returns An array of file IDs.
   */
  private mapSelectedDocumentsIds(): Array<number> {
    return this.selectedDocuments.filter(selectedNode => selectedNode.leaf).map(leaf => leaf.data?.id!);
  }

  /**
   * Maps the given elements to tree nodes.
   * @param elements The elements to map.
   * @returns An array of tree nodes.
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

  private setAnnotadeFilter(restriction?: RestrictionEnum): boolean | undefined {
    if (!restriction || restriction === RestrictionEnum.none) { return undefined; }

    return restriction === RestrictionEnum.annotedOnly ? true : false;
  }
}

