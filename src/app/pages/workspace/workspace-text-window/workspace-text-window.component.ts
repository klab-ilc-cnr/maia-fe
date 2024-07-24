import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { text } from '@fortawesome/fontawesome-svg-core';
import { MessageService, TreeNode } from 'primeng/api';
import { Splitter } from 'primeng/splitter';
import { Tree } from 'primeng/tree';
import { Observable, Subject, catchError, forkJoin, of, switchMap, take, takeUntil, throttleTime } from 'rxjs';
import { Annotation } from 'src/app/models/annotation/annotation';
import { SpanCoordinates } from 'src/app/models/annotation/span-coordinates';
import { EditorType } from 'src/app/models/editor-type';
import { Layer } from 'src/app/models/layer/layer.model';
import { LineBuilder } from 'src/app/models/text/line-builder';
import { TextHighlight } from 'src/app/models/text/text-highlight';
import { TextLine } from 'src/app/models/text/text-line';
import { TextRange } from 'src/app/models/text/text-range';
import { TextRow } from 'src/app/models/text/text-row';
import { ResourceElement } from 'src/app/models/texto/corpus-element';
import { PaginatedResponse, TextSplittedRow } from 'src/app/models/texto/paginated-response';
import { Section } from 'src/app/models/texto/section';
import { TAnnotation } from 'src/app/models/texto/t-annotation';
import { TAnnotationFeature } from 'src/app/models/texto/t-annotation-feature';
import { TFeature } from 'src/app/models/texto/t-feature';
import { TLayer } from 'src/app/models/texto/t-layer';
import { AnnotationService } from 'src/app/services/annotation.service';
import { CommonService } from 'src/app/services/common.service';
import { LayerStateService } from 'src/app/services/layer-state.service';
import { LoaderService } from 'src/app/services/loader.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { WorkspaceService } from 'src/app/services/workspace.service';

interface SelectionExtension extends Selection {
  modify(s: string, t: string, u: string): void;
}

export class LayerReload {
  operation!: LayerReloadOperation;
  layerIds?: Array<number>;
}

export class TextSelection {
  selection!: Selection;
  startIndex!: number;
  endIndex!: number;
}

enum LayerReloadOperation { Add, Remove, Equal }

export enum ScrollingDirectionType { Init, Up, Down, InRange, IncreaseWidenessUp, IncreaseWidenessDown, ChangingSection }

@Component({
  selector: 'app-workspace-text-window',
  templateUrl: './workspace-text-window.component.html',
  styleUrls: ['./workspace-text-window.component.scss'],
  providers: [LayerStateService],
})
export class WorkspaceTextWindowComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  layers$ = this.layerState.layers$.pipe(
    switchMap(layers => of(layers.sort((a, b) => (a.name && b.name && a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1))),
  );
  selectedText = '';
  /**Oggetto di selezione */
  currentTextSelection: TextSelection | null = null;
  /**Id used to simulate the text selection operation */
  specialSelectionLayerId: number = -777
  /**Configurazione di visualizzazione iniziale */
  private visualConfig = {
    draggedArcHeight: 30,
    spaceBeforeTextLine: 8,
    spaceAfterTextLine: 8,
    stdTextLineHeight: 18,
    stdTextOffsetX: 37,
    maxStdTextOffsetX: 100,
    stdSentnumOffsetX: 32,
    maxStdSentnumOffsetX: 95,
    spaceBeforeVerticalLine: 2,
    spaceAfterVerticalLine: 2,
    textFont: "13px monospace",
    jsPanelHeaderBarHeight: 29.5,
    layerSelectHeightAndMargin: 65.35 + 16,
    paddingAfterTextEditor: 10,
    annotationHeight: 12,
    curlyHeight: 4,
    annotationFont: "10px 'PT Sans Caption'",
    arcFont: "10px 'PT Sans Caption'",
    labelMaxLength: 10,
    labelEllipsisText: "...",
    labelPaddingXAxis: 3,
    arcAngleOffset: 3,
    arcSpacing: 10,
    arcCircleLabelPlaceholderHeight: 7,
    arcCircleLabelPlaceholderWidth: 7
  }
  private gotoSavedScrollTop: boolean = false;
  private savedScrollTop: number = 0;

  /**Annotazione in lavorazione */
  // annotation = new Annotation();
  textoAnnotation = new TAnnotation();
  offset: number | undefined;
  visibleAnnotationId?: number;
  /**Annotation response */
  // annotationsRes: any;
  textoAnnotationsRes: TAnnotation[] = [];
  /**Freccia di relazione */
  dragArrow: any = {
    m: "",
    c: "",
    isDrawing: false,
    visibility: "hidden",
    sourceAnn: new Annotation(),
    targetAnn: new Annotation()
  };
  /**Altezza del pannello di testo */
  height: number = window.innerHeight / 2;
  /**Lista delle opzioni layer */
  // layerOptions = new Array<SelectItem>();
  /**Lista dei layer */
  layersList: TLayer[] = [];
  /**Relazione in lavorazione */
  // relation = new Relation();
  /**Righe di testo */
  rows: TextRow[] = [];
  /**Layer selezionato */
  selectedLayer: TLayer | undefined;
  /**Lista di layer selezionati */
  selectedLayers: TLayer[] = [];
  lastRenderedLayers: number[] = [];

  sentnumVerticalLine = "M 0 0";
  /**Definisce se visualizzare l'editor di annotazione */
  showAnnotationEditor = false;
  /**Definisce se visualizzare l'editor delle relazioni */
  showRelationEditor = false;
  /**Annotazioni semplificate */
  simplifiedAnns: any;
  /**Lista di archi di relazione semplificati */
  // simplifiedArcs: Array<Relation> = [];
  /**Annotazione sorgente della relazione */
  // sourceAnn = new Annotation();
  /**Layer sorgente dell'annotazione */
  // sourceLayer = new Layer();
  svgHeight = 0;
  /**Annotazione target della relazione */
  // targetAnn = new Annotation();
  /**Layer target della relazione */
  // targetLayer = new Layer();
  /**Altezza del contenitore del testo */
  textContainerHeight: number = window.innerHeight / 2;
  /**Sections panel header height */
  sectionsHeaderHeight = 130;
  /**Sections document tree height*/
  get sectionsTreeHeight() {
    return this.textContainerHeight - this.sectionsHeaderHeight;
  }
  forceRefreshDocumentTree: boolean = true;
  /**Identificativo numerico del testo */
  textId: number | undefined;
  /**Text response */
  textRes: any;
  textSplittedRows: TextSplittedRow[] | undefined;
  /**Lista dei layer visibili */
  visibleLayers: TLayer[] = [];

  /**Riferimento all'elemento svg */
  @ViewChild('svg') public svg!: ElementRef;
  @ViewChild('textContainer') public textContainer!: ElementRef;
  @ViewChild('st') public documentSectionsTreeElement!: Tree;
  @ViewChild('textTileSplitter') public textTileSplitter!: Splitter;
  @ViewChild('annotationEditor', { read: ElementRef }) public annotationEditor!: ElementRef;

  /**Scroller*/
  public textRowsWideness!: number;
  public textTotalRows: number = 0;
  public precTextRange?: TextRange;
  public textRange!: TextRange;
  public lastScrollTop: number = 0;
  public lastscrollTopPercentage: number = 0;
  public scrolling: boolean = false;
  public backendIndexCompensation: number = 1;
  public mostRecentRequestTime: number = 0;
  public preventOnScrollEvent: boolean = false;
  public scrollingDirection!: ScrollingDirectionType;
  public extraRowsWidenessUpOrDown!: number;
  public scrollingSubject = new Subject<number>();
  public currentVisibleRowIndex?: number;
  public scrollingRowIndex!: number;
  public layerVisibilityHeight: number = 36.5;

  /**Document section navigation tree */
  documentSections: TreeNode[] = new Array<TreeNode>;
  selectedSection?: TreeNode;
  rootNodeKey: string = '405092b3-7110-4e48-a524-21a20d0448ab'

  /**Resizible panels settings */
  public widthPercentEditorDiv = 0;
  public widthPercentSectionsDiv = 0;
  public expandedEditorDiv!: boolean;
  public expandedDocumentSectonsDiv!: boolean;

  /**Resizible panels dynamic size settings */
  lateralSplitExpandedSize: number = 24;
  lateralSplitCollapsedSize: number = 3;
  documentSectionsSplit!: number;
  annotationSplitSize!: number;
  get textSplitSize() {
    return 100 - this.documentSectionsSplit - this.annotationSplitSize;
  }

  showSentum: boolean = true;

  // currentUser!: User;
  currentTextoUserId!: number;
  currentResource!: ResourceElement;

  /**starting row index */
  startingRowIndex!: number;

  /**
   * Costruttore per WorkspaceTextWindowComponent
   * @param annotationService {AnnotationService} servizi relativi alle annotazioni
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param msgConfService {MessageConfigurationService} servizi per la configurazione dei messaggi per messageService
   */
  constructor(
    private annotationService: AnnotationService,
    private loaderService: LoaderService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private layerState: LayerStateService,
    private commonService: CommonService,
    private workspaceService: WorkspaceService,
    private cdref: ChangeDetectorRef
  ) {
    this.workspaceService.getTextoCurrentUserId().pipe(
      take(1),
    ).subscribe({
      next: (textoUser) => {
        this.currentTextoUserId = textoUser.id;
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, error.error.message);
      }
    });
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per caricare i dati iniziali del componente */
  ngOnInit(): void {
    if (!this.textId) {
      return;
    }

    this.initTextTileSplitterSettings();

    this.startingRowIndex = this.startingRowIndex ?? 0;

    this.scrollingSubject.pipe(throttleTime(200)).pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe({
      next: (value) => {
        this.updateTextRowsView(value)
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Scrolling failed`);
      }
    });

    forkJoin([this.workspaceService.retrieveResourceElementById(this.textId),
    this.workspaceService.retrieveSectionsByResourceId(this.textId)]).pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        return this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
      })
    ).subscribe(([resource, sectionsResponse]) => {
      this.currentResource = resource;
      this.initAnnotationPanelSettings(this.currentResource.expandedEditorDiv);
      this.documentSections = this.adaptToDocumentTree(sectionsResponse, resource.name ?? '');
    });

    this.layers$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe({
      next: (list) => {
        this.layersList = list;
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Loading layers failed: ${error.error.message}`);
      }
    });

    this.showAnnotationEditor = true;

    this.updateHeight(this.height);
  }

  ngAfterViewInit() {
    this.textRowsWideness = this.textRowsRangeWidenessPredictor();
    this.extraRowsWidenessUpOrDown = this.extraTextRowsWidenessPredictor();
    this.loadInitialData();

    setTimeout(() => {
      this.textTileSplitter.cd.detectChanges();
      this.fixPrimeNgSplitterPanelInitialSize();
    });
  }

  /**initialize text range and load data */
  loadInitialData() {
    this.annotationService.retrieveTextTotalRows(this.textId!).pipe(
      take(1),
    ).subscribe({
      next: (result) => {
        this.textTotalRows = result!

        let start = this.startingRowIndex;
        let end = this.startingRowIndex + this.textRowsWideness;

        if (end > this.textTotalRows) {
          end = this.textTotalRows;
        }

        this.textRange = new TextRange(start, end);
        this.precTextRange = this.textRange.clone();
        this.scrollingDirection = this.scrollingDirection ?? ScrollingDirectionType.Init; // if we are changin section we already have a value in this.scrollingDirection
        this.currentVisibleRowIndex = this.startingRowIndex;
        this.scrollingRowIndex = this.textRange.end;
        this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Error retrieving text total rows: ${error.error.message}`);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  async onSaveAnnotationFeatures(featuresList: TAnnotationFeature[]) {
    let workingAnnotation = this.textoAnnotation;
    if (!this.textoAnnotation.id) {
      this.textoAnnotation.user = { id: this.currentTextoUserId };
      this.textoAnnotation.resource = this.currentResource;
      workingAnnotation = await this.createNewAnnotation(this.textoAnnotation);
    }
    const newFeaturesObs: Observable<TAnnotationFeature>[] = [];
    const updateFeaturesObs: Observable<TAnnotationFeature>[] = [];
    for (const fl of featuresList) {
      const existingFeature = this.textoAnnotation.features?.find(f => f.feature?.id === fl.feature!.id);
      if (existingFeature && existingFeature.value === fl.value) {
        continue;
      }
      if (!existingFeature) {
        newFeaturesObs.push(this.saveFeatureAnnotation(workingAnnotation, fl.feature!, fl.value!));
        continue;
      }
      const updateAnnFeat = <TAnnotationFeature>{
        ...existingFeature,
        annotation: {
          id: workingAnnotation.id
        },
        feature: fl.feature,
        value: fl.value,
      };
      updateFeaturesObs.push(this.annotationService.updateAnnotationFeature(updateAnnFeat));
    }

    if (newFeaturesObs.length === 0 && updateFeaturesObs.length === 0) {
      this.annotationSavedOperations(workingAnnotation, []);
      return;
    }

    forkJoin([...newFeaturesObs, ...updateFeaturesObs]).pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        return this.commonService.throwHttpErrorAndMessage(error, `Saving features failed: ${error.error.message}`);
      })
    ).subscribe((newFeaturesList) => {
      this.annotationSavedOperations(workingAnnotation, newFeaturesList);
    })
  }

  /**
   * Metodo che aggiorna la lista dei layer visibili e richiama il caricamento complessivo dei dati
   * @param event {any} evento di variazione dei layer visibili
   */
  changeVisibleLayers(event?: any) {
    this.visibleLayers = this.selectedLayers || [];
    this.scrollingDirection = ScrollingDirectionType.InRange;
    this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
  }

  public onScroll(event: any) {
    if (this.preventOnScrollEvent) {
      this.preventOnScrollEvent = false;
      return;
    }

    this.scrolling = true;
    let scroll = Math.ceil(event.target.clientHeight + event.target.scrollTop);

    if (this.lastScrollTop === event.target.scrollTop) { return; }

    this.scrollingDirection = this.lastScrollTop < event.target.scrollTop ? ScrollingDirectionType.Down : ScrollingDirectionType.Up;
    this.lastScrollTop = event.target.scrollTop;
    this.lastscrollTopPercentage = Math.round((this.lastScrollTop / this.svgHeight) * 100) / 100;

    if (this.isScrollingInLoadedRange(scroll, event.target.scrollTop)) { return; }

    this.scrollingSubject.next(event);
  }

  public expandCollapseNavigationDiv() {
    this.expandedDocumentSectonsDiv = !this.expandedDocumentSectonsDiv;

    this.updateDocumentSectionsSplitSize();

    setTimeout(() => {
      this.scrollingDirection = ScrollingDirectionType.InRange;
      this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
    }, 200);
  }

  public expandCollapseAnnotationDiv(annotationId?: number, row?: TextRow) {
    const isClickingAnnotation = annotationId != null && annotationId != undefined;
    this.currentVisibleRowIndex = row?.rowIndex;
    const wasAlreadyExpandedEditorDiv = this.expandedEditorDiv;
    this.expandedEditorDiv = isClickingAnnotation ? true : !this.expandedEditorDiv;

    this.updateAnnotationsSplitSize();

    setTimeout(() => {
      if (annotationId && annotationId != this.visibleAnnotationId) {
        this.visibleAnnotationId = annotationId;
        this.openAnnotation(this.visibleAnnotationId!);
      }

      if (isClickingAnnotation && wasAlreadyExpandedEditorDiv) {
        const annotationArea = this.annotationEditor.nativeElement.querySelector('.annotation-area');
        annotationArea.scrollTop = 0;
        return;
      }

      this.scrollingDirection = ScrollingDirectionType.InRange;
      this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
    }, 200);
  }

  public sentumChanged() {
    setTimeout(() => {
      this.showSentum = !this.showSentum;
      this.scrollingDirection = ScrollingDirectionType.InRange;
      this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
    }, 500);
  }

  public sectionSelected(event: any) {
    if (event.node.key === this.rootNodeKey) { return; }

    if (event.node.data.start === this.textRange.start) { return; }

    this.scrollingDirection = ScrollingDirectionType.ChangingSection
    this.textRange = new TextRange(event.node.data.start, event.node.data.start + this.textRowsWideness);
    this.precTextRange = this.textRange.clone();
    this.currentVisibleRowIndex = event.node.data.start;
    this.addExtraRowsUp();
    this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
  }

  expandAll() {
    this.documentSections.forEach(node => {
      this.expandRecursive(node, true);
    });

    this.documentSections = [...this.documentSections];
  }

  collapseAll() {
    this.documentSections.forEach(node => {
      this.expandRecursive(node, false);
    });

    this.documentSections = [...this.documentSections];
  }

  /**Metodo che annulla una annotazione (intercetta emissione dell'annotation editor) */
  onAnnotationCancel() {
    this.textoAnnotation = new TAnnotation();
    this.visibleAnnotationId = undefined;
  }

  /**Metodo che cancella una annotazione (intercetta emissione dell'annotation editor) */
  onAnnotationDeleted() {
    this.removeFromAnnotationsResult(this.textoAnnotation.id);
    this.setScrollTopOperationInRange();
    this.textoAnnotation = new TAnnotation();
    this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
  }

  /**Metodo che salva una annotazione (intercetta emissione dell'annotation editor) */
  onAnnotationSaved(annotation: TAnnotation) {
    this.textoAnnotation = annotation;
    this.setScrollTopOperationInRange();
    this.updateAnnotationsResult(annotation);
    this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
  }

  /**Metodo che intercetta il cambio di layer selezionato */
  onChangeLayerSelection(event: any) {
    this.selectedLayers = this.selectedLayers ?? [];

    if (this.selectedLayer && this.selectedLayers.findIndex(l => l.id == this.selectedLayer?.id) == -1) {
      this.selectedLayers.push(this.selectedLayer!);
      this.changeVisibleLayers();
    }
  }

  /**
   * This method selects the node of the tree related to the selected text row.
   * @param event 
   */
  onRowClick(event: any) {
    let rowIndexSelected = Number(event.target.dataset.rowIndex);
    let section = this.findSectionByIndex(rowIndexSelected);

    if (section) {
      this.selectedSection = section;
      this.expandAnchestors(section);

      this.documentSections = [...this.documentSections];

      setTimeout(() => {
        const { found, index } = this.CalculateSectionsTreeIndex(this.documentSections, this.selectedSection!);
        if (found) {
          this.documentSectionsTreeElement.scrollToVirtualIndex(index);

          /**there is an unresolved bug in the primeng component this is a workaround
           * more info about the bug here https://github.com/primefaces/primeng/issues/11948
          */
          setTimeout(() => {
            if (!document.querySelector('#sectionsTree div[role="treeitem"][aria-selected="true"]')) {
              this.forceRefreshDocumentTree = false;
              this.cdref.detectChanges();
              this.forceRefreshDocumentTree = true;
              this.cdref.detectChanges();
              this.documentSectionsTreeElement.scrollToVirtualIndex(index);
            }
          }, 200);

        }
      });
    }
  }

  expandAnchestors(section: TreeNode) {
    let parent = section.data.parent;

    if (!parent) {
      section.expanded = true; //root
      return;
    }

    parent.expanded = true;
    this.expandAnchestors(parent);
  }

  /**
   * Updates the document sections split size
   * @returns 
   */
  public updateDocumentSectionsSplitSize() {
    this.documentSectionsSplit = this.expandedDocumentSectonsDiv ? this.lateralSplitExpandedSize : this.lateralSplitCollapsedSize;
  }

  /**
 * Updates the annotations split size
 * @returns 
 */
  public updateAnnotationsSplitSize() {
    this.annotationSplitSize = this.expandedEditorDiv ? this.lateralSplitExpandedSize : this.lateralSplitCollapsedSize;
  }


  /**this function override the normal window double click text selection
   * that keeps the trailing whitespace at the end of the word and selects just the word
   */
  public onSelectionChangeDoubleClick() {
    const selection = window.getSelection();

    if (!selection) { return; }

    const text = selection.toString();

    if (/\s+$/.test(text)) { // Check if there is a trailing whitespace
      (selection as SelectionExtension).modify("extend", "left", "character");
    }
  }

  /**
   * Metodo che gestisce le variazioni di selezione sul testo
   * @param event {any} evento di mouse up
   * @returns {void}
   */
  onSelectionChange(event: any, row: TextRow): void {
    this.currentVisibleRowIndex = row.rowIndex;

    const textSelection = this.getCurrentTextSelection();

    if (!textSelection) { //caso senza selezione, esco dal metodo
      return;
    }
    
    this.textoAnnotation = new TAnnotation();
    this.visibleAnnotationId = undefined;

    let startIndex = textSelection.startIndex;
    let endIndex = textSelection.endIndex;
    let text = this.textRes.join('').substring(startIndex, endIndex);

    if (!this.onlySpaces(text)) {
      const originalLength = text.length;
      let newText = text.trimStart();
      let newLength = newText.length;

      startIndex = startIndex + (originalLength - newLength);

      newText = text.trimEnd();
      newLength = newText.length;

      endIndex = endIndex - (originalLength - newLength);
      text = newText;
    }

    // const relations = new Relations();
    // this.annotation.layer = this.selectedLayer;
    // this.annotation.layerName = this.layerOptions.find(l => l.value == this.selectedLayer)?.label;
    textSelection.startIndex = (this.offset ?? 0) + startIndex;
    textSelection.endIndex = (this.offset ?? 0) + endIndex;
    this.textoAnnotation.layer = this.selectedLayer;
    this.textoAnnotation.start = (this.offset ?? 0) + startIndex;
    this.textoAnnotation.end = (this.offset ?? 0) + endIndex;
    this.selectedText = text;
    this.currentTextSelection = textSelection;

    // const selectionAnnotation = new TAnnotation();
    // selectionAnnotation.id = -776
    // // selectionAnnotation.layer = this.specialSelectionLayer;
    // selectionAnnotation.start = (this.offset ?? 0) + startIndex;
    // selectionAnnotation.end = (this.offset ?? 0) + endIndex;

    // if (this.selectedLayers?.findIndex(i => i.id === this.specialSelectionLayerId) < 0) {
    //   this.selectedLayers?.push(this.specialSelectionLayer)
    // }

    this.specialSelectionAnnotation.active = this.visibleLayers.length > 0;
    this.specialSelectionAnnotation.start = (this.offset ?? 0) + startIndex;
    this.specialSelectionAnnotation.end = (this.offset ?? 0) + endIndex;
    this.setScrollTopOperationInRange();
    // this.updateAnnotationsResult(selectionAnnotation);
    this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
    // this.highlightSelection(textSelection);

    this.showEditorAndHideOthers(EditorType.Annotation);
  }

  specialSelectionAnnotation: any = { id: -777, color: "#0067D1", start: undefined, end: undefined, active: false };

  //TODO Eliminare usare l'altra tecnica che sfrutta il sistema di annotazione
  currentHighlightenText: SVGRectElement | null = null;
  highlightSelection(textSelection: TextSelection) {
    // if (/\s+$/.test(textSelection.selection.toString())) { // Check if there is a trailing whitespace
    //   (textSelection.selection as SelectionExtension).modify("extend", "left", "character");
    // }

    const highlight: any = textSelection.selection.anchorNode?.parentElement!;
    // const parentTextElement: any = textSelection.selection.focusNode?.parentElement?.closest("text");
    let bb = highlight.getBBox();
    let g: SVGGElement = document.querySelector("#highlightg")!;
    let [x, y, width, height] = [bb.x, bb.y, bb.width, bb.height];
    let highlightRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    let range = textSelection.selection!.getRangeAt(0);
    // const startX = this.getComputedTextLength(this.randomString(range. - textSelection.startIndex), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;

    const wordOffset = this.getComputedTextLength(this.randomString(range.startOffset), this.visualConfig.textFont);
    highlightRect.setAttribute("x", x + wordOffset);
    highlightRect.setAttribute("y", y);
    const w = this.getComputedTextLength(this.selectedText, this.visualConfig.textFont);
    highlightRect.setAttribute("width", w.toString());
    highlightRect.setAttribute("height", height);
    highlightRect.setAttribute("fill", "#0067D1");
    highlightRect.setAttribute("stroke", "#0067D1");
    // highlightRect.classList.add("highlightRect");
    // if (parentTextElement.classList.contains('highlight-bg')) {
    // highlightRect.classList.add("highlightRect-bg");
    if (this.currentHighlightenText) { this.currentHighlightenText.remove(); }
    this.currentHighlightenText = highlightRect;
    g.insertAdjacentElement("beforebegin", highlightRect);
    // } else {
    //   highlightRect.classList.add("highlightRect-top");
    //   svg.insertBefore(highlightRect, parentTextElement.nextElementSibling);
    // }
  }

  /**
   * Metodo che apre l'annotazione selezionata nell'editor
   * @param id {number} identificativo numerico di un'annotazione
   * @returns {void}
   */
  openAnnotation(id: number) {
    if (this.dragArrow.isDrawing) { //se sto disegnando una relazione non faccio niente
      return;
    }

    if (!id) { //se non ho un id per l'annotazione genero errore ed esco
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Impossibile visualizzare l\'annotazione selezionata'));
      return;
    }

    this.showEditorAndHideOthers(EditorType.Annotation); //visualizzo l'editor di annotazione

    // const ann = this.annotationsRes.annotations.find((a: any) => a.id == id); //cerca fra le annotazioni quella corrente attraverso l'id
    const ann = this.textoAnnotationsRes.find((a: TAnnotation) => a.id == id); //cerca fra le annotazioni quella corrente attraverso l'id

    if (!ann) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Annotazione non trovata'));
      return;
    }

    // if (this._editIsLocked) { //TODO implementare gestione se edit non permesso

    // }

    // this.annotation = { ...ann }
    this.textoAnnotation = ann;
    const computedStart = this.textoAnnotation.start! - (this.offset ?? 0);
    const computedEnd = this.textoAnnotation.end! - (this.offset ?? 0);
    const newSelectedText = this.textRes.join('').substring(computedStart, computedEnd);
    this.selectedText = newSelectedText != '' ? newSelectedText : this.selectedText; // show old value if not selecting a new one
    // this.annotation.layerName = this.layerOptions.find(l => l.value == Number.parseInt(ann.layer))?.label;
    // this.annotation.layerName = this.selectedLayer?.name;

    //this._editIsLocked = true;
  }

  /**p-splitter on resize start event handler */
  onResizeStart(event: any) {
    const annotationElement = document.getElementById('annotationPanelPlaceholder');
    const isAnnotationPanel = event.originalEvent.currentTarget.nextElementSibling.contains(annotationElement);

    if (isAnnotationPanel) {
      this.expandedEditorDiv = true;
      return;
    }

    this.expandedDocumentSectonsDiv = true;
  }

  /**p-splitter on resize end event handler */
  onResizeEnd(event: any) {
    this.documentSectionsSplit = Math.round(event.sizes[0]);
    this.annotationSplitSize = Math.round(event.sizes[2]);

    this.updateTextEditorSize();
  }

  /**
   * Metodo che aggiorna le dimensioni del componente
   * @param newHeight {any} nuova altezza
   */
  updateComponentSize(newHeight: any) {
    this.updateHeight(newHeight);
    this.updateTextEditorSize();
  }

  /**
   * Metodo che aggiorna l'altezza del pannello e del container del testo
   * @param newHeight {any} nuova altezza
   */
  updateHeight(newHeight: any) {
    if (isNaN(newHeight)) { return; }

    this.height = newHeight - Math.ceil(this.visualConfig.jsPanelHeaderBarHeight);
    this.textContainerHeight = this.height - Math.ceil(this.visualConfig.layerSelectHeightAndMargin + this.visualConfig.paddingAfterTextEditor);
  }

  /**Metodo che aggiorna le dimensioni dell'editor di testo */
  updateTextEditorSize() {
    this.scrollingDirection = ScrollingDirectionType.InRange;
    this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
  }

  /**
 * sets the operation that needs to be executed after an annotation is being created
 * @param workingAnnotation 
 * @param newFeaturesList 
 */
  private annotationSavedOperations(workingAnnotation: TAnnotation, newFeaturesList: TAnnotationFeature[]) {
    this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Annotation saved'));
    workingAnnotation.features = newFeaturesList;
    this.onAnnotationSaved(workingAnnotation);
  }

  private updateAnnotationsResult(annotation: TAnnotation) {
    const annotationIndex = this.textoAnnotationsRes.findIndex(a => a.id === annotation.id);

    if (annotationIndex !== -1) {
      this.textoAnnotationsRes.splice(annotationIndex, 1);
    }

    this.textoAnnotationsRes.push(annotation);
  }

  private removeFromAnnotationsResult(annotationId?: number) {
    if (!annotationId) { return; }

    const annotationIndex = this.textoAnnotationsRes.findIndex(a => a.id === annotationId);

    if (annotationIndex !== -1) {
      this.textoAnnotationsRes.splice(annotationIndex, 1);
    }
  }

  /**this is a workaround to fix a rendering problem with the primneg splitter component */
  private fixPrimeNgSplitterPanelInitialSize() {
    const panels: any = document.getElementsByClassName('p-splitter-panel');
    const annotationPanel = panels[2];
    annotationPanel.style.flexBasis = 'calc(' + this.textTileSplitter.panelSizes[2] + '% - ' + ((panels.length - 1) * 4) + 'px)';
  }

  /** inits the text tile splitteer properties */
  private initTextTileSplitterSettings() {
    this.expandedEditorDiv = true;
    this.expandedDocumentSectonsDiv = true;
    this.documentSectionsSplit = this.expandedDocumentSectonsDiv ? this.lateralSplitExpandedSize : this.lateralSplitCollapsedSize;
    this.annotationSplitSize = this.expandedEditorDiv ? this.lateralSplitExpandedSize : this.lateralSplitCollapsedSize;
  }

  /**
   * Function that traverse tree in depth-first (pre-order) manner to find node's index.
   * @returns if found, the index of the the tree that is selected
   */
  private CalculateSectionsTreeIndex(tree: TreeNode[], selectedSection: TreeNode,
    startIndex: number = 0): { found: boolean; index: number } {
    let index: number = startIndex;
    let found = false;
    for (const node of tree) {
      found = node === selectedSection;
      if (found) {
        break;
      }

      index++;
      if (node.expanded) {
        ({ found, index } = this.CalculateSectionsTreeIndex(node.children!, selectedSection, index));
        if (found) {
          break;
        }
      }
    }

    return { found, index };
  }

  /**inits the annotation panele */
  private initAnnotationPanelSettings(expandedEditorDiv?: boolean) {
    this.expandedEditorDiv = expandedEditorDiv ?? true;
    this.annotationSplitSize = this.expandedEditorDiv ? this.lateralSplitExpandedSize : this.lateralSplitCollapsedSize;
  }

  /**
 * This function is the prosecution of the scrolling operation,
 * @param event 
 */
  private updateTextRowsView(event?: any) {
    this.precTextRange = this.textRange.clone();
    this.textRange.resetExtraRowsSpace();

    //#region calcolo start e end
    switch (this.scrollingDirection) {
      case ScrollingDirectionType.Down: //scolling DOWN
        this.textRange.start += this.textRowsWideness;
        this.textRange.end += this.textRowsWideness;

        if (this.textRange.start > this.textTotalRows - this.textRowsWideness) {
          this.textRange.start = this.textTotalRows - this.textRowsWideness;
        }

        if (this.textRange.end > this.textTotalRows) {
          this.textRange.end = this.textTotalRows;
        }

        this.checkAndAddExtraRows(ScrollingDirectionType.Down);
        break;

      case ScrollingDirectionType.Up: //scrolling UP
        this.textRange.start -= this.textRowsWideness;
        this.textRange.end -= this.textRowsWideness;

        if (this.textRange.start < 0) {
          this.textRange.start = 0;
        }

        if (this.textRange.end < this.textRowsWideness) {
          this.textRange.end = this.textRowsWideness;
        }
        this.checkAndAddExtraRows(ScrollingDirectionType.Up);
        break;

      case ScrollingDirectionType.IncreaseWidenessDown:
        this.checkAndAddExtraRows(ScrollingDirectionType.IncreaseWidenessDown);
        break;

      case ScrollingDirectionType.IncreaseWidenessUp: //scrolling UP
        this.checkAndAddExtraRows(ScrollingDirectionType.IncreaseWidenessUp);
        break;

      case ScrollingDirectionType.InRange: //scrolling IN RANGE
        this.textRange.start -= this.textRowsWideness % 2 === 0 ? this.textRowsWideness / 2 : (this.textRowsWideness / 2) + 1;
        this.textRange.end += this.textRowsWideness / 2;

        if (this.textRange.start < 0) {
          this.textRange.start = 0;
        }

        if (this.textRange.end > this.textTotalRows) {
          this.textRange.end = this.textTotalRows;
        }

        //righe extra up
        this.addExtraRowsUp();

        //righe extra down
        this.addExtraRowsDown();
        break;
    }

    //#endregion
    this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
  }

  private checkAndAddExtraRows(scrollingDirection: ScrollingDirectionType) {
    this.addExtraRowsUp();
    this.addExtraRowsDown();
    this.ensureEnoughRowsDown(scrollingDirection);
    this.ensureEnoughRowsUp(scrollingDirection);
  }

  /**
 * @param rowIndex numeric row index
 * @param sectionIndex optional, it's the section index string
 * @returns the string that must put in the sentum column
 */
  public rowSentum(rowIndex: number, sectionIndex?: string): string {
    return sectionIndex ?? (rowIndex + 1).toString();
  }

  /**
   * orchestrator that choose to load data with a new request to the backend or use cached data
   */
  private loadDataOrchestrator(start: number, end: number): void {
    end += this.backendIndexCompensation; //backend use a mixed strategy on range, it's closed on start and open on end so we need to compensate the end index

    const currentVisibleLayersIds = this.selectedLayers?.map(l => l.id!) || [];

    let layersReload = new LayerReload();

    if (this.scrollingDirection !== ScrollingDirectionType.InRange) {

      if (currentVisibleLayersIds.length === 0) {
        this.loadTextOnly(start, end);
        return;
      }

      this.loadData(start, end, currentVisibleLayersIds);
      return;
    }

    if (this.lastRenderedLayers.length === currentVisibleLayersIds.length) {
      layersReload.operation = LayerReloadOperation.Equal;
      this.loadLayersOnly(start, end, layersReload, currentVisibleLayersIds);
      return;
    }

    if (this.lastRenderedLayers.length < currentVisibleLayersIds.length) {
      layersReload.operation = LayerReloadOperation.Add;
      layersReload.layerIds = currentVisibleLayersIds.filter(visible => !this.lastRenderedLayers.includes(visible));
      this.loadLayersOnly(start, end, layersReload, currentVisibleLayersIds);
      return;
    }

    if (this.lastRenderedLayers.length > currentVisibleLayersIds.length) {
      layersReload.operation = LayerReloadOperation.Remove;
      layersReload.layerIds = this.lastRenderedLayers.filter(last => !currentVisibleLayersIds.includes(last));
      this.loadLayersOnly(start, end, layersReload, currentVisibleLayersIds);
      return;
    }

    console.error("No case found in loadDataOrchestrator");
  }

  /**
* Metodo che recupera i dati iniziali relativi a opzioni, testo selezionato, con le sue annotazioni e relazioni
* @returns {void}
*/
  private loadData(start: number, end: number, visibleLayersIds: Array<number>): void {
    if (!this.textId) {
      return;
    }

    this.loaderService.show();
    // this.relation = new Relation();

    forkJoin([
      this.annotationService.retrieveTextSplitted(this.textId, { start: start, end: end }),
      this.annotationService.retrieveResourceAnnotations(this.textId, { start: start, end: end, layers: visibleLayersIds })]).pipe(
        takeUntil(this.unsubscribe$),
        catchError((error: HttpErrorResponse) => {
          this.loaderService.hide();
          return this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
        }),
      ).subscribe(([textResponse, tAnnotationsResponse]) => {
        this.setLayersData(visibleLayersIds, tAnnotationsResponse);
        this.setTextData(textResponse);

        this.renderData();
      });
  }

  /**
* Metodo che recupera i dati iniziali relativi a opzioni, testo selezionato, con le sue annotazioni e relazioni
* @returns {void}
*/
  private loadTextOnly(start: number, end: number): void {
    if (!this.textId) {
      return;
    }

    this.loaderService.show();

    this.annotationService.retrieveTextSplitted(this.textId, { start: start, end: end }).pipe(
      take(1),
    ).subscribe({
      next: (textResponse) => {
        this.setLayersData([], []);
        this.setTextData(textResponse);

        this.renderData();
      },
      error: (error) => {
        this.loaderService.hide();
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
      }
    });
  }

  /**
* Manages the retrieve of the layers data
* @returns {void}
*/
  private loadLayersOnly(start: number, end: number, layersReloadOperation: LayerReload, visibleLayersIds: Array<number>): void {
    this.loaderService.show();

    switch (layersReloadOperation.operation) {
      case LayerReloadOperation.Equal:
        this.renderData();
        return;
      case LayerReloadOperation.Add:
        const addedLayerIds = layersReloadOperation.layerIds;
        this.loadLayersOnlyAdd(start, end, visibleLayersIds, addedLayerIds!);
        return;
      case LayerReloadOperation.Remove:
        const removedLayerIds = layersReloadOperation.layerIds!;
        const lastAnnotationsExceptRemovedOnes = this.textoAnnotationsRes.filter(res => !removedLayerIds.includes(res.layer!.id!));
        this.setLayersData(visibleLayersIds, lastAnnotationsExceptRemovedOnes);
        this.renderData();
        return;
    }
  }

  /**
* Manages the retrieve of the layers to add
* @returns {void}
*/
  private loadLayersOnlyAdd(start: number, end: number, visibleLayersIds: Array<number>, layerIdsToAdd: Array<number>): void {
    if (!this.textId) {
      return;
    }

    this.annotationService.retrieveResourceAnnotations(this.textId, { start: start, end: end, layers: layerIdsToAdd }).pipe(
      take(1),
    ).subscribe({
      next: (tAnnotationsResponse) => {
        this.setLayersData(visibleLayersIds, this.textoAnnotationsRes.concat(tAnnotationsResponse));
        this.renderData();
      },
      error: (error) => {
        this.loaderService.hide();
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
      }
    });
  }

  /**
* set the data related to the text retrieved from the api
* @param textResponse 
*/
  private setTextData(textResponse: PaginatedResponse) {
    this.textTotalRows = textResponse.count!;
    this.textRes = textResponse.data?.map(d => d.text) || [];
    this.textSplittedRows = textResponse.data;
    this.offset = textResponse.data![0].start;
  }

  /**
 * set the data related to the layers retrieved from the api
 * @param visibleLayersIds 
 * @param tAnnotationsResponse 
 */
  private setLayersData(currentVisibleLayersIds: number[], tAnnotationsResponse: TAnnotation[]) {
    this.lastRenderedLayers = currentVisibleLayersIds;
    this.textoAnnotationsRes = tAnnotationsResponse;
  }

  /**
 * @private
 * Metodo che gestisce la renderizzazione del testo annotato
 */
  private renderData() {
    this.initSimplifiedAnnotations();

    this.rows = [];
    const sentences = this.textSplittedRows;
    const row_id = 0;
    let start = 0;

    this.calculateMaxSentumWidth();

    const width = this.svg.nativeElement.clientWidth - 20 - this.visualConfig.stdTextOffsetX;

    const textFont = getComputedStyle(document.documentElement).getPropertyValue('--text-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--text-font-family');
    this.visualConfig.textFont = textFont;

    const annFont = getComputedStyle(document.documentElement).getPropertyValue('--annotation-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--annotations-font-family')
    this.visualConfig.annotationFont = annFont;

    const arcFont = getComputedStyle(document.documentElement).getPropertyValue('--arc-font-size') + " " + getComputedStyle(document.documentElement).getPropertyValue('--arc-font-family')
    this.visualConfig.arcFont = arcFont;

    let linesCounter = 0;
    let yStartRow = 0;
    const lineBuilder = new LineBuilder;

    lineBuilder.yStartLine = 0;

    sentences?.forEach((s: TextSplittedRow) => {
      const sWidth = this.getComputedTextLength(s.text, this.visualConfig.textFont);

      const sLines = new Array<TextLine>();

      const words = s.text.split(/(?<=\s)/g);

      lineBuilder.startLine = start;

      if (sWidth / width > 1) {
        let wordAddedCounter = 0;
        lineBuilder.line = new TextLine();
        let lineWidth = 0;
        lineBuilder.line.text = "";

        words.forEach((w: any) => {
          const wordWidth = this.getComputedTextLength(w, this.visualConfig.textFont);

          if ((lineWidth + wordWidth) <= width) {
            lineBuilder.line.text += w;
            wordAddedCounter++;
            lineWidth += wordWidth;

            if (!lineBuilder.line.words) {
              lineBuilder.line.words = [];
            }

            lineBuilder.line.words.push(w);
          }
          else {
            const line = this.createLine(lineBuilder);
            lineBuilder.yStartLine += line.height;

            sLines.push(JSON.parse(JSON.stringify(line)));

            lineBuilder.startLine += (line.text?.length || 0);
            linesCounter++;

            if (wordAddedCounter != words.length) {
              lineBuilder.line.text = "";
              lineWidth = 0;
              lineBuilder.line.words = [];
              lineBuilder.line.annotationsTowers = [];

              lineBuilder.line.text += w;
              wordAddedCounter++;
              lineWidth += wordWidth;
              lineBuilder.line.words.push(w);
            }
          }

          if (wordAddedCounter == words.length) {
            const line = this.createLine(lineBuilder);
            lineBuilder.yStartLine += line.height;

            sLines.push(JSON.parse(JSON.stringify(line)));

            lineBuilder.startLine += (line.text?.length || 0);
            linesCounter++;
          }
        })
      }
      else {
        lineBuilder.line = new TextLine();
        lineBuilder.line.text = s.text;
        lineBuilder.line.words = words;

        const line = this.createLine(lineBuilder);
        lineBuilder.yStartLine += line.height;

        sLines.push(JSON.parse(JSON.stringify(line)));

        lineBuilder.startLine += (line.text?.length || 0);
        linesCounter++;
      }

      const sLinesCopy = JSON.parse(JSON.stringify(sLines));

      const rowHeight = sLinesCopy.reduce((acc: any, o: any) => acc + o.height, 0);

      this.rows?.push({
        id: row_id + 1,
        height: rowHeight,
        lines: sLinesCopy,
        yBG: yStartRow,
        xText: this.visualConfig.stdTextOffsetX,
        yText: sLinesCopy[0].yText - this.visualConfig.spaceAfterTextLine,
        xSentnum: this.visualConfig.stdSentnumOffsetX,
        ySentnum: sLinesCopy[sLinesCopy.length - 1].yText,
        text: s.text,
        words: words,
        startIndex: start,
        endIndex: start + s.text.length,
        rowIndex: s.absolute,
        sectionIndex: s.index
      })

      yStartRow += rowHeight;
      start += s.text.length;
    })

    this.svgHeight = this.rows.reduce((acc, o) => acc + (o.height || 0), 0);

    this.sentnumVerticalLine = this.generateSentnumVerticalLine();

    this.checkScroll();
  }

  /**
   * Initialize the simplifiedAnns array needed during the rendering process
   */
  private initSimplifiedAnnotations() {
    this.simplifiedAnns = [];
    const layersIndex = new Array<number>();

    this.visibleLayers.forEach(l => {
      if (l.id) {
        layersIndex.push(l.id);
      }
    });

    this.textoAnnotationsRes.forEach(async (a: TAnnotation) => {
      if ((a.start || a.start === 0) && a.end && layersIndex.includes(a.layer?.id!)) {
        const annFeat = a.features ?? [];
        let dictFeat = {};
        annFeat.forEach(f => {
          dictFeat = { ...dictFeat, [f.feature!.name!]: f.value };
        });
        const sAnn = {
          span: <SpanCoordinates>{
            start: a.start - (this.offset ?? 0),
            end: a.end - (this.offset ?? 0)
          },
          layer: a.layer?.id,
          layerName: a.layer?.name,
          value: undefined, //TODO non chiaro quale sia il valore
          imported: undefined,
          attributes: <Record<string, any>>{ ...dictFeat },
          id: a.id,
        };
        this.simplifiedAnns.push(sAnn);
      }
    });

    this.simplifiedAnns.sort((a: any, b: any) => a.span.start < b.span.start);

    // this.simplifiedArcs = []; //TODO inserire valorizzazione da richiesta elenco relazioni
    // this.annotationsRes.annotations.forEach((a: Annotation) => { //cicla sulle annotazioni nella risposta
    //   /*           if (a.attributes && a.attributes["relations"]) {
    //               let sArc = a.attributes["relations"].out.forEach((r: Relation) => {
    //                 if (!this.simplifiedArcs.includes(r) && r.srcLayerId && layersIndex.includes(r.srcLayerId.toString()) && r.targetLayerId && layersIndex.includes(r.targetLayerId.toString())) {
    //                   this.simplifiedArcs.push(r);
    //                 }
    //               })
    //             } */
    // })
  }

  /**
   * Calculates the witdh of the sentum column for the loaded range
   * @returns 
   */
  private calculateMaxSentumWidth() {
    if (!this.showSentum) {
      this.visualConfig.stdTextOffsetX = 5;
      this.visualConfig.stdSentnumOffsetX = 0;
      return;
    }

    const extraSpace = 10;
    const sentumWidthArray = this.textSplittedRows?.map(row => this.getComputedTextLength(this.rowSentum(row.absolute, row.index), this.visualConfig.textFont)) ?? [0];
    const maxSentumWidth = Math.max(...sentumWidthArray) + extraSpace;
    this.visualConfig.stdTextOffsetX = maxSentumWidth > 0 ? maxSentumWidth : this.visualConfig.stdTextOffsetX;

    if (this.visualConfig.stdTextOffsetX > this.visualConfig.maxStdTextOffsetX) { this.visualConfig.stdTextOffsetX = this.visualConfig.maxStdTextOffsetX; }

    this.visualConfig.stdSentnumOffsetX = maxSentumWidth - 5 > 0 ? maxSentumWidth - 5 : this.visualConfig.stdSentnumOffsetX;

    if (this.visualConfig.stdSentnumOffsetX > this.visualConfig.maxStdSentnumOffsetX) { this.visualConfig.stdSentnumOffsetX = this.visualConfig.maxStdSentnumOffsetX; }
  }

  /**
   * Guards that check if user is scrolling in the loaded range
   * @param scroll 
   * @param scrollTop 
   * @returns 
   */
  private isScrollingInLoadedRange(scroll: number, scrollTop: number): boolean {
    if (this.scrollingDirection === ScrollingDirectionType.Up && this.textRange.start === 0) { return true; }

    if (this.scrollingDirection === ScrollingDirectionType.Up && scrollTop !== 0) { return true; }

    if (this.scrollingDirection === ScrollingDirectionType.Down && this.textRange.end === this.textTotalRows) { return true; }

    let isFirefox = false;
    if (navigator.userAgent.match(/firefox|fxios/i)) { isFirefox = true; }

    if (!isFirefox && this.scrollingDirection === ScrollingDirectionType.Down && scroll < this.svgHeight) { return true; }

    if (isFirefox && this.scrollingDirection === ScrollingDirectionType.Down && this.textContainer.nativeElement.scrollTop < this.textContainer.nativeElement.scrollTopMax) { return true; }

    return false;
  }

  /**
   * Verifies number of loaded text rows, checks and sets scrollbar height offset.
   * @returns 
   */
  private checkScroll() {
    this.cdref.detectChanges();
    let scrollable = this.svgHeight > this.textContainer.nativeElement.clientHeight;

    if (!scrollable && this.textTotalRows === this.textRange.end) {
      this.loaderService.hide();
      return;
    }

    if (!scrollable) {
      this.textRowsWideness = this.textRowsRangeWidenessPredictor(10);

      //Triggers th OnScroll event
      // this.textContainer.nativeElement.scrollTop = this.lastScrollTop + 1;
      this.scrollingDirection = ScrollingDirectionType.IncreaseWidenessDown;
      this.updateTextRowsView();
      return;
    }

    if (this.scrollingDirection === ScrollingDirectionType.Init) {
      this.loaderService.hide();
      return;
    }

    this.scrollingRowIndex = this.getScrollingRowIndex(this.scrollingDirection);
    const scrollTop = this.calculateScrollTop(this.scrollingDirection, this.scrollingRowIndex);

    if (scrollTop <= 0 && this.textRange.start != 0) {
      this.scrollingDirection = ScrollingDirectionType.IncreaseWidenessUp;
      this.enableIncreaseWidenessOperation();
      this.updateTextRowsView();
      return;
    }

    if (this.scrollBarReachesBottomOfTile(scrollTop) && this.textRange.end < this.textTotalRows) {
      this.scrollingDirection = ScrollingDirectionType.IncreaseWidenessDown;
      this.enableIncreaseWidenessOperation();
      this.updateTextRowsView();
      return;
    }

    this.disbaleIncreaseWidenessOperation();

    //setTimeout it's used for UI synchronization, sometimes the UI is not rendered and we cannot set the right scrollTop
    setTimeout(() => {
      //Trigger OnScroll event
      this.executeScrollTopOperation(scrollTop);
    }, 0);

    this.lastScrollTop = scrollTop;
    this.lastscrollTopPercentage = Math.round((this.lastScrollTop / this.svgHeight) * 100) / 100;

    //Prevents infinite loop between onScroll and checkScroll
    this.preventOnScrollEvent = true;

    this.loaderService.hide();
  }

  /**this cover the case when we are resizing the lateral panels (navigation and annotation divs)
   * and the bar reaches the bottom of the tile without generating the scroll event because we are scrolling in range
   */
  private scrollBarReachesBottomOfTile(scrollTop: number): boolean {
    return this.svgHeight <= this.textContainer.nativeElement.clientHeight + scrollTop;
  }

  /** disbales the increase wideness operation */
  private disbaleIncreaseWidenessOperation() {
    switch (this.scrollingDirection) {
      case ScrollingDirectionType.IncreaseWidenessUp:
        this.scrollingDirection = ScrollingDirectionType.Up;
        break;
      case ScrollingDirectionType.IncreaseWidenessDown:
        this.scrollingDirection = ScrollingDirectionType.Down;
        break;
    }
  }

  /**
 * Execute a scrolltop operation that is reflected in a movement of the lateral bar on the UI
 * @param scrollTop 
 * @returns 
 */
  private executeScrollTopOperation(scrollTop: number) {
    if (this.gotoSavedScrollTop) {
      this.textContainer.nativeElement.scrollTop = this.savedScrollTop;
      this.gotoSavedScrollTop = false;
      return;
    }

    this.textContainer.nativeElement.scrollTop = scrollTop;
  }

  //**sets data to perform a scroll top operation in the current position */
  private setScrollTopOperationInRange() {
    this.scrollingDirection = ScrollingDirectionType.InRange;
    this.gotoSavedScrollTop = true;
    this.savedScrollTop = this.textContainer.nativeElement.scrollTop;
  }

  /**Calculates the scroll top heigth respect to the scrolling row index and the scroll direction */
  private calculateScrollTop(scrollingDirection: ScrollingDirectionType, scrollingRowIndex: number) {
    let scrolledBlockSize = 0;
    let extraScrollPixels = 0;

    switch (scrollingDirection) {
      case ScrollingDirectionType.IncreaseWidenessDown:
      case ScrollingDirectionType.Down: {

        scrolledBlockSize = this.rows.filter(r => r.rowIndex! <= scrollingRowIndex - 1).reduce((acc, o) => acc + (o.height || 0), 0);
        let scrollingRow = this.rows.filter(r => r.rowIndex === scrollingRowIndex)[0];

        const scrollingRowHeight = scrollingRow?.height || 0;
        if (scrollingRow === undefined) {
          console.group('scrolling row undefined');
          console.warn('end index', this.precTextRange!.end);
          console.info('rows', this.rows);
          console.groupEnd();
        }
        if (scrollingRow?.height === undefined) {
          console.warn('scrolling row height undefined', scrollingRow);
        }
        extraScrollPixels = this.textContainer.nativeElement.clientHeight - scrollingRowHeight;
        break;
      }
      case ScrollingDirectionType.IncreaseWidenessUp:
      case ScrollingDirectionType.Up:
        scrolledBlockSize = this.rows.filter(r => r.rowIndex! < scrollingRowIndex).reduce((acc, o) => acc + (o.height || 0), 0);
        break;
      case ScrollingDirectionType.InRange:
        if (!this.currentVisibleRowIndex) {
          const scrollTop = this.svgHeight * this.lastscrollTopPercentage;
          return scrollTop;
        }

        scrolledBlockSize = this.rows.filter(r => r.rowIndex! < this.currentVisibleRowIndex!).reduce((acc, o) => acc + (o.height || 0), 0);
        this.currentVisibleRowIndex = undefined;
        break;
      case ScrollingDirectionType.Init:
      case ScrollingDirectionType.ChangingSection:
        break;
    }

    let scrollTop = scrolledBlockSize - extraScrollPixels;

    return scrollTop;
  }

  /** gets ther right scrolling row index, starting from a scrolling direction */
  getScrollingRowIndex(scrollingDirection: ScrollingDirectionType): number {
    let scrollingRowIndex;

    switch (scrollingDirection) {
      case ScrollingDirectionType.Up:
        scrollingRowIndex = this.precTextRange!.start;
        break;
      case ScrollingDirectionType.Init:
      case ScrollingDirectionType.Down:
        scrollingRowIndex = this.precTextRange!.end;
        break;
      case ScrollingDirectionType.InRange:
      case ScrollingDirectionType.IncreaseWidenessDown:
      case ScrollingDirectionType.IncreaseWidenessUp:
        scrollingRowIndex = this.scrollingRowIndex;
        break;
      case ScrollingDirectionType.ChangingSection:
        scrollingRowIndex = this.currentVisibleRowIndex ?? this.scrollingRowIndex;
        break;
    }

    if (scrollingRowIndex % 1 != 0) { //useful for debug
      console.group('scrolling rowindex decimal');
      console.warn('prec start index', this.precTextRange!.start);
      console.warn('prec end index', this.precTextRange!.end);
      console.info('rows', this.rows);
      console.groupEnd();
      scrollingRowIndex = Math.trunc(this.precTextRange!.end); //remove decimals otherwise it doesn't find matching rowIndex
    }

    return scrollingRowIndex;
  }

  /** sets the operations needed for the increasing wideness operation,
   * this is useful when we need to increase the widness of the extra range, 
   * during the next rendering cycle
   */
  enableIncreaseWidenessOperation() {
    switch (this.scrollingDirection) {
      case ScrollingDirectionType.Up:
      case ScrollingDirectionType.IncreaseWidenessUp:
        this.scrollingDirection = ScrollingDirectionType.IncreaseWidenessUp;
        break;

      case ScrollingDirectionType.Down:
      case ScrollingDirectionType.IncreaseWidenessDown:
        this.scrollingDirection = ScrollingDirectionType.IncreaseWidenessDown;
        break;
      case ScrollingDirectionType.InRange:
        console.warn("Custom scroll row index has no effect when set in range");
    }

    this.extraRowsWidenessUpOrDown = this.extraTextRowsWidenessPredictor(25);
  }

  /**
   * Calculates initial number of text rows to be load
   * @param extraRows Extra text rows to sum at the calculated ones
   * @returns Number of text rows to be loaded
   */
  private textRowsRangeWidenessPredictor(extraRows?: number): number {
    let arbitraryRowSizeInPixels = 50;
    let arbitraryExtraRows = extraRows ?? 5;
    return Math.ceil(this.textContainer.nativeElement.offsetHeight / arbitraryRowSizeInPixels) + arbitraryExtraRows;
  }

  /**
   * Calculates number of extra text rows to be loaded
   * @returns 
   */
  private extraTextRowsWidenessPredictor(estimatedSingleRowSizeInPixels: number = 50): number {
    return Math.ceil(this.textContainer.nativeElement.offsetHeight / estimatedSingleRowSizeInPixels);
  }

  /**
   * Aggiunge le righe aggiuntive superiormente, necessarie al range di testo
   * Adds the number of text rows that needs to be loaded on top of the range
   */
  private addExtraRowsUp() {
    if (this.textRange.start - this.extraRowsWidenessUpOrDown >= 0
      && !this.textRange.hasExtraRowsBeforeStart) {
      this.textRange.extraRowsBeforeStart = this.extraRowsWidenessUpOrDown;
      return;
    };

    this.textRange.extraRowsBeforeStart = this.textRange.start;
  }

  /**
 * Aggiunge le righe aggiuntive inferiormente, necessarie al range di testo
 * Adds the number of text rows that needs to be loaded down the range
 */
  private addExtraRowsDown() {
    if (this.textRange.end + this.extraRowsWidenessUpOrDown <= this.textTotalRows
      && !this.textRange.hasExtraRowsAfterEnd) {
      this.textRange.extraRowsAfterEnd = this.extraRowsWidenessUpOrDown;
    };
  }

  /**
   * Ensures that there are enough rows when scrolling down
   */
  private ensureEnoughRowsDown(scrollingDirection: ScrollingDirectionType) {
    switch (scrollingDirection) {
      case ScrollingDirectionType.IncreaseWidenessDown:
      case ScrollingDirectionType.Down:
        const scrollingRowIndex = this.getScrollingRowIndex(scrollingDirection);

        if (this.textRange.end < scrollingRowIndex) {
          this.textRange.extraRowsAfterEnd = scrollingRowIndex - this.textRange.end + this.extraRowsWidenessUpOrDown;
        }

        if (this.textRange.end === scrollingRowIndex) {
          this.textRange.extraRowsAfterEnd += 5;
        }

        if (this.textRange.end > this.textTotalRows) {
          this.textRange.extraRowsAfterEnd -= (this.textRange.end - this.textTotalRows);
        };
        return;
      default:
        return;
    }
  }

  /**
 * Ensures that there are enough rows when scrolling up
 */
  private ensureEnoughRowsUp(scrollingDirection: ScrollingDirectionType) {
    switch (scrollingDirection) {
      case ScrollingDirectionType.IncreaseWidenessUp:
      case ScrollingDirectionType.Up:
        const scrollingRowIndex = this.getScrollingRowIndex(scrollingDirection);

        if (this.textRange.start > scrollingRowIndex) {
          this.textRange.extraRowsBeforeStart = this.textRange.start - scrollingRowIndex + this.extraRowsWidenessUpOrDown;
        }

        if (this.textRange.start === scrollingRowIndex) {
          this.textRange.extraRowsBeforeStart += 5;
        }

        if (this.textRange.start < 0) {
          this.textRange.extraRowsBeforeStart += this.textRange.start;
        };
        return;
      default:
        return;
    }
  }

  private expandRecursive(node: TreeNode, isExpand: boolean) {
    node.expanded = isExpand;
    if (node.children) {
      node.children.forEach(childNode => {
        this.expandRecursive(childNode, isExpand);
      });
    }
  }

  /**
   * Adapter for data coming from backend service, to the primeng component tree
   * @param sectionsResponse Backend service data
   * @param documentName Opened text name
   * @returns 
   */
  private adaptToDocumentTree(sectionsResponse: Section[], documentName: string): Array<TreeNode> {
    let documentTree: Array<TreeNode> =
      [
        {
          label: documentName,
          data: {},
          key: this.rootNodeKey,
          icon: "pi pi-file",
          children: []
        }
      ];

    let children = sectionsResponse.map(section => this.adaptSectionToTreeNode(section, documentTree[0]));
    documentTree[0].children = children;

    return documentTree;
  }

  /**
   * Adapter to a primeng node
   * @param section 
   * @param parent 
   * @returns 
   */
  private adaptSectionToTreeNode(section: Section, parent: TreeNode): TreeNode {
    if (section.children === undefined
      || section.children === null
      || section.children.length === 0) {

      return {
        key: section.id.toString(),
        label: section!.title,
        data: {
          index: section!.index,
          start: section.row_start,
          end: section.row_end,
          parent: parent
        },
        icon: "pi pi-file"
      };
    }


    const node = {
      key: section.id.toString(),
      label: section.title,
      data: {
        index: section!.index,
        start: section.row_start,
        end: section.row_end,
        parent: parent
      },
      children: [],
      icon: "pi pi-file"
    } as TreeNode

    let children = section.children.map(s => this.adaptSectionToTreeNode(s, node));
    node.children = children;

    return node;
  }

  /**
   * Find the section that contains the index
   * @param index row index
   * @returns 
   */
  private findSectionByIndex(index: number): TreeNode | null {
    let rootNode = this.documentSections.find(s => s.key == this.rootNodeKey)!;
    return this.searchSectionByIndex(rootNode.children ?? [], index);
  }

  /**
   * Funzione ricorsiva di ricerca del nodo per indice di riga
   * Recursively search for a section that contains a row index
   * @param nodes 
   * @param index row index to search
   * @returns 
   */
  private searchSectionByIndex(nodes: TreeNode[], index: number): TreeNode | null {
    for (const node of nodes) {
      if (this.isIndexInRange(index, node.data.start, node.data.end)) {
        if (node.children) {
          const childResult = this.searchSectionByIndex(node.children, index);
          if (childResult) {
            return childResult;
          }
        }
        return node;
      }
    }
    return null;
  }

  private isIndexInRange(index: number, start: number, end: number): boolean {
    return index >= start && index <= end;
  }

  private saveFeatureAnnotation(annotation: TAnnotation, feature: TFeature, value: string): Observable<TAnnotationFeature> {
    const newAnnFeat = new TAnnotationFeature();
    newAnnFeat.annotation = annotation;
    newAnnFeat.feature = feature;
    newAnnFeat.value = value;
    return this.annotationService.createAnnotationFeature(newAnnFeat);
  }

  private createNewAnnotation(annotation: TAnnotation) {
    const promise = new Promise<TAnnotation>((resolve, reject) => {
      this.annotationService.createAnnotation(annotation).pipe(
        take(1),
      ).subscribe({
        next: (newAnn) => {
          resolve(newAnn);
        },
        error: (error) => {
          reject(error);
          this.commonService.throwHttpErrorAndMessage(error, `Saving annotation failed: ${error.error.message}`);
        }
      });
    });
    return promise;
  }

  private createLine(auxLineBuilder: any) {
    const startIndex = auxLineBuilder.startLine;
    const endIndex = auxLineBuilder.startLine + auxLineBuilder.line.text.length;

    const resAnns = this.renderAnnotationsForLine(startIndex, endIndex);
    const lineTowers = resAnns.lineTowers;
    const lineHighlights = resAnns.lineHighLights;

    // const resArcs = this.renderArcsForLine(startIndex, endIndex, lineTowers);

    let lineHeight = this.getStdLineHeight();

    if (lineTowers.length > 0) {
      const towerH = this.getMaxTowerPosition(lineTowers)
      lineHeight = this.getStdLineHeight() + towerH + this.visualConfig.curlyHeight + 1;
    }

    let arcH = 0;

    // if (resArcs.length > 0) {
    //   arcH = this.getMaxArcOffset(resArcs) + 2 + this.visualConfig.arcSpacing;
    // }

    const newPossibleHeight = this.getStdLineHeight() + arcH;

    if (newPossibleHeight > lineHeight) {
      lineHeight = newPossibleHeight;
    }

    const yStartLine = auxLineBuilder.yStartLine + lineHeight;
    const yText = yStartLine - this.visualConfig.spaceAfterTextLine;
    const yAnnotation = yText - this.visualConfig.stdTextLineHeight - this.visualConfig.spaceBeforeTextLine - 1;

    lineTowers.forEach((t) => {
      t.tower.forEach((ann: any) => {
        ann.y = yAnnotation - this.visualConfig.curlyHeight - 1 - ann.yOffset - t.yTowerOffset;
        ann.textCoordinates.y = ann.y + ann.height - 2;
      })

      if (t.tower.length != 0) {
        t.curlyPath = this.generateCurlyPath(t.tower[0])
      }
    })

    // resArcs.forEach((ar) => {
    //   const sAnn = this.findAnnotationInTowers(ar.relation.sourceAnn.id, lineTowers);
    //   const tAnn = this.findAnnotationInTowers(ar.relation.targetAnn.id, lineTowers);

    //   switch (ar.type) {
    //     case "includedArc": {
    //       ar.start.y = sAnn.y + this.visualConfig.annotationHeight / 2;
    //       ar.end.y = tAnn.y + this.visualConfig.annotationHeight / 2;

    //       const diffH = yAnnotation - Math.max(ar.start.y, ar.end.y)
    //       ar.yArcOffset = yAnnotation + diffH - ar.yArcOffset;

    //       break;
    //     }

    //     case "startedArc": {
    //       ar.start.y = sAnn.y + this.visualConfig.annotationHeight / 2;
    //       ar.end.y = sAnn.y + this.visualConfig.annotationHeight / 2;

    //       const diffH = yAnnotation - Math.max(ar.start.y, ar.end.y)
    //       ar.yArcOffset = yAnnotation + diffH - ar.yArcOffset;

    //       break;
    //     }

    //     case "endedArc": {
    //       ar.start.y = tAnn.y + this.visualConfig.annotationHeight / 2;
    //       ar.end.y = tAnn.y + this.visualConfig.annotationHeight / 2;

    //       const diffH = yAnnotation - Math.max(ar.start.y, ar.end.y)
    //       ar.yArcOffset = yAnnotation + diffH - ar.yArcOffset;

    //       break;
    //     }

    //     case "passingArc": {
    //       ar.yArcOffset = yAnnotation - ar.yArcOffset;
    //       ar.start.y = ar.yArcOffset;
    //       ar.end.y = ar.yArcOffset;
    //       break;
    //     }

    //     default: {
    //       break;
    //     }
    //   }

    //   const paths = this.generateArcPath(ar);

    //   ar.firstSegmentPath = paths.firstSegmentPath;
    //   ar.secondSegmentPath = paths.secondSegmentPath;

    //   if (ar.circleVisible) {
    //     ar.circleStartX = Math.min(ar.firstSegment.start, ar.secondSegment.end) + Math.abs(ar.firstSegment.start - ar.secondSegment.end) / 2 - this.visualConfig.arcCircleLabelPlaceholderWidth / 2;
    //     ar.circleStartY = ar.yArcOffset + ar.yAnnOffset - this.visualConfig.arcCircleLabelPlaceholderHeight / 2;
    //     ar.circleHeight = this.visualConfig.arcCircleLabelPlaceholderHeight;
    //     ar.circleWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
    //   }
    //   else {
    //     ar.label.yArcLabel = ar.yArcOffset + 3;
    //   }
    // })

    const yHighlight = yText - this.visualConfig.stdTextLineHeight + 5;

    lineHighlights.forEach((h) => {
      h.coordinates.y = yHighlight;
    })

    const line = {
      text: auxLineBuilder.line.text,
      words: auxLineBuilder.line.words,
      height: lineHeight,
      yText: yText,
      x: this.visualConfig.stdTextOffsetX,
      startIndex: auxLineBuilder.startLine,
      endIndex: auxLineBuilder.startLine + auxLineBuilder.line.text.length,
      annotationsTowers: lineTowers,
      yAnnotation: yAnnotation,
      highlights: lineHighlights,
      yHighlight: yHighlight,
      // arcs: resArcs
    }

    return line;
  }

  /**
   * @private
   * Metodo che calcola la label da assegnare a un'annotazione
   * @param layer {Layer|undefined} layer dell'annotazione
   * @param annotation {any} annotazione della quale creare la label
   * @param maxLengthComputed {number} massima lunghezza possibile della label
   * @returns {string} label dell'annotazione
   */
  private elaborateAnnotationLabel(layer: Layer | undefined, annotation: any, maxLengthComputed: number) {
    let labelText = "";

    if (!annotation || !annotation.attributes || !annotation.attributes['features']) {
      labelText = layer?.name || layer?.id as unknown as string || "";
    }
    else {
      //GESTIONE BUG SULLE API CASH
      //non viene restituito un array di feature nel caso ci sia una sola feature
      //ma solo un elemento feature
      if (!Array.isArray(annotation.attributes['features'])) {
        annotation.attributes['features'] = new Array(annotation.attributes['features']);
      }

      const features = annotation.attributes['features'];
      const stringsToJoin = new Array<string>();
      features.forEach((f: any) => {
        if (f.value && !f.valueLabel) {
          stringsToJoin.push(f.value as unknown as string);
        }
        else if (f.value && f.valueLabel) {
          stringsToJoin.push(f.valueLabel as unknown as string);
        }
        else {
          stringsToJoin.push(" ");
        }
      })
      labelText = stringsToJoin.join(" | ");
    }

    labelText = labelText.trim();

    let labelLength = this.getComputedTextLength(labelText, this.visualConfig.annotationFont);
    const oneCharW = this.getComputedTextLength('.', this.visualConfig.annotationFont);

    let counter = 0;
    if (labelLength > maxLengthComputed) {
      while (labelLength > maxLengthComputed) {
        counter++;
        labelLength -= oneCharW;
      }

      labelText = labelText.substring(0, labelText.length - counter - this.visualConfig.labelEllipsisText.length) + this.visualConfig.labelEllipsisText;
    }

    return labelText;
  }

  private generateCurlyPath(ann: any): string {
    const y = (ann.y + this.visualConfig.annotationHeight + 2)
    const move = "M " + ann.startX + " " + (y + this.visualConfig.curlyHeight);
    const x = ann.startX + (ann.endX - ann.startX) / 2
    const curve1 = "C " + ann.startX + " " + y + ", " + x + " " + (y + this.visualConfig.curlyHeight) + ", " + x + " " + y
    const curve2 = "C " + x + " " + (y + this.visualConfig.curlyHeight) + ", " + ann.endX + " " + y + ", " + ann.endX + " " + (y + this.visualConfig.curlyHeight)

    return move + " " + curve1 + " " + curve2;
  }

  /**
   * @private
   * Metodo che dato un id numerico calcola l'id per la sua evidenziazione
   * @param id {number} identificativo numerico
   * @returns {string} identificativo per evidenziazione
   */
  private generateHighlightId(id: number) {
    return "h-" + id;
  }

  private generateSentnumVerticalLine() {
    const x = this.visualConfig.stdSentnumOffsetX + this.visualConfig.spaceBeforeVerticalLine;
    return "M " + x + " 0 L " + x + " " + this.svgHeight;
  }

  private getComputedTextLength(text: string, font: string) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return text.length;
    }

    context.font = font || getComputedStyle(document.body).font;

    return context.measureText(text).width;
  }

  /**
   * @private
   * Metodo che recupera gli indici della selezione sul testo
   * @returns {TextSelection|undefined} selection e indici iniziale e finale della selezione se presente
   */
  //TODO valutare se ripristinare la funzione al suo stato originale ed eliminare classe TextSelection
  private getCurrentTextSelection(): TextSelection | null {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount <= 0) {
      return null;
    }

    const range = selection!.getRangeAt(0);

    if (selection.isCollapsed) //there is no selection just click
    {
      return null;
    }

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(this.svg.nativeElement);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const selectionStart = [...preSelectionRange.toString()].length;
    const selectionEnd = selectionStart + [...range.toString()].length;

    let textSelection = new TextSelection();
    textSelection.selection = selection!;
    textSelection.startIndex = selectionStart;
    textSelection.endIndex = selectionEnd;

    return textSelection;
  }

  private getMaxTowerPosition(array: any[]) {
    return Math.max(...array.map(o => (o.towerHeight + o.yTowerOffset)))
  }

  private getStdLineHeight() {
    return this.visualConfig.spaceBeforeTextLine + this.visualConfig.spaceAfterTextLine + this.visualConfig.stdTextLineHeight;
  }

  /**
   * @private
   * Metodo che data una stringa verifica se è composta da soli spazi
   * @param str {string} stringa da modificare
   * @returns {boolean} definisce se la stringa è composta da soli spazi
   */
  private onlySpaces(str: string) {
    return str.trim().length === 0;
  }

  private randomString(length: number) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = 0; i < length; i++) {
      text += possible[Math.floor(Math.random() * possible.length)];
    }
    return text;
  }

  /**
   * @private
   * Metodo che gestisce la renderizzazione delle annotazioni per una line
   * @param startIndex {number} indice iniziale
   * @param endIndex {number} indice finale
   * @returns {{lineTowers: any[], lineHighLights:TextHighlight[]}} dati delle annotazioni per la line
   */
  private renderAnnotationsForLine(startIndex: number, endIndex: number) {
    const lineTowers = new Array();
    const lineHighlights = new Array<TextHighlight>();

    // const localAnns = this.simplifiedAnns.filter((a: any) => (a.span.start >= (startIndex || 0) && a.span.end <= (endIndex || 0)));

    // Da completare la gestione delle annotazioni su più linee //TODO implementare gestione annotazioni su tower diverse
    const localAnns = this.simplifiedAnns.filter((a: any) =>
      (a.span.start >= (startIndex || 0) && a.span.end <= (endIndex || 0)) || //caso standard, inizia e finisce sulla riga
      (a.span.start < (startIndex || 0) && a.span.end >= (startIndex || 0) && a.span.end <= (endIndex || 0)) || //inizia prima della riga e finisce dentro la riga
      (a.span.start >= (startIndex || 0) && a.span.start < (endIndex || 0) && a.span.end > (endIndex || 0)) || //inizia nella riga e finisce oltre la riga
      (a.span.start < (startIndex || 0) && a.span.end > (endIndex || 0)));

    localAnns.sort((a: any, b: any) => (a.span.end - a.span.start) - (b.span.end - b.span.start));

    localAnns.map((a: any) => {
      if (a.span.start >= (startIndex || 0) && a.span.end <= (endIndex || 0)) {
        return a;
      }
      const temp = { ...a };
      if (a.span.start < (startIndex || 0) && a.span.end <= endIndex) {
        const difference = startIndex - a.span.start;
        temp.span.end = a.span.end - difference;
      }
      return temp;
    });

    const towers = this.sortFragmentsIntoTowers(localAnns);

    towers.forEach((t: any) => {
      const annTower = new Array();
      let yAnnOffset = 0;

      t.anns.forEach((ann: any) => {
        const layer = this.layersList.find(l => l.id == Number.parseInt(ann.layer));
        const startX = this.getComputedTextLength(this.randomString(t.span.start - (startIndex || 0)), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;
        const w = this.getComputedTextLength(this.randomString(t.span.end - t.span.start), this.visualConfig.textFont);
        const endX = startX + w;
        const text = this.elaborateAnnotationLabel(layer, ann, w);
        const textAnnLenght = this.getComputedTextLength(text, this.visualConfig.annotationFont);

        // console.log(w, startX + (w/2) - (textAnnLenght/2), this.randomString(t.span.end - t.span.start))

        annTower.push({
          color: '#000',
          bgColor: layer?.color,
          borderColor: '#808080',
          text: text,
          textCoordinates: {
            x: Math.ceil(startX + w / 2),
            y: 0
          },
          startX: startX,
          width: w,
          endX: endX,
          height: this.visualConfig.annotationHeight,
          yOffset: yAnnOffset, //permette di distribuire in verticale le annotazioni
          id: ann.id
        })

        yAnnOffset += this.visualConfig.annotationHeight

        lineHighlights.push({
          bgColor: layer?.color,
          coordinates: {
            x: startX - 1,
            y: 0
          },
          height: this.visualConfig.stdTextLineHeight - 2,
          width: w + 2,
          id: this.generateHighlightId(ann.id) //serve successivamente per riaprire annotazione //TODO verificare come gestire con nuovo BE
        })
      })

      //vado a verificare se sono state già inserite delle torri nella parola/e corrente
      const minorTowers = lineTowers.filter((lt) => (lt.spanCoordinates.start >= t.span.start && lt.spanCoordinates.end <= t.span.end) || (lt.spanCoordinates.start < t.span.start && lt.spanCoordinates.end > t.span.start) || (lt.spanCoordinates.start < t.span.end && lt.spanCoordinates.end > t.span.end));

      let yOffset = 0;

      yOffset = minorTowers.reduce((acc: any, o: any) => acc + o.towerHeight, 0);

      const minorTowersGroupedByYtowerOffset = minorTowers.reduce((a, { yTowerOffset, ...rest }) => {
        const key = `${yTowerOffset}`;
        a[key] = a[key] || { yTowerOffset, towers: [] };
        a[key]["towers"].push(rest)
        return a;
      }, {});

      let towersGroups = [];
      towersGroups = Object.values(minorTowersGroupedByYtowerOffset);

      if (towersGroups.length > 0) {
        const maxGroup: any = towersGroups.reduce((max: any, tGroup: any) => max.yTowerOffset > tGroup.yTowerOffset ? max : tGroup);
        const higherTowersGroupHeight = Math.max(...maxGroup.towers.map((o: any) => (o.towerHeight)))

        yOffset = maxGroup.yTowerOffset + higherTowersGroupHeight;
        yOffset += (this.visualConfig.curlyHeight + 3);
      }

      lineTowers.push({
        spanCoordinates: t.span,
        tower: annTower,
        towerHeight: annTower.length * this.visualConfig.annotationHeight,
        yTowerOffset: yOffset
      })
    })

    if (this.specialSelectionAnnotation.active &&
      (this.specialSelectionAnnotation.start >= (startIndex || 0) && this.specialSelectionAnnotation.end <= (endIndex || 0)) || //caso standard, inizia e finisce sulla riga
      (this.specialSelectionAnnotation.start < (startIndex || 0) && this.specialSelectionAnnotation.end >= (startIndex || 0) && this.specialSelectionAnnotation.end <= (endIndex || 0)) || //inizia prima della riga e finisce dentro la riga
      (this.specialSelectionAnnotation.start >= (startIndex || 0) && this.specialSelectionAnnotation.start < (endIndex || 0) && this.specialSelectionAnnotation.end > (endIndex || 0)) || //inizia nella riga e finisce oltre la riga
      (this.specialSelectionAnnotation.start < (startIndex || 0) && this.specialSelectionAnnotation.end > (endIndex || 0))) {
      const startX = this.getComputedTextLength(this.randomString(this.specialSelectionAnnotation.start - (startIndex || 0)), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;
      const w = this.getComputedTextLength(this.randomString(this.specialSelectionAnnotation.end - this.specialSelectionAnnotation.start), this.visualConfig.textFont);
      lineHighlights.push({
        bgColor: this.specialSelectionAnnotation.color,
        coordinates: {
          x: startX - 1,
          y: 0
        },
        height: this.visualConfig.stdTextLineHeight - 2,
        width: w + 2,
        id: this.specialSelectionAnnotation.id
      })
    }

    return {
      lineTowers: lineTowers,
      lineHighLights: lineHighlights
    };
  }

  /**
   * @private
   * Metodo che visualizza il tipo di editor richiesto e nasconde eventuali altri editor
   * @param name {EditorType} nome del tipo di editor
   * @returns {void}
   */
  private showEditorAndHideOthers(name: EditorType) {
    switch (name) {
      case EditorType.Annotation: {
        this.showAnnotationEditor = true;
        this.showRelationEditor = false;
        break;
      }

      case EditorType.Relation: {
        this.showAnnotationEditor = false;
        this.showRelationEditor = true;
        break;
      }

      default: {
        this.showAnnotationEditor = true;
        this.showRelationEditor = false;
        return;
      }
    }
  }

  /**
   * Raggruppa le annotazioni nelle torri, per vedere quelle che hanno gli stessi limiti (annotazioni su una stessa parola vanno a formare una torre)
   * @param annotations
   * @returns
   */
  private sortFragmentsIntoTowers(annotations: any[]) {
    const towers = annotations.reduce((a, { span, ...rest }) => {
      const key = `${span.start}-${span.end}`;
      a[key] = a[key] || { span, anns: [] };
      a[key]["anns"].push(rest)
      return a;
    }, {});

    return Object.values(towers);
  }

  // /**Metodo che annulla una relazione (intercetta emissione del relation editor) */
  // onRelationCancel() {
  //   this.relation = new Relation();
  //   this.textoAnnotation = new TAnnotation();
  //   this.showEditorAndHideOthers(EditorType.Annotation);
  // }

  // /**Metodo che annulla una relazione (intercetta emissione del relation editor) */
  // onRelationDeleted() {
  //   this.relation = new Relation();
  //   this.showEditorAndHideOthers(EditorType.Annotation);
  //   this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
  // }

  // /**Metodo che annulla una relazione (intercetta emissione del relation editor) */
  // onRelationSaved() {
  //   this.relation = new Relation();
  //   this.showEditorAndHideOthers(EditorType.Annotation);
  //   this.loadDataOrchestrator(this.textRange.start, this.textRange.end);
  // }

  // private computeArcOffset(lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, lineArcs: Array<any>, startArcX: number, endArcX: number, arcType: string) {
  //   let spaceFactor = 1;
  //   if (arcType == "includedArc") {
  //     spaceFactor = 2;
  //   }

  //   const towerH = this.getMaxTowerAroundAnns(lineTowers, sourceSpanLimit, targetSpanLimit);
  //   const yBaseOffset = this.visualConfig.arcSpacing * spaceFactor;
  //   let yOffset = yBaseOffset;

  //   if (towerH > 0) {
  //     yOffset += towerH;
  //   }

  //   const maxRelationOffset = this.getMaxArcOffsetInRange(lineArcs, startArcX, endArcX);
  //   const adjustOffset = yOffset == yBaseOffset ? yOffset : 0;
  //   const newPossibleOffset = adjustOffset + maxRelationOffset + this.visualConfig.arcSpacing * 2 / spaceFactor;

  //   if (maxRelationOffset >= 0 && newPossibleOffset > yOffset) {
  //     yOffset = newPossibleOffset;
  //   }

  //   return yOffset;
  // }

  // private computeStartAndEndXPosition(sourceSpanLimit: number, targetSpanLimit: number, startIndex: number) {
  //   const startArcX = this.getComputedTextLength(this.randomString(sourceSpanLimit - (startIndex || 0)), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;
  //   const endArcX = this.getComputedTextLength(this.randomString(targetSpanLimit - (startIndex || 0)), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;

  //   return {
  //     startArcX: startArcX,
  //     endArcX: endArcX
  //   }
  // }

  /**
* @private
* Metodo che calcola la label da assegnare a un arco di relazione
* @param name {string} nome della relazione
* @returns {{labelText: string, textWidth: number, labelWidth: number}} dati per la label dell'arco
*/
  // private elaborateArcLabel(name: string) {
  //   let labelText = "";

  //   if (name.trim().length > this.visualConfig.labelMaxLength) {
  //     labelText = name.trim().substring(0, this.visualConfig.labelMaxLength - this.visualConfig.labelEllipsisText.length) + this.visualConfig.labelEllipsisText;
  //   }
  //   else {
  //     labelText = name.trim().substring(0, this.visualConfig.labelMaxLength);
  //   }

  //   const textWidth = this.getComputedTextLength(labelText, this.visualConfig.arcFont);
  //   const labelWidth = textWidth + this.visualConfig.labelPaddingXAxis * 2;

  //   return {
  //     labelText: labelText,
  //     textWidth: textWidth,
  //     labelWidth: labelWidth
  //   };
  // }

  // private elaborateEndedArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
  //   const arcType = "endedArc";

  //   // ComputeStartAndEndXPosition
  //   const xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
  //   let startArcX = xPositionRes.startArcX;
  //   const endArcX = xPositionRes.endArcX;

  //   // ElaborateArcLabel
  //   const arcLabelRes = this.elaborateArcLabel(r.relation.name)
  //   const labelText = arcLabelRes.labelText;
  //   const textWidth = arcLabelRes.textWidth;
  //   let labelWidth = arcLabelRes.labelWidth;

  //   let endSecondSegment = endArcX;

  //   if (isFromLeftToRight) {
  //     // startFirstSegment += this.visualConfig.arcAngleOffset;
  //     startArcX = this.visualConfig.stdTextOffsetX;
  //     endSecondSegment -= this.visualConfig.arcAngleOffset;
  //   }
  //   else {
  //     // startFirstSegment -= this.visualConfig.arcAngleOffset;
  //     startArcX = this.svg.nativeElement.clientWidth;
  //     endSecondSegment += this.visualConfig.arcAngleOffset;
  //   }

  //   const startFirstSegment = startArcX;

  //   const arcCenter = Math.abs(endSecondSegment - startFirstSegment) / 2;

  //   const arcSize = Math.abs(endArcX - startArcX);
  //   const circleVisible = labelWidth >= arcSize || textWidth == 0;

  //   if (circleVisible) {
  //     labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
  //   }

  //   const signChange = isFromLeftToRight ? 1 : -1;
  //   const endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth / 2);
  //   const startSecondSegment = endFirstSegment + signChange * labelWidth;

  //   const labelStartX = Math.min(startSecondSegment, endFirstSegment);
  //   const labelEndX = Math.max(startSecondSegment, endFirstSegment);
  //   const startXText = startFirstSegment + signChange * arcCenter

  //   const yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

  //   // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
  //   // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

  //   // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
  //   // yOffset -= yAnnOffset;

  //   const yLabel = yOffset;

  //   const arc = {
  //     start: {
  //       x: startArcX,
  //       y: 0,
  //     },
  //     end: {
  //       x: endArcX,
  //       y: r.targetTower.yTowerOffset,
  //     },
  //     yArcOffset: yOffset,
  //     yAnnOffset: 0,
  //     firstSegment: {
  //       start: startFirstSegment,
  //       end: endFirstSegment
  //     },
  //     secondSegment: {
  //       start: startSecondSegment,
  //       end: endSecondSegment
  //     },
  //     label: {
  //       start: labelStartX,
  //       end: labelEndX,
  //       width: labelWidth,
  //       text: labelText,
  //       startXText: startXText,
  //       yArcLabel: yLabel
  //     },
  //     relation: r,
  //     relationId: r.relation.id,
  //     type: arcType,
  //     circleVisible: circleVisible
  //   }

  //   return arc;
  // }

  // private elaborateInLineArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
  //   const arcType = "includedArc";

  //   // ComputeStartAndEndXPosition
  //   const xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
  //   const startArcX = xPositionRes.startArcX;
  //   const endArcX = xPositionRes.endArcX;

  //   // ElaborateArcLabel
  //   const arcLabelRes = this.elaborateArcLabel(r.relation.name)
  //   const labelText = arcLabelRes.labelText;
  //   const textWidth = arcLabelRes.textWidth;
  //   let labelWidth = arcLabelRes.labelWidth;

  //   let startFirstSegment = startArcX;
  //   let endSecondSegment = endArcX;

  //   if (isFromLeftToRight) {
  //     startFirstSegment += this.visualConfig.arcAngleOffset;
  //     endSecondSegment -= this.visualConfig.arcAngleOffset;
  //   }
  //   else {
  //     startFirstSegment -= this.visualConfig.arcAngleOffset;
  //     endSecondSegment += this.visualConfig.arcAngleOffset;
  //   }

  //   const arcCenter = Math.abs(endSecondSegment - startFirstSegment) / 2;

  //   const arcSize = Math.abs(endArcX - startArcX);
  //   const circleVisible = labelWidth >= arcSize || textWidth == 0;

  //   if (circleVisible) {
  //     labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
  //   }

  //   const signChange = isFromLeftToRight ? 1 : -1;
  //   const endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth / 2);
  //   const startSecondSegment = endFirstSegment + signChange * labelWidth;

  //   const labelStartX = Math.min(startSecondSegment, endFirstSegment);
  //   const labelEndX = Math.max(startSecondSegment, endFirstSegment);
  //   const startXText = startFirstSegment + signChange * arcCenter

  //   const yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

  //   // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
  //   // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

  //   // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
  //   // yOffset -= yAnnOffset;

  //   const yLabel = yOffset;

  //   const arc = {
  //     start: {
  //       x: startArcX,
  //       y: r.sourceTower.yTowerOffset,
  //     },
  //     end: {
  //       x: endArcX,
  //       y: r.targetTower.yTowerOffset,
  //     },
  //     yArcOffset: yOffset,
  //     yAnnOffset: 0,
  //     firstSegment: {
  //       start: startFirstSegment,
  //       end: endFirstSegment
  //     },
  //     secondSegment: {
  //       start: startSecondSegment,
  //       end: endSecondSegment
  //     },
  //     label: {
  //       start: labelStartX,
  //       end: labelEndX,
  //       width: labelWidth,
  //       text: labelText,
  //       startXText: startXText,
  //       yArcLabel: yLabel
  //     },
  //     relation: r,
  //     relationId: r.relation.id,
  //     type: arcType,
  //     circleVisible: circleVisible
  //   }

  //   return arc;
  // }

  // private elaboratePassingArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
  //   const arcType = "passingArc";

  //   // ComputeStartAndEndXPosition
  //   const xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
  //   let startArcX = xPositionRes.startArcX;
  //   let endArcX = xPositionRes.endArcX;

  //   // ElaborateArcLabel
  //   const arcLabelRes = this.elaborateArcLabel(r.relation.name)
  //   const labelText = arcLabelRes.labelText;
  //   const textWidth = arcLabelRes.textWidth;
  //   let labelWidth = arcLabelRes.labelWidth;

  //   if (isFromLeftToRight) {
  //     startArcX = this.visualConfig.stdTextOffsetX;
  //     endArcX = this.svg.nativeElement.clientWidth;
  //   }
  //   else {
  //     startArcX = this.svg.nativeElement.clientWidth;
  //     endArcX = this.visualConfig.stdTextOffsetX;
  //   }

  //   const startFirstSegment = startArcX;
  //   const endSecondSegment = endArcX;

  //   const arcCenter = Math.abs(endSecondSegment - startFirstSegment) / 2;

  //   const arcSize = Math.abs(endArcX - startArcX);
  //   const circleVisible = labelWidth >= arcSize || textWidth == 0;

  //   if (circleVisible) {
  //     labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
  //   }

  //   const signChange = isFromLeftToRight ? 1 : -1;
  //   const endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth / 2);
  //   const startSecondSegment = endFirstSegment + signChange * labelWidth;

  //   const labelStartX = Math.min(startSecondSegment, endFirstSegment);
  //   const labelEndX = Math.max(startSecondSegment, endFirstSegment);
  //   let startXText = startFirstSegment + signChange * arcCenter
  //   startXText = startFirstSegment + signChange * arcCenter
  //   const yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

  //   // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
  //   // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

  //   // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
  //   // yOffset -= yAnnOffset;

  //   const yLabel = yOffset;

  //   const arc = {
  //     start: {
  //       x: startArcX,
  //       y: 0,
  //     },
  //     end: {
  //       x: endArcX,
  //       y: 0,
  //     },
  //     yArcOffset: yOffset,
  //     yAnnOffset: 0,
  //     firstSegment: {
  //       start: startFirstSegment,
  //       end: endFirstSegment
  //     },
  //     secondSegment: {
  //       start: startSecondSegment,
  //       end: endSecondSegment
  //     },
  //     label: {
  //       start: labelStartX,
  //       end: labelEndX,
  //       width: labelWidth,
  //       text: labelText,
  //       startXText: startXText,
  //       yArcLabel: yLabel
  //     },
  //     relation: r,
  //     relationId: r.relation.id,
  //     type: arcType,
  //     circleVisible: circleVisible
  //   }

  //   return arc;
  // }

  // private elaborateStartedArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
  //   const arcType = "startedArc";

  //   // ComputeStartAndEndXPosition
  //   const xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
  //   const startArcX = xPositionRes.startArcX;
  //   let endArcX = xPositionRes.endArcX;

  //   // ElaborateArcLabel
  //   const arcLabelRes = this.elaborateArcLabel(r.relation.name)
  //   const labelText = arcLabelRes.labelText;
  //   const textWidth = arcLabelRes.textWidth;
  //   let labelWidth = arcLabelRes.labelWidth;

  //   let startFirstSegment = startArcX;

  //   if (isFromLeftToRight) {
  //     startFirstSegment += this.visualConfig.arcAngleOffset;
  //     endArcX = this.svg.nativeElement.clientWidth;
  //     // endSecondSegment -= this.visualConfig.arcAngleOffset;
  //   }
  //   else {
  //     startFirstSegment -= this.visualConfig.arcAngleOffset;
  //     endArcX = this.visualConfig.stdTextOffsetX;
  //     // endSecondSegment += this.visualConfig.arcAngleOffset;
  //   }

  //   let endSecondSegment = endArcX;

  //   const arcCenter = Math.abs(endSecondSegment - startFirstSegment) / 2;

  //   const arcSize = Math.abs(endArcX - startArcX);
  //   const circleVisible = labelWidth >= arcSize || textWidth == 0;

  //   if (circleVisible) {
  //     labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
  //   }

  //   const signChange = isFromLeftToRight ? 1 : -1;
  //   const endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth / 2);
  //   let startSecondSegment = endFirstSegment + signChange * labelWidth;

  //   if (startSecondSegment < this.visualConfig.stdTextOffsetX) {
  //     startSecondSegment = this.visualConfig.stdTextOffsetX;
  //     endSecondSegment = this.visualConfig.stdTextOffsetX - 1;
  //   }

  //   const labelStartX = Math.min(startSecondSegment, endFirstSegment);
  //   const labelEndX = Math.max(startSecondSegment, endFirstSegment);
  //   const startXText = startFirstSegment + signChange * arcCenter

  //   const yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

  //   // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
  //   // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

  //   // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
  //   // yOffset -= yAnnOffset;

  //   const yLabel = yOffset;

  //   const arc = {
  //     start: {
  //       x: startArcX,
  //       y: r.sourceTower.yTowerOffset,
  //     },
  //     end: {
  //       x: endArcX,
  //       y: 0,
  //     },
  //     yArcOffset: yOffset,
  //     yAnnOffset: 0,
  //     firstSegment: {
  //       start: startFirstSegment,
  //       end: endFirstSegment
  //     },
  //     secondSegment: {
  //       start: startSecondSegment,
  //       end: endSecondSegment
  //     },
  //     label: {
  //       start: labelStartX,
  //       end: labelEndX,
  //       width: labelWidth,
  //       text: labelText,
  //       startXText: startXText,
  //       yArcLabel: yLabel
  //     },
  //     relation: r,
  //     relationId: r.relation.id,
  //     type: arcType,
  //     circleVisible: circleVisible
  //   }

  //   return arc;
  // }

  /**
   * @private
   * Metodo che recupera un'annotazione fra quelle semplificate sulla base dell'id
   * @param id {number} identificativo dell'annotazione
   * @returns {any} annotazione estratta dalle annotazioni semplificate
   */
  // private findAnnotationById(id: number) {
  //   return this.simplifiedAnns.find((an: any) => an.id == id);
  // }

  /**
   * @private
   * Metodo che recupera un'annotazione dalle tower utilizzando l'id
   * @param id {number} identificativo numerico dell'annotazione
   * @param lineTowers {Array<any>} lista ?
   * @returns {any} annotazione corrispondente nella tower ?
   */
  // private findAnnotationInTowers(id: number, lineTowers: Array<any>) {
  //   var t = lineTowers.find((t: any) => t.tower.some((ann: any) => ann.id == id));

  //   var ann = undefined;

  //   if (t && t.tower) {
  //     ann = t.tower.find((ann: any) => ann.id == id);
  //   }

  //   return ann;
  // }

  /**
   * @private
   * Metodo che recupera la tower contenente una data annotazione
   * @param id {number} identificativo numerico dell'annotazione
   * @param lineTowers {Array<any>} lista ?
   * @returns {any} tower contenente l'annotazione
   */
  // private findTowerByAnnotationId(id: number, lineTowers: Array<any>) {
  //   var t = lineTowers.find((t: any) => t.tower.some((ann: any) => ann.id == id));
  //   return t;
  // }

  // private generateArcPath(ar: any): { firstSegmentPath: string; secondSegmentPath: string; } {
  //   let firstArcSegment = "";
  //   let secondArcSegment = "";

  //   switch (ar.type) {
  //     case "includedArc": {
  //       const moveToArcStart = "M " + ar.start.x + " " + ar.start.y;
  //       const moveToFirstStart = "L " + ar.firstSegment.start + " " + ar.yArcOffset;
  //       const lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

  //       const moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
  //       const lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;
  //       const moveToArcEnd = "L " + ar.end.x + " " + ar.end.y;

  //       firstArcSegment = moveToArcStart + " " + moveToFirstStart + " " + lineFirstSegment;
  //       secondArcSegment = moveToSecondStart + " " + lineSecondSegment + " " + moveToArcEnd;
  //       break;
  //     }

  //     case "startedArc": {
  //       const moveToArcStart = "M " + ar.start.x + " " + ar.start.y;
  //       const moveToFirstStart = "L " + ar.firstSegment.start + " " + ar.yArcOffset;
  //       const lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

  //       const moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
  //       const lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;

  //       firstArcSegment = moveToArcStart + " " + moveToFirstStart + " " + lineFirstSegment;
  //       secondArcSegment = moveToSecondStart + " " + lineSecondSegment;
  //       break;
  //     }

  //     case "endedArc": {
  //       const moveToFirstStart = "M " + ar.firstSegment.start + " " + ar.yArcOffset;
  //       const lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

  //       const moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
  //       const lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;
  //       const moveToArcEnd = "L " + ar.end.x + " " + ar.end.y;

  //       firstArcSegment = moveToFirstStart + " " + lineFirstSegment;
  //       secondArcSegment = moveToSecondStart + " " + lineSecondSegment + " " + moveToArcEnd;
  //       break;
  //     }

  //     case "passingArc": {
  //       const moveToFirstStart = "M " + ar.firstSegment.start + " " + ar.yArcOffset;
  //       const lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

  //       const moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
  //       const lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;

  //       firstArcSegment = moveToFirstStart + " " + lineFirstSegment;
  //       secondArcSegment = moveToSecondStart + " " + lineSecondSegment;
  //       break;
  //     }

  //     default: {
  //       break;
  //     }
  //   }

  //   return {
  //     firstSegmentPath: firstArcSegment,
  //     secondSegmentPath: secondArcSegment
  //   };
  // }

  // private getMaxArcOffset(array: Array<any>) {
  //   return Math.max(...array.map(o => (o.yArcOffset + o.yAnnOffset)));
  // }

  // private getMaxArcOffsetInRange(array: Array<any>, startX: number, endX: number) {
  //   const min = Math.min(startX, endX);
  //   const max = Math.max(startX, endX);

  //   const filteredArcs = array.filter((ar: any) => (ar.start.x >= min && ar.end.x <= max) ||
  //     (ar.start.x < min && ar.end.x >= min && ar.end.x <= max) ||
  //     (ar.start.x > max && ar.end.x >= min && ar.end.x <= max) ||
  //     (ar.start.x >= min && ar.start.x <= max && ar.end.x < min) ||
  //     (ar.start.x >= min && ar.start.x <= max && ar.end.x > max) ||
  //     (ar.start.x < min && ar.end.x > max));

  //   return this.getMaxArcOffset(filteredArcs);
  // }

  // private getMaxTowerAroundAnns(lineTowers: Array<any>, start: number, end: number) {
  //   const filteredTowers = lineTowers.filter((t: any) => (t.spanCoordinates.start >= start && t.spanCoordinates.end <= end) || (t.spanCoordinates.start < start && t.spanCoordinates.end > start) || (t.spanCoordinates.start < end && t.spanCoordinates.end > end));

  //   return this.getMaxTowerPosition(filteredTowers);
  // }

  /**
 * Metodo che gestisce il movimento del mouse nel trascinamento
 * @param event {any} evento di trascinamento del mouse
 * @returns {void}
 */
  // mouseMoved(event: any) {
  //   if (this.dragArrow.isDrawing) { //traccia solo il caso di freccia di trascinamento che sta disegnando
  //     this.dragArrow.visibility = "visible";
  //     this.svg.nativeElement.classList.add('unselectable');

  //     const x1 = this.dragArrow.x1
  //     const y1 = Math.min(...[this.dragArrow.y1, event.offsetY]) - this.visualConfig.draggedArcHeight;
  //     const x2 = event.offsetX
  //     const y2 = y1

  //     this.dragArrow.c = "C " + x1 + " " + y1 + ", " + x2 + " " + y2 + ", " + event.offsetX + " " + event.offsetY
  //     return;
  //   }
  // }

  /**
* Metodo che apre la relazione selezionata nell'editor
* @param id {string} identificativo della relazione
* @returns {void}
*/
  // openRelation(id: string) {
  //   if (this.dragArrow.isDrawing) {
  //     return;
  //   }

  //   if (!id) {
  //     this.messageService.add(this.msgConfService.generateErrorMessageConfig('Impossibile visualizzare la relazione selezionata'));
  //     return;
  //   }

  //   const rel = this.simplifiedArcs.find((a: any) => a.id == id)

  //   if (!rel) {
  //     this.messageService.add(this.msgConfService.generateErrorMessageConfig('Relazione non trovata'));
  //     return;
  //   }

  //   this.relation = { ...rel };
  //   this.sourceAnn = this.annotationsRes.annotations.find((a: any) => a.id == rel?.srcAnnotationId);
  //   this.targetAnn = this.annotationsRes.annotations.find((a: any) => a.id == rel?.targetAnnotationId);

  //   const sLayer = this.layersList.find(l => l.id == Number.parseInt(this.sourceAnn.layer));
  //   const tLayer = this.layersList.find(l => l.id == Number.parseInt(this.targetAnn.layer));

  //   if (!sLayer || !tLayer) {
  //     this.messageService.add(this.msgConfService.generateErrorMessageConfig('Impossibile visualizzare la relazione selezionata'));
  //     return;
  //   }

  //   this.sourceLayer = sLayer;
  //   this.targetLayer = tLayer;

  //   this.showEditorAndHideOthers(EditorType.Relation);
  // }

  /**
   * Metodo che evidenzia una relazione (e il suo arco) quando vi si entra con il mouse
   * @param id {number} identificativo numerico di una relazione
   * @returns {void}
   */
  // overEnterRelation(id: number) {
  //   $('*[data-relation-id="' + id + '"]').addClass("filtered");

  //   const arc = this.simplifiedArcs.find(ar => ar.id == id);

  //   if (!arc || !arc.srcAnnotationId || !arc.targetAnnotationId) {
  //     return;
  //   }

  //   $('#' + arc.srcAnnotationId + '').addClass("filtered");
  //   $('#' + arc.targetAnnotationId + '').addClass("filtered");
  //   $('#' + this.generateHighlightId(arc.srcAnnotationId) + '').addClass("over");
  //   $('#' + this.generateHighlightId(arc.targetAnnotationId) + '').addClass("over");
  // }

  /**
   * Metodo che rimuove l'evidenziazione di una relazione quando il mouse esce dalla stessa
   * @param id {number} identificativo numerico di una relazione
   * @returns {void}
   */
  // overLeaveRelation(id: number) {
  //   $('*[data-relation-id="' + id + '"]').removeClass("filtered");

  //   const arc = this.simplifiedArcs.find(ar => ar.id == id);

  //   if (!arc || !arc.srcAnnotationId || !arc.targetAnnotationId) {
  //     return;
  //   }

  //   $('#' + arc.srcAnnotationId + '').removeClass("filtered");
  //   $('#' + arc.targetAnnotationId + '').removeClass("filtered");
  //   $('#' + this.generateHighlightId(arc.srcAnnotationId) + '').removeClass("over");
  //   $('#' + this.generateHighlightId(arc.targetAnnotationId) + '').removeClass("over");
  // }

  /**
   * Metodo che avvia il disegno di una relazione a partire da una annotazion
   * @param event {any} evento di mousedown //TODO valutare rimozione per mancato uso
   * @param annotation {any} annotazione sulla quale avviene il mousedown
   * @returns {void}
   */
  // startDrawing(event: any, annotation: any) {
  //   if (!annotation.id) {
  //     return;
  //   }

  //   const ann = this.annotationsRes?.annotations?.find((a: any) => a.id == annotation.id);

  //   if (!ann) {
  //     return;
  //   }

  //   this.dragArrow.sourceAnn = ann;
  //   this.dragArrow.isDrawing = true;
  //   this.dragArrow.m = "M " + (annotation.startX + (annotation.endX - annotation.startX) / 2) + " " + annotation.y + ", "
  //   this.dragArrow.x1 = annotation.startX + annotation.width / 2;
  //   this.dragArrow.y1 = annotation.y - this.visualConfig.draggedArcHeight;

  //   this.clearSelection();
  // }

  /**
   * Metodo che conclude il disegno di una relazione su mouseup al di fuori di un'annotazione (non crea la relazione)
   * @param event {any} evento di mouseup //TODO valutare rimozione per mancato uso
   * @returns {void}
   */
  // endDrawing(event: any) {
  //   if (!this.dragArrow.isDrawing) {
  //     return;
  //   }

  //   this.dragArrow.isDrawing = false;
  //   this.dragArrow.visibility = "hidden";
  //   this.dragArrow.m = ""
  //   this.dragArrow.c = ""

  //   this.svg.nativeElement.classList.remove('unselectable');
  //   this.clearSelection();
  // }

  /**
   * Metodo che conclude il disegno di una relazione su mouseup su un'annotazione e richiede la creazione della relazione
   * @param event {any} evento di mouseup su una annotazione
   * @param annotation {Annotation} annotazione sulla quale avviene il mouseup
   * @returns {void}
   */
  // endDrawingAndCreateRelation(event: any, annotation: Annotation) {
  //   if (!this.dragArrow.isDrawing) {
  //     return;
  //   }

  //   if (!annotation.id) {
  //     this.endDrawing(event)
  //     return;
  //   }

  //   const ann = this.annotationsRes.annotations.find((a: any) => a.id == annotation.id);

  //   if (!ann) {
  //     this.endDrawing(event)
  //     return;
  //   }

  //   this.dragArrow.targetAnn = ann;

  //   this.sourceAnn = JSON.parse(JSON.stringify(this.dragArrow.sourceAnn));
  //   this.targetAnn = JSON.parse(JSON.stringify(this.dragArrow.targetAnn));

  //   const sLayer = this.layersList.find(l => l.id == Number.parseInt(this.sourceAnn.layer));
  //   const tLayer = this.layersList.find(l => l.id == Number.parseInt(this.targetAnn.layer));

  //   if (!sLayer || !tLayer) {
  //     this.endDrawing(event)
  //     return;
  //   }

  //   this.sourceLayer = sLayer;
  //   this.targetLayer = tLayer;

  //   const relation = new Relation();

  //   relation.name = "Relation";
  //   relation.srcAnnotationId = this.dragArrow.sourceAnn.id;
  //   relation.srcLayerId = Number.parseInt(this.dragArrow.sourceAnn.layer);
  //   relation.targetAnnotationId = this.dragArrow.targetAnn.id;
  //   relation.targetLayerId = Number.parseInt(this.dragArrow.targetAnn.layer);
  //   relation.textId = this.textId;

  //   this.relation = relation;

  //   this.showEditorAndHideOthers(EditorType.Relation);

  //   this.endDrawing(event)
  // }

  /**
   * @private
   * Metodo che rimuove la selezione testuale
   */
  // private clearSelection() {
  //   const selection = window.getSelection();

  //   if (selection != null) {
  //     selection.removeAllRanges();
  //   }
  //   // window.getSelection().removeAllRanges();
  //   // if (selRect != null) {
  //   //   for(var s=0; s != selRect.length; s++) {
  //   //     selRect[s].parentNode.removeChild(selRect[s]);
  //   //   }
  //   //   selRect = null;
  //   //   lastStartRec = null;
  //   //   lastEndRec = null;
  //   // }
  // }

  /**
   * @private
   * Metodo che gestisce la renderizzazione degli archi per una line
   * @param startIndex {number} indice iniziale
   * @param endIndex {number} indice finale
   * @param lineTowers {Array<any>} lista ?
   * @returns {any[]} lista degli archi per la line
   */
  // private renderArcsForLine(startIndex: number, endIndex: number, lineTowers: Array<any>) {
  //   const lineArcs = new Array();
  //   const relationsIncludedInLine = new Array();
  //   const relationsStartedInLine = new Array();
  //   const relationsEndedInLine = new Array();
  //   const relationsPassignThroughLine = new Array();

  //   for (const ar of this.simplifiedArcs) {
  //     if (!ar.srcAnnotationId || !ar.targetAnnotationId) {
  //       break;
  //     }

  //     const sourceAnn = this.findAnnotationById(ar.srcAnnotationId);
  //     const targetAnn = this.findAnnotationById(ar.targetAnnotationId);

  //     const sourceTower = this.findTowerByAnnotationId(ar.srcAnnotationId, lineTowers);
  //     const targetTower = this.findTowerByAnnotationId(ar.targetAnnotationId, lineTowers);

  //     if (!sourceAnn || !targetAnn) {
  //       break;
  //     }

  //     if (sourceAnn.span.start >= startIndex && sourceAnn.span.start <= endIndex &&
  //       targetAnn.span.end >= startIndex && targetAnn.span.end <= endIndex && sourceTower && targetTower) {
  //       relationsIncludedInLine.push({
  //         relation: ar,
  //         sourceAnn: sourceAnn,
  //         targetAnn: targetAnn,
  //         sourceTower: sourceTower,
  //         targetTower: targetTower,
  //         leftToRight: sourceAnn.span.start <= targetAnn.span.start
  //       });
  //     }

  //     if (sourceAnn.span.start >= startIndex && sourceAnn.span.start <= endIndex &&
  //       (targetAnn.span.end < startIndex || targetAnn.span.end > endIndex) && sourceTower) {
  //       relationsStartedInLine.push({
  //         relation: ar,
  //         sourceAnn: sourceAnn,
  //         targetAnn: targetAnn,
  //         sourceTower: sourceTower,
  //         targetTower: targetTower,
  //         leftToRight: sourceAnn.span.start <= targetAnn.span.start
  //       });
  //     }

  //     if (targetAnn.span.end >= startIndex && targetAnn.span.end <= endIndex &&
  //       (sourceAnn.span.start < startIndex || sourceAnn.span.start > endIndex) && targetTower) {
  //       relationsEndedInLine.push({
  //         relation: ar,
  //         sourceAnn: sourceAnn,
  //         targetAnn: targetAnn,
  //         sourceTower: sourceTower,
  //         targetTower: targetTower,
  //         leftToRight: sourceAnn.span.start <= targetAnn.span.start
  //       });
  //     }

  //     if (((sourceAnn.span.start < startIndex && sourceAnn.span.start < startIndex && targetAnn.span.start > endIndex && targetAnn.span.end > endIndex) ||
  //       (sourceAnn.span.start > endIndex && sourceAnn.span.start > endIndex && targetAnn.span.start < startIndex && targetAnn.span.end < startIndex))
  //       && !sourceTower && !targetTower) {
  //       relationsPassignThroughLine.push({
  //         relation: ar,
  //         sourceAnn: sourceAnn,
  //         targetAnn: targetAnn,
  //         sourceTower: sourceTower,
  //         targetTower: targetTower,
  //         leftToRight: sourceAnn.span.start <= targetAnn.span.start
  //       });
  //     }
  //   }

  //   relationsIncludedInLine.sort((a: any, b: any) =>
  //     (Math.abs(a.sourceAnn.span.start - a.targetAnn.span.start) - Math.abs(b.sourceAnn.span.start - b.targetAnn.span.start)) ||
  //     (Math.min(a.sourceAnn.span.start, a.targetAnn.span.start) - Math.min(b.sourceAnn.span.start, b.targetAnn.span.start))
  //   );

  //   relationsStartedInLine.sort((a: any, b: any) => a.leftToRight ?
  //     a.sourceAnn.span.end - b.sourceAnn.span.end :
  //     a.sourceAnn.span.start - b.sourceAnn.span.start
  //   );

  //   relationsEndedInLine.sort((a: any, b: any) => a.leftToRight ?
  //     a.targetAnn.span.start - b.targetAnn.span.start :
  //     a.targetAnn.span.end - b.targetAnn.span.end
  //   );

  //   relationsEndedInLine.reverse();

  //   relationsPassignThroughLine.sort((a: any, b: any) =>
  //     Math.min(Math.abs(a.sourceAnn.span.end - a.targetAnn.span.start), Math.abs(b.sourceAnn.span.end - b.targetAnn.span.start)) ||
  //     Math.min(Math.min(a.sourceAnn.span.start, a.targetAnn.span.start), Math.min(b.sourceAnn.span.start, b.targetAnn.span.start))
  //   );

  //   relationsIncludedInLine.forEach(r => {
  //     let arc: any;

  //     arc = this.elaborateInLineArc(
  //       r,
  //       lineTowers,
  //       r.leftToRight ? r.sourceAnn.span.end : r.sourceAnn.span.start,
  //       r.leftToRight ? r.targetAnn.span.start : r.targetAnn.span.end,
  //       startIndex,
  //       lineArcs,
  //       r.leftToRight
  //     );

  //     lineArcs.push(arc);
  //   })

  //   relationsStartedInLine.forEach(r => {
  //     let arc: any;

  //     arc = this.elaborateStartedArc(
  //       r,
  //       lineTowers,
  //       r.leftToRight ? r.sourceAnn.span.end : r.sourceAnn.span.start,
  //       r.leftToRight ? endIndex : startIndex,
  //       startIndex,
  //       lineArcs,
  //       r.leftToRight
  //     );

  //     lineArcs.push(arc);
  //   })

  //   relationsEndedInLine.forEach(r => {
  //     let arc: any;

  //     arc = this.elaborateEndedArc(
  //       r,
  //       lineTowers,
  //       r.leftToRight ? startIndex : endIndex,
  //       r.leftToRight ? r.targetAnn.span.start : r.targetAnn.span.end,
  //       startIndex,
  //       lineArcs,
  //       r.leftToRight
  //     );

  //     lineArcs.push(arc);
  //   })

  //   relationsPassignThroughLine.forEach(r => {
  //     let arc: any;

  //     arc = this.elaboratePassingArc(
  //       r,
  //       lineTowers,
  //       r.leftToRight ? startIndex : endIndex,
  //       r.leftToRight ? r.targetAnn.span.start : r.targetAnn.span.end,
  //       startIndex,
  //       lineArcs,
  //       r.leftToRight
  //     );

  //     lineArcs.push(arc);
  //   })

  //   return lineArcs;
  // }
}



