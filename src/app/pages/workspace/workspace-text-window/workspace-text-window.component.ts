import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MessageService, TreeNode } from 'primeng/api';
import { Tree } from 'primeng/tree';
import { Observable, Subject, catchError, forkJoin, of, switchMap, take, takeUntil, throttleTime, throwError } from 'rxjs';
import { Annotation } from 'src/app/models/annotation/annotation';
import { AnnotationMetadata } from 'src/app/models/annotation/annotation-metadata';
import { SpanCoordinates } from 'src/app/models/annotation/span-coordinates';
import { EditorType } from 'src/app/models/editor-type';
import { Layer } from 'src/app/models/layer/layer.model';
import { Relation } from 'src/app/models/relation/relation';
import { Relations } from 'src/app/models/relation/relations';
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

enum ScrollingDirectionType { Up, Down, InRange }

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
  /**Indice di inizio selezione */
  private selectionStart?: number;
  /**Indice di fine selezione */
  private selectionEnd?: number;
  selectedTText = '';
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
    layerSelectHeightAndMargin: 69.75 + 16,
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

  /**Annotazione in lavorazione */
  annotation = new Annotation();
  textoAnnotation = new TAnnotation();
  offset: number | undefined;
  visibleAnnotationId?: number;
  /**Annotation response */
  annotationsRes: any;
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
  relation = new Relation();
  /**Righe di testo */
  rows: TextRow[] = [];
  /**Layer selezionato */
  selectedLayer: TLayer | undefined;
  /**Lista di layer selezionati */
  selectedLayers: TLayer[] | undefined = [];
  previousStartRow: number | null = null;
  previousEndRow: number | null = null;
  lastRenderedLayers: number[] = [];

  sentnumVerticalLine = "M 0 0";
  /**Definisce se visualizzare l'editor di annotazione */
  showAnnotationEditor = false;
  /**Definisce se visualizzare l'editor delle relazioni */
  showRelationEditor = false;
  /**Annotazioni semplificate */
  simplifiedAnns: any;
  /**Lista di archi di relazione semplificati */
  simplifiedArcs: Array<Relation> = [];
  /**Annotazione sorgente della relazione */
  sourceAnn = new Annotation();
  /**Layer sorgente dell'annotazione */
  sourceLayer = new Layer();
  svgHeight = 0;
  /**Annotazione target della relazione */
  targetAnn = new Annotation();
  /**Layer target della relazione */
  targetLayer = new Layer();
  /**Altezza del contenitore del testo */
  textContainerHeight: number = window.innerHeight / 2;
  /**Sections panel header height */
  sectionsHeaderHeight = 130;
  /**Sections document tree height*/
  get sectionsTreeHeight() {
    return this.textContainerHeight - this.sectionsHeaderHeight;
  }
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

  /**Scroller*/
  public textRowsWideness!: number;
  public textTotalRows: number = 0;
  public precTextRange?: TextRange;
  public textRange!: TextRange;
  public lastScrollTop: number = 0;
  public scrolling: boolean = false;
  public backendIndexCompensation: number = 1;
  public mostRecentRequestTime: number = 0;
  public preventOnScrollEvent: boolean = false;
  public scrollingDirection: ScrollingDirectionType = ScrollingDirectionType.Down;
  public extraRowsWidenessUpOrDown!: number;
  public scrollingSubject = new Subject<number>();
  public currentVisibleRowIndex?: number;

  /**Document section navigation tree */
  documentSections: TreeNode[] = new Array<TreeNode>;
  selectedSection?: TreeNode;
  changingSection?: boolean = false;
  rootNodeKey: string = '405092b3-7110-4e48-a524-21a20d0448ab'

  /**Resizible panels settings */
  public widthPercentEditorDiv = 0;
  public widthPercentSectionsDiv = 0;
  public expandedEditorDiv: boolean = false;
  public expandedDocumentSectonsDiv: boolean = true;

  /**Resizible panels dynamic size settings */
  lateralSplitExpandedSize: number = 24;
  lateralSplitCollapsedSize: number = 3;
  documentSectionsSplit: number = this.lateralSplitExpandedSize;
  annotationSplitSize: number = this.lateralSplitCollapsedSize;
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
    ).subscribe(textoUser => {
      this.currentTextoUserId = textoUser.id;
    });
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per caricare i dati iniziali del componente */
  ngOnInit(): void {
    if (!this.textId) {
      return;
    }

    this.startingRowIndex = this.startingRowIndex ?? 0;

    this.scrollingSubject.pipe(throttleTime(200)).subscribe(value => this.updateTextRowsView(value));

    forkJoin([this.workspaceService.retrieveResourceElementById(this.textId),
    this.workspaceService.retrieveSectionsByResourceId(this.textId)])
      .pipe(take(1))
      .subscribe(([resource, sectionsResponse]) => {
        this.currentResource = resource;
        this.documentSections = this.adaptToDocumentTree(sectionsResponse, resource.name ?? '');

      });

    this.layers$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(list => {
      this.layersList = list;
      if (!this.selectedLayers) {
        this.selectedLayers = this.visibleLayers = list;
      }
    });

    this.showAnnotationEditor = true;

    this.updateHeight(this.height);
  }

  ngAfterViewInit() {
    this.textRowsWideness = this.textRowsRangeWidenessPredictor();
    this.extraRowsWidenessUpOrDown = this.extraTextRowsWidenessPredictor();
    this.loadInitialData();
  }

  /**initialize text range and load data */
  loadInitialData() {
    this.annotationService.retrieveTextTotalRows(this.textId!)
      .pipe(
        takeUntil(this.unsubscribe$),
        catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, 'Error retrieving text total rows')),
      )
      .subscribe((result) => {
        this.textTotalRows = result!

        let start = this.startingRowIndex;
        let end = this.startingRowIndex + this.textRowsWideness;

        if (end > this.textTotalRows) {
          end = this.textTotalRows;
        }

        this.textRange = new TextRange(start, end);
        this.precTextRange = this.textRange.clone();
        this.addExtraRowsUp();
        let requestRange = new TextRange(this.textRange.start, this.textRange.end + this.backendIndexCompensation)
        this.scrollingDirection = ScrollingDirectionType.InRange;
        this.currentVisibleRowIndex = this.startingRowIndex;
        this.loadData(requestRange.start, requestRange.end);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  async onSaveAnnotationFeatures(featuresList: { feature: TFeature, value: string }[]) {
    let workingAnnotation = this.textoAnnotation;
    if (!this.textoAnnotation.id) {
      this.textoAnnotation.user = { id: this.currentTextoUserId };
      this.textoAnnotation.resource = this.currentResource;
      workingAnnotation = await this.createNewAnnotation(this.textoAnnotation);
    }
    const newFeaturesObs: Observable<TAnnotationFeature>[] = [];
    const updateFeaturesObs: Observable<TAnnotationFeature>[] = [];
    for (const fl of featuresList) {
      const existingFeature = this.textoAnnotation.features?.find(f => f.feature?.id === fl.feature.id);
      if (existingFeature && existingFeature.value === fl.value) {
        continue;
      }
      if (!existingFeature) {
        newFeaturesObs.push(this.saveFeatureAnnotation(workingAnnotation, fl.feature, fl.value));
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
    forkJoin([...newFeaturesObs, ...updateFeaturesObs]).pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(`Saving features failed: ${error.error.message}`));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(() => {
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Annotation saved'));
      this.onAnnotationSaved();
    })
  }

  /**
   * Metodo che aggiorna la lista dei layer visibili e richiama il caricamento complessivo dei dati
   * @param event {any} evento di variazione dei layer visibili
   */
  changeVisibleLayers(event: any) {
    this.visibleLayers = this.selectedLayers || [];
    this.loadData(this.textRange.start, this.textRange.end);
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

    if (this.isScrollingInLoadedRange(scroll, event.target.scrollTop)) { return; }

    this.scrollingSubject.next(event);
  }

  public expandCollapseNavigationDiv() {

    this.currentVisibleRowIndex = this.findCurrentVisibleRow()?.rowIndex;
    this.expandedDocumentSectonsDiv = !this.expandedDocumentSectonsDiv;

    this.updateDocumentSectionsSplitSize();

    setTimeout(() => {
      this.scrollingDirection = ScrollingDirectionType.InRange;
      this.loadData(this.textRange.start, this.textRange.end + this.backendIndexCompensation);
    }, 200);
  }

  public expandCollapseAnnotationDiv(annotationId?: number) {
    this.currentVisibleRowIndex = this.findCurrentVisibleRow()?.rowIndex;
    this.expandedEditorDiv = annotationId ? true : !this.expandedEditorDiv;

    this.updateAnnotationsSplitSize();

    setTimeout(() => {
      if (annotationId && annotationId != this.visibleAnnotationId) {
        this.visibleAnnotationId = annotationId;
        this.openAnnotation(this.visibleAnnotationId!);
      }

      this.scrollingDirection = ScrollingDirectionType.InRange;
      this.loadData(this.textRange.start, this.textRange.end + this.backendIndexCompensation);
    }, 200);
  }

  public sentumChanged() {
    setTimeout(() => {
      this.showSentum = !this.showSentum;
      this.loadData(this.textRange.start, this.textRange.end + this.backendIndexCompensation);
    }, 500);
  }

  public sectionSelected(event: any) {
    if (event.node.key === this.rootNodeKey) { return; }

    if (event.node.data.start === this.textRange.start) { return; }

    this.changingSection = true;
    this.scrollingDirection = ScrollingDirectionType.Up
    this.textRange = new TextRange(event.node.data.start, event.node.data.start + this.textRowsWideness);
    this.precTextRange = this.textRange.clone();
    this.addExtraRowsUp();
    this.loadData(this.textRange.start, this.textRange.end + this.backendIndexCompensation);
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

  /**
   * Metodo che gestisce il movimento del mouse nel trascinamento
   * @param event {any} evento di trascinamento del mouse
   * @returns {void}
   */
  mouseMoved(event: any) {
    if (this.dragArrow.isDrawing) { //traccia solo il caso di freccia di trascinamento che sta disegnando
      this.dragArrow.visibility = "visible";
      this.svg.nativeElement.classList.add('unselectable');

      const x1 = this.dragArrow.x1
      const y1 = Math.min(...[this.dragArrow.y1, event.offsetY]) - this.visualConfig.draggedArcHeight;
      const x2 = event.offsetX
      const y2 = y1

      this.dragArrow.c = "C " + x1 + " " + y1 + ", " + x2 + " " + y2 + ", " + event.offsetX + " " + event.offsetY
      return;
    }
  }

  /**Metodo che annulla una annotazione (intercetta emissione dell'annotation editor) */
  onAnnotationCancel() {
    this.textoAnnotation = new TAnnotation();
  }

  /**Metodo che cancella una annotazione (intercetta emissione dell'annotation editor) */
  onAnnotationDeleted() {
    this.textoAnnotation = new TAnnotation();
    this.loadData(this.textRange.start, this.textRange.end);
  }

  /**Metodo che salva una annotazione (intercetta emissione dell'annotation editor) */
  onAnnotationSaved() {
    this.loadData(this.textRange.start, this.textRange.end);
  }

  /**Metodo che intercetta il cambio di layer selezionato */ //TODO sembra avere unicamente funzioni di debugging, vedere se eliminare
  onChangeLayerSelection(event: any) {
    console.log('hello', this.selectedLayer, event)

    if (this.selectedLayer && this.visibleLayers.findIndex(l => l.id == this.selectedLayer?.id) == -1) {
      this.visibleLayers.push(this.selectedLayer!);
    }
  }

  /**Metodo che annulla una relazione (intercetta emissione del relation editor) */
  onRelationCancel() {
    this.relation = new Relation();
    this.annotation = new Annotation();
    this.textoAnnotation = new TAnnotation();
    this.showEditorAndHideOthers(EditorType.Annotation);
  }

  /**Metodo che annulla una relazione (intercetta emissione del relation editor) */
  onRelationDeleted() {
    this.relation = new Relation();
    this.showEditorAndHideOthers(EditorType.Annotation);
    this.loadData(this.textRange.start, this.textRange.end);
  }

  /**Metodo che annulla una relazione (intercetta emissione del relation editor) */
  onRelationSaved() {
    this.relation = new Relation();
    this.showEditorAndHideOthers(EditorType.Annotation);
    this.loadData(this.textRange.start, this.textRange.end);
  }

  forceRefreshDocumentTree: boolean = true;
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

  /**
   * Metodo che gestisce le variazioni di selezione sul testo
   * @param event {any} evento di mouse up
   * @returns {void}
   */
  onSelectionChange(event: any): void {
    const selection = this.getCurrentTextSelection();

    if (!selection) { //caso senza selezione, esco dal metodo
      return;
    }
    this.textoAnnotation = new TAnnotation();
    this.annotation = new Annotation();

    let startIndex = selection.startIndex;
    let endIndex = selection.endIndex;
    // let text = this.textRes.text.substring(startIndex, endIndex); //estrapola il testo selezionato //TODO OGGETTO RICEVUTO è SOLO TESTO, NON JSON
    const text = this.textRes.join('').substring(startIndex, endIndex);

    if (!this.onlySpaces(text)) {
      const originalLength = text.length;
      let newText = text.trimStart();
      let newLength = newText.length;

      startIndex = startIndex + (originalLength - newLength);

      newText = text.trimEnd();
      newLength = newText.length;

      endIndex = endIndex - (originalLength - newLength);
    }

    const relations = new Relations();

    // this.annotation.layer = this.selectedLayer;
    // this.annotation.layerName = this.layerOptions.find(l => l.value == this.selectedLayer)?.label;
    this.textoAnnotation.layer = this.selectedLayer;
    this.textoAnnotation.start = (this.offset ?? 0) + startIndex;
    this.textoAnnotation.end = (this.offset ?? 0) + endIndex;
    this.selectedTText = text;
    this.annotation.layer = this.selectedLayer?.id;
    this.annotation.layerName = this.selectedLayer?.name;
    this.annotation.spans = new Array<SpanCoordinates>();
    this.annotation.spans.push({
      start: startIndex,
      end: endIndex
    })

    this.annotation.attributes = {};
    this.annotation.attributes["relations"] = relations;
    this.annotation.attributes["metadata"] = new AnnotationMetadata();

    this.annotation.value = text;

    this.showEditorAndHideOthers(EditorType.Annotation);
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
    this.selectedTText = newSelectedText != '' ? newSelectedText : this.selectedTText; // show old value if not selecting a new one
    // this.annotation.layerName = this.layerOptions.find(l => l.value == Number.parseInt(ann.layer))?.label;
    // this.annotation.layerName = this.selectedLayer?.name;

    //this._editIsLocked = true;
  }

  /**
   * Metodo che apre la relazione selezionata nell'editor
   * @param id {string} identificativo della relazione
   * @returns {void}
   */
  openRelation(id: string) {
    if (this.dragArrow.isDrawing) {
      return;
    }

    if (!id) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Impossibile visualizzare la relazione selezionata'));
      return;
    }

    const rel = this.simplifiedArcs.find((a: any) => a.id == id)

    if (!rel) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Relazione non trovata'));
      return;
    }

    this.relation = { ...rel };
    this.sourceAnn = this.annotationsRes.annotations.find((a: any) => a.id == rel?.srcAnnotationId);
    this.targetAnn = this.annotationsRes.annotations.find((a: any) => a.id == rel?.targetAnnotationId);

    const sLayer = this.layersList.find(l => l.id == Number.parseInt(this.sourceAnn.layer));
    const tLayer = this.layersList.find(l => l.id == Number.parseInt(this.targetAnn.layer));

    if (!sLayer || !tLayer) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Impossibile visualizzare la relazione selezionata'));
      return;
    }

    this.sourceLayer = sLayer;
    this.targetLayer = tLayer;

    this.showEditorAndHideOthers(EditorType.Relation);
  }

  /**
   * Metodo che evidenzia una relazione (e il suo arco) quando vi si entra con il mouse
   * @param id {number} identificativo numerico di una relazione
   * @returns {void}
   */
  overEnterRelation(id: number) {
    $('*[data-relation-id="' + id + '"]').addClass("filtered");

    const arc = this.simplifiedArcs.find(ar => ar.id == id);

    if (!arc || !arc.srcAnnotationId || !arc.targetAnnotationId) {
      return;
    }

    $('#' + arc.srcAnnotationId + '').addClass("filtered");
    $('#' + arc.targetAnnotationId + '').addClass("filtered");
    $('#' + this.generateHighlightId(arc.srcAnnotationId) + '').addClass("over");
    $('#' + this.generateHighlightId(arc.targetAnnotationId) + '').addClass("over");
  }

  /**
   * Metodo che rimuove l'evidenziazione di una relazione quando il mouse esce dalla stessa
   * @param id {number} identificativo numerico di una relazione
   * @returns {void}
   */
  overLeaveRelation(id: number) {
    $('*[data-relation-id="' + id + '"]').removeClass("filtered");

    const arc = this.simplifiedArcs.find(ar => ar.id == id);

    if (!arc || !arc.srcAnnotationId || !arc.targetAnnotationId) {
      return;
    }

    $('#' + arc.srcAnnotationId + '').removeClass("filtered");
    $('#' + arc.targetAnnotationId + '').removeClass("filtered");
    $('#' + this.generateHighlightId(arc.srcAnnotationId) + '').removeClass("over");
    $('#' + this.generateHighlightId(arc.targetAnnotationId) + '').removeClass("over");
  }

  /**
   * Metodo che avvia il disegno di una relazione a partire da una annotazion
   * @param event {any} evento di mousedown //TODO valutare rimozione per mancato uso
   * @param annotation {any} annotazione sulla quale avviene il mousedown
   * @returns {void}
   */
  startDrawing(event: any, annotation: any) {
    if (!annotation.id) {
      return;
    }

    const ann = this.annotationsRes?.annotations?.find((a: any) => a.id == annotation.id);

    if (!ann) {
      return;
    }

    this.dragArrow.sourceAnn = ann;
    this.dragArrow.isDrawing = true;
    this.dragArrow.m = "M " + (annotation.startX + (annotation.endX - annotation.startX) / 2) + " " + annotation.y + ", "
    this.dragArrow.x1 = annotation.startX + annotation.width / 2;
    this.dragArrow.y1 = annotation.y - this.visualConfig.draggedArcHeight;

    this.clearSelection();
  }

  /**
   * Metodo che conclude il disegno di una relazione su mouseup al di fuori di un'annotazione (non crea la relazione)
   * @param event {any} evento di mouseup //TODO valutare rimozione per mancato uso
   * @returns {void}
   */
  endDrawing(event: any) {
    if (!this.dragArrow.isDrawing) {
      return;
    }

    this.dragArrow.isDrawing = false;
    this.dragArrow.visibility = "hidden";
    this.dragArrow.m = ""
    this.dragArrow.c = ""

    this.svg.nativeElement.classList.remove('unselectable');
    this.clearSelection();
  }

  /**
   * Metodo che conclude il disegno di una relazione su mouseup su un'annotazione e richiede la creazione della relazione
   * @param event {any} evento di mouseup su una annotazione
   * @param annotation {Annotation} annotazione sulla quale avviene il mouseup
   * @returns {void}
   */
  endDrawingAndCreateRelation(event: any, annotation: Annotation) {
    if (!this.dragArrow.isDrawing) {
      return;
    }

    if (!annotation.id) {
      this.endDrawing(event)
      return;
    }

    const ann = this.annotationsRes.annotations.find((a: any) => a.id == annotation.id);

    if (!ann) {
      this.endDrawing(event)
      return;
    }

    this.dragArrow.targetAnn = ann;

    this.sourceAnn = JSON.parse(JSON.stringify(this.dragArrow.sourceAnn));
    this.targetAnn = JSON.parse(JSON.stringify(this.dragArrow.targetAnn));

    const sLayer = this.layersList.find(l => l.id == Number.parseInt(this.sourceAnn.layer));
    const tLayer = this.layersList.find(l => l.id == Number.parseInt(this.targetAnn.layer));

    if (!sLayer || !tLayer) {
      this.endDrawing(event)
      return;
    }

    this.sourceLayer = sLayer;
    this.targetLayer = tLayer;

    const relation = new Relation();

    relation.name = "Relation";
    relation.srcAnnotationId = this.dragArrow.sourceAnn.id;
    relation.srcLayerId = Number.parseInt(this.dragArrow.sourceAnn.layer);
    relation.targetAnnotationId = this.dragArrow.targetAnn.id;
    relation.targetLayerId = Number.parseInt(this.dragArrow.targetAnn.layer);
    relation.textId = this.textId;

    this.relation = relation;

    this.showEditorAndHideOthers(EditorType.Relation);

    this.endDrawing(event)
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
    this.height = newHeight - Math.ceil(this.visualConfig.jsPanelHeaderBarHeight);
    this.textContainerHeight = this.height - Math.ceil(this.visualConfig.layerSelectHeightAndMargin + this.visualConfig.paddingAfterTextEditor);
  }

  /**Metodo che aggiorna le dimensioni dell'editor di testo */
  updateTextEditorSize() {
    // this.renderData();
    this.loadData(this.textRange.start, this.textRange.end);
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

        //righe extra
        this.addExtraRowsUp();
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

        //righe extra 
        if (this.textRange.end + this.extraRowsWidenessUpOrDown < this.textTotalRows + this.backendIndexCompensation
          && !this.textRange.hasExtraRowsAfterEnd) {
          this.textRange.extraRowsAfterEnd = this.extraRowsWidenessUpOrDown;
        }
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
        if (this.textRange.end + this.extraRowsWidenessUpOrDown < this.textTotalRows + this.backendIndexCompensation
          && !this.textRange.hasExtraRowsAfterEnd) {
          this.textRange.extraRowsAfterEnd = this.extraRowsWidenessUpOrDown;
        }
        break;
    }
    //#endregion
    this.loadData(this.textRange.start, this.textRange.end + this.backendIndexCompensation);
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
   * @private
   * Metodo che rimuove la selezione testuale
   */
  private clearSelection() {
    const selection = window.getSelection();

    if (selection != null) {
      selection.removeAllRanges();
    }
    // window.getSelection().removeAllRanges();
    // if (selRect != null) {
    //   for(var s=0; s != selRect.length; s++) {
    //     selRect[s].parentNode.removeChild(selRect[s]);
    //   }
    //   selRect = null;
    //   lastStartRec = null;
    //   lastEndRec = null;
    // }
  }

  /**
* Metodo che recupera i dati iniziali relativi a opzioni, testo selezionato, con le sue annotazioni e relazioni
* @returns {void}
*/
  private loadData(start: number, end: number) {
    if (!this.textId) {
      return;
    }

    this.loaderService.show();

    if (!this.visibleAnnotationId) {
      this.annotation = new Annotation();
      this.textoAnnotation = new TAnnotation();
    }

    this.relation = new Relation();

    const visibleLayersIds = this.selectedLayers?.map(l => l.id!) || [];
    const isSameLayers = this.commonService.compareArrays(visibleLayersIds, this.lastRenderedLayers);//I check if the same layers are visible as in the previous call
    const isSameRows = this.previousStartRow === start && this.previousEndRow === end;

    let rowsReq: Observable<PaginatedResponse>;
    let annotationsReq: Observable<TAnnotation[]>;
    if (visibleLayersIds.length === 0) {
      annotationsReq = of(<TAnnotation[]>[]);
    } else {
      if (isSameRows) {
        annotationsReq = isSameLayers ? of(this.textoAnnotationsRes) : this.annotationService.retrieveResourceAnnotations(this.textId, { start: start, end: end, layers: visibleLayersIds });
      } else {
        annotationsReq = this.annotationService.retrieveResourceAnnotations(this.textId, { start: start, end: end, layers: visibleLayersIds });
      }
    }

    if (!isSameRows) {
      rowsReq = this.annotationService.retrieveTextSplitted(this.textId, { start: start, end: end });
    } else {
      const paginatedResponse = <PaginatedResponse>{
        data: this.textSplittedRows,
        count: this.textTotalRows,
        start: start,
        end: end,
        offset: this.offset
      };
      rowsReq = of(paginatedResponse);
    }

    forkJoin([
      rowsReq,
      annotationsReq
    ]).pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(`Loading data failed: ${error.error.message}`));
        this.loaderService.hide();
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(([textResponse, tAnnotationsResponse]) => {
      this.previousStartRow = start;
      this.previousEndRow = end;
      this.lastRenderedLayers = visibleLayersIds;
      // this.layersList = layersResponse;
      this.textTotalRows = textResponse.count!;

      if (this.selectedLayers) {
        this.visibleLayers = this.selectedLayers;
      }

      if (!this.selectedLayers) { //se non ci sono layer selezionati i layer selezionati e visibili sono uguali alla lista di layer
        this.visibleLayers = this.selectedLayers = this.layersList;
      }
      else {
        this.visibleLayers = this.selectedLayers;
      }

      // this.layerOptions = layersResponse.map(item => ({ label: item.name, value: item.id })); //ottiene le opzioni di layer mappando la risposta in forma più compatta

      // this.layerOptions.sort((a, b) => (a.label && b.label && a.label.toLowerCase() > b.label.toLowerCase()) ? 1 : -1);

      // this.layerOptions.unshift({
      //   label: "Nessuna annotazione",
      //   value: -1
      // });

      if (!this.selectedLayer) {
        this.selectedLayer = undefined;
      }

      // this.annotation.layer = this.selectedLayer;
      // this.annotation.layerName = this.layerOptions.find(l => l.value == this.selectedLayer)?.label;
      this.textoAnnotation.layer = this.selectedLayer ?? this.textoAnnotation.layer;
      this.annotation.layer = this.selectedLayer?.id;
      this.annotation.layerName = this.selectedLayer?.name;

      this.textRes = textResponse.data?.map(d => d.text) || [];
      this.textSplittedRows = textResponse.data;
      this.offset = textResponse.data![0].start;
      this.annotationsRes = null;
      this.textoAnnotationsRes = tAnnotationsResponse;

      if (!this.textoAnnotationsRes.find(t => t.id === this.textoAnnotation.id)) {
        this.textoAnnotationsRes.push(this.textoAnnotation);
      }

      this.simplifiedAnns = [];
      this.simplifiedArcs = []; //TODO inserire valorizzazione da richiesta elenco relazioni

      const layersIndex = new Array<number>();

      this.visibleLayers.forEach(l => {
        if (l.id) {
          layersIndex.push(l.id)
        }
      });

      tAnnotationsResponse.forEach(async (a: TAnnotation) => {
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

      // this.annotationsRes.annotations.forEach((a: Annotation) => { //cicla sulle annotazioni nella risposta
      //   if (a.spans && layersIndex.includes(a.layer)) { //se sono presenti span e il layer è nella lista di quelli visibili
      //     const sAnn = a.spans.map((sc: SpanCoordinates) => { //layer è un id //attributes sono le feature, quindi dovrebbe essere un dizionario con chiave il nome della feature e valore il valore associato, viene usato per elaborare la label
      //       let { spans, ...newAnn } = a;
      //       return {
      //         ...newAnn,
      //         span: sc
      //       }
      //     })

      //     this.simplifiedAnns.push(...sAnn);
      //   }

      //   /*           if (a.attributes && a.attributes["relations"]) {
      //               let sArc = a.attributes["relations"].out.forEach((r: Relation) => {
      //                 if (!this.simplifiedArcs.includes(r) && r.srcLayerId && layersIndex.includes(r.srcLayerId.toString()) && r.targetLayerId && layersIndex.includes(r.targetLayerId.toString())) {
      //                   this.simplifiedArcs.push(r);
      //                 }
      //               })
      //             } */
      // })

      this.simplifiedAnns.sort((a: any, b: any) => a.span.start < b.span.start);

      this.renderData();
    });
  }

  /**
 * @private
 * Metodo che gestisce la renderizzazione del testo annotato
 */
  private renderData() {
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
    let scrollable = this.svgHeight > this.textContainer.nativeElement.clientHeight;
    if (!scrollable) {
      this.textRowsWideness = this.textRowsRangeWidenessPredictor(10);

      //Triggers th OnScroll event
      // this.textContainer.nativeElement.scrollTop = this.lastScrollTop + 1;
      this.scrollingDirection = ScrollingDirectionType.InRange;
      this.updateTextRowsView();
      return;
    }

    if (this.textRange.start === this.precTextRange?.start &&
      this.textRange.end === this.precTextRange?.end &&
      !this.changingSection) {
      this.changingSection = false;
      this.loaderService.hide();
      return;
    }

    let scrolledBlockSize = 0;
    let extraScrollPixels = 0;

    switch (this.scrollingDirection) {
      case ScrollingDirectionType.Down: {
        scrolledBlockSize = this.rows.filter(r => r.rowIndex! <= this.precTextRange!.end - 1).reduce((acc, o) => acc + (o.height || 0), 0);
        const precTextRangeEnd = Math.trunc(this.precTextRange!.end); //remove decimals otherwise it doesn't find matching rowIndex
        const scrollingRow = this.rows.filter(r => r.rowIndex === precTextRangeEnd)[0];
        const scrollingRowHeight = scrollingRow?.height || 0;
        if (scrollingRow === undefined) {
          console.group('scrolling row undefined')
          console.warn('end index', this.precTextRange!.end)
          console.info('rows', this.rows)
          console.groupEnd()
        }
        if (scrollingRow?.height === undefined) {
          console.warn('scrolling row height undefined', scrollingRow)
        }
        extraScrollPixels = this.textContainer.nativeElement.clientHeight - scrollingRowHeight;
        break;
      }
      case ScrollingDirectionType.Up:
        scrolledBlockSize = this.rows.filter(r => r.rowIndex! < this.precTextRange!.start).reduce((acc, o) => acc + (o.height || 0), 0);
        break;
      case ScrollingDirectionType.InRange:
        if (!this.currentVisibleRowIndex) { break; }

        scrolledBlockSize = this.rows.filter(r => r.rowIndex! < this.currentVisibleRowIndex!).reduce((acc, o) => acc + (o.height || 0), 0);
        break;
    }

    //setTimeout it's used for UI synchronization, sometimes the UI is not rendered and we cannot set the right scrollTop
    setTimeout(() => {
      //Trigger OnScroll event
      this.textContainer.nativeElement.scrollTop = scrolledBlockSize - extraScrollPixels;
    }, 0);

    this.lastScrollTop = this.textContainer.nativeElement.scrollTop;

    //Prevents infinite loop between onScroll and checkScroll
    this.preventOnScrollEvent = true;

    this.loaderService.hide();
  }

  /**
 * Search and return the row that is visible in the UI
 * @returns the row that is visible in the UI
 */
  private findCurrentVisibleRow(): TextRow | undefined {
    const scrollHeightStart = this.textContainer.nativeElement.clientHeight + this.textContainer.nativeElement.scrollTop;
    const scrollHeigthEnd = scrollHeightStart + this.textContainer.nativeElement.clientHeight;
    let partialHeight = 0;

    if (this.textContainer.nativeElement.scrollTop === 0) { return this.rows[0]; }

    for (var fieldIndex = 0; fieldIndex < this.rows.length; fieldIndex++) {
      let row = this.rows[fieldIndex];
      partialHeight += row.height;

      if (scrollHeightStart <= (row.height + partialHeight)
        && (row.height + partialHeight) <= scrollHeigthEnd) {
        return row;
      }
    }

    return undefined;
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
  private extraTextRowsWidenessPredictor(): number {
    let arbitraryRowSizeInPixels = 50;
    return Math.ceil(this.textContainer.nativeElement.offsetHeight / arbitraryRowSizeInPixels);
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
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(`Saving annotation failed: ${error.error.message}`));
          reject(error);
          return throwError(() => new Error(error.error));
        }),
      ).subscribe(newAnn => {
        resolve(newAnn);
      });
    });
    return promise;
  }

  private computeArcOffset(lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, lineArcs: Array<any>, startArcX: number, endArcX: number, arcType: string) {
    let spaceFactor = 1;
    if (arcType == "includedArc") {
      spaceFactor = 2;
    }

    const towerH = this.getMaxTowerAroundAnns(lineTowers, sourceSpanLimit, targetSpanLimit);
    const yBaseOffset = this.visualConfig.arcSpacing * spaceFactor;
    let yOffset = yBaseOffset;

    if (towerH > 0) {
      yOffset += towerH;
    }

    const maxRelationOffset = this.getMaxArcOffsetInRange(lineArcs, startArcX, endArcX);
    const adjustOffset = yOffset == yBaseOffset ? yOffset : 0;
    const newPossibleOffset = adjustOffset + maxRelationOffset + this.visualConfig.arcSpacing * 2 / spaceFactor;

    if (maxRelationOffset >= 0 && newPossibleOffset > yOffset) {
      yOffset = newPossibleOffset;
    }

    return yOffset;
  }

  private computeStartAndEndXPosition(sourceSpanLimit: number, targetSpanLimit: number, startIndex: number) {
    const startArcX = this.getComputedTextLength(this.randomString(sourceSpanLimit - (startIndex || 0)), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;
    const endArcX = this.getComputedTextLength(this.randomString(targetSpanLimit - (startIndex || 0)), this.visualConfig.textFont) + this.visualConfig.stdTextOffsetX;

    return {
      startArcX: startArcX,
      endArcX: endArcX
    }
  }

  private createLine(auxLineBuilder: any) {
    const startIndex = auxLineBuilder.startLine;
    const endIndex = auxLineBuilder.startLine + auxLineBuilder.line.text.length;

    const resAnns = this.renderAnnotationsForLine(startIndex, endIndex);
    const lineTowers = resAnns.lineTowers;
    const lineHighlights = resAnns.lineHighLights;

    const resArcs = this.renderArcsForLine(startIndex, endIndex, lineTowers);

    let lineHeight = this.getStdLineHeight();

    if (lineTowers.length > 0) {
      const towerH = this.getMaxTowerPosition(lineTowers)
      lineHeight = this.getStdLineHeight() + towerH + this.visualConfig.curlyHeight + 1;
    }

    let arcH = 0;

    if (resArcs.length > 0) {
      arcH = this.getMaxArcOffset(resArcs) + 2 + this.visualConfig.arcSpacing;
    }

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

    resArcs.forEach((ar) => {
      const sAnn = this.findAnnotationInTowers(ar.relation.sourceAnn.id, lineTowers);
      const tAnn = this.findAnnotationInTowers(ar.relation.targetAnn.id, lineTowers);

      switch (ar.type) {
        case "includedArc": {
          ar.start.y = sAnn.y + this.visualConfig.annotationHeight / 2;
          ar.end.y = tAnn.y + this.visualConfig.annotationHeight / 2;

          const diffH = yAnnotation - Math.max(ar.start.y, ar.end.y)
          ar.yArcOffset = yAnnotation + diffH - ar.yArcOffset;

          break;
        }

        case "startedArc": {
          ar.start.y = sAnn.y + this.visualConfig.annotationHeight / 2;
          ar.end.y = sAnn.y + this.visualConfig.annotationHeight / 2;

          const diffH = yAnnotation - Math.max(ar.start.y, ar.end.y)
          ar.yArcOffset = yAnnotation + diffH - ar.yArcOffset;

          break;
        }

        case "endedArc": {
          ar.start.y = tAnn.y + this.visualConfig.annotationHeight / 2;
          ar.end.y = tAnn.y + this.visualConfig.annotationHeight / 2;

          const diffH = yAnnotation - Math.max(ar.start.y, ar.end.y)
          ar.yArcOffset = yAnnotation + diffH - ar.yArcOffset;

          break;
        }

        case "passingArc": {
          ar.yArcOffset = yAnnotation - ar.yArcOffset;
          ar.start.y = ar.yArcOffset;
          ar.end.y = ar.yArcOffset;
          break;
        }

        default: {
          break;
        }
      }

      const paths = this.generateArcPath(ar);

      ar.firstSegmentPath = paths.firstSegmentPath;
      ar.secondSegmentPath = paths.secondSegmentPath;

      if (ar.circleVisible) {
        ar.circleStartX = Math.min(ar.firstSegment.start, ar.secondSegment.end) + Math.abs(ar.firstSegment.start - ar.secondSegment.end) / 2 - this.visualConfig.arcCircleLabelPlaceholderWidth / 2;
        ar.circleStartY = ar.yArcOffset + ar.yAnnOffset - this.visualConfig.arcCircleLabelPlaceholderHeight / 2;
        ar.circleHeight = this.visualConfig.arcCircleLabelPlaceholderHeight;
        ar.circleWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
      }
      else {
        ar.label.yArcLabel = ar.yArcOffset + 3;
      }
    })

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
      arcs: resArcs
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

  /**
   * @private
   * Metodo che calcola la label da assegnare a un arco di relazione
   * @param name {string} nome della relazione
   * @returns {{labelText: string, textWidth: number, labelWidth: number}} dati per la label dell'arco
   */
  private elaborateArcLabel(name: string) {
    let labelText = "";

    if (name.trim().length > this.visualConfig.labelMaxLength) {
      labelText = name.trim().substring(0, this.visualConfig.labelMaxLength - this.visualConfig.labelEllipsisText.length) + this.visualConfig.labelEllipsisText;
    }
    else {
      labelText = name.trim().substring(0, this.visualConfig.labelMaxLength);
    }

    const textWidth = this.getComputedTextLength(labelText, this.visualConfig.arcFont);
    const labelWidth = textWidth + this.visualConfig.labelPaddingXAxis * 2;

    return {
      labelText: labelText,
      textWidth: textWidth,
      labelWidth: labelWidth
    };
  }

  private elaborateEndedArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
    const arcType = "endedArc";

    // ComputeStartAndEndXPosition
    const xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
    let startArcX = xPositionRes.startArcX;
    const endArcX = xPositionRes.endArcX;

    // ElaborateArcLabel
    const arcLabelRes = this.elaborateArcLabel(r.relation.name)
    const labelText = arcLabelRes.labelText;
    const textWidth = arcLabelRes.textWidth;
    let labelWidth = arcLabelRes.labelWidth;

    let endSecondSegment = endArcX;

    if (isFromLeftToRight) {
      // startFirstSegment += this.visualConfig.arcAngleOffset;
      startArcX = this.visualConfig.stdTextOffsetX;
      endSecondSegment -= this.visualConfig.arcAngleOffset;
    }
    else {
      // startFirstSegment -= this.visualConfig.arcAngleOffset;
      startArcX = this.svg.nativeElement.clientWidth;
      endSecondSegment += this.visualConfig.arcAngleOffset;
    }

    const startFirstSegment = startArcX;

    const arcCenter = Math.abs(endSecondSegment - startFirstSegment) / 2;

    const arcSize = Math.abs(endArcX - startArcX);
    const circleVisible = labelWidth >= arcSize || textWidth == 0;

    if (circleVisible) {
      labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
    }

    const signChange = isFromLeftToRight ? 1 : -1;
    const endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth / 2);
    const startSecondSegment = endFirstSegment + signChange * labelWidth;

    const labelStartX = Math.min(startSecondSegment, endFirstSegment);
    const labelEndX = Math.max(startSecondSegment, endFirstSegment);
    const startXText = startFirstSegment + signChange * arcCenter

    const yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

    // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
    // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

    // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
    // yOffset -= yAnnOffset;

    const yLabel = yOffset;

    const arc = {
      start: {
        x: startArcX,
        y: 0,
      },
      end: {
        x: endArcX,
        y: r.targetTower.yTowerOffset,
      },
      yArcOffset: yOffset,
      yAnnOffset: 0,
      firstSegment: {
        start: startFirstSegment,
        end: endFirstSegment
      },
      secondSegment: {
        start: startSecondSegment,
        end: endSecondSegment
      },
      label: {
        start: labelStartX,
        end: labelEndX,
        width: labelWidth,
        text: labelText,
        startXText: startXText,
        yArcLabel: yLabel
      },
      relation: r,
      relationId: r.relation.id,
      type: arcType,
      circleVisible: circleVisible
    }

    return arc;
  }

  private elaborateInLineArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
    const arcType = "includedArc";

    // ComputeStartAndEndXPosition
    const xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
    const startArcX = xPositionRes.startArcX;
    const endArcX = xPositionRes.endArcX;

    // ElaborateArcLabel
    const arcLabelRes = this.elaborateArcLabel(r.relation.name)
    const labelText = arcLabelRes.labelText;
    const textWidth = arcLabelRes.textWidth;
    let labelWidth = arcLabelRes.labelWidth;

    let startFirstSegment = startArcX;
    let endSecondSegment = endArcX;

    if (isFromLeftToRight) {
      startFirstSegment += this.visualConfig.arcAngleOffset;
      endSecondSegment -= this.visualConfig.arcAngleOffset;
    }
    else {
      startFirstSegment -= this.visualConfig.arcAngleOffset;
      endSecondSegment += this.visualConfig.arcAngleOffset;
    }

    const arcCenter = Math.abs(endSecondSegment - startFirstSegment) / 2;

    const arcSize = Math.abs(endArcX - startArcX);
    const circleVisible = labelWidth >= arcSize || textWidth == 0;

    if (circleVisible) {
      labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
    }

    const signChange = isFromLeftToRight ? 1 : -1;
    const endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth / 2);
    const startSecondSegment = endFirstSegment + signChange * labelWidth;

    const labelStartX = Math.min(startSecondSegment, endFirstSegment);
    const labelEndX = Math.max(startSecondSegment, endFirstSegment);
    const startXText = startFirstSegment + signChange * arcCenter

    const yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

    // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
    // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

    // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
    // yOffset -= yAnnOffset;

    const yLabel = yOffset;

    const arc = {
      start: {
        x: startArcX,
        y: r.sourceTower.yTowerOffset,
      },
      end: {
        x: endArcX,
        y: r.targetTower.yTowerOffset,
      },
      yArcOffset: yOffset,
      yAnnOffset: 0,
      firstSegment: {
        start: startFirstSegment,
        end: endFirstSegment
      },
      secondSegment: {
        start: startSecondSegment,
        end: endSecondSegment
      },
      label: {
        start: labelStartX,
        end: labelEndX,
        width: labelWidth,
        text: labelText,
        startXText: startXText,
        yArcLabel: yLabel
      },
      relation: r,
      relationId: r.relation.id,
      type: arcType,
      circleVisible: circleVisible
    }

    return arc;
  }

  private elaboratePassingArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
    const arcType = "passingArc";

    // ComputeStartAndEndXPosition
    const xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
    let startArcX = xPositionRes.startArcX;
    let endArcX = xPositionRes.endArcX;

    // ElaborateArcLabel
    const arcLabelRes = this.elaborateArcLabel(r.relation.name)
    const labelText = arcLabelRes.labelText;
    const textWidth = arcLabelRes.textWidth;
    let labelWidth = arcLabelRes.labelWidth;

    if (isFromLeftToRight) {
      startArcX = this.visualConfig.stdTextOffsetX;
      endArcX = this.svg.nativeElement.clientWidth;
    }
    else {
      startArcX = this.svg.nativeElement.clientWidth;
      endArcX = this.visualConfig.stdTextOffsetX;
    }

    const startFirstSegment = startArcX;
    const endSecondSegment = endArcX;

    const arcCenter = Math.abs(endSecondSegment - startFirstSegment) / 2;

    const arcSize = Math.abs(endArcX - startArcX);
    const circleVisible = labelWidth >= arcSize || textWidth == 0;

    if (circleVisible) {
      labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
    }

    const signChange = isFromLeftToRight ? 1 : -1;
    const endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth / 2);
    const startSecondSegment = endFirstSegment + signChange * labelWidth;

    const labelStartX = Math.min(startSecondSegment, endFirstSegment);
    const labelEndX = Math.max(startSecondSegment, endFirstSegment);
    let startXText = startFirstSegment + signChange * arcCenter
    startXText = startFirstSegment + signChange * arcCenter
    const yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

    // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
    // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

    // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
    // yOffset -= yAnnOffset;

    const yLabel = yOffset;

    const arc = {
      start: {
        x: startArcX,
        y: 0,
      },
      end: {
        x: endArcX,
        y: 0,
      },
      yArcOffset: yOffset,
      yAnnOffset: 0,
      firstSegment: {
        start: startFirstSegment,
        end: endFirstSegment
      },
      secondSegment: {
        start: startSecondSegment,
        end: endSecondSegment
      },
      label: {
        start: labelStartX,
        end: labelEndX,
        width: labelWidth,
        text: labelText,
        startXText: startXText,
        yArcLabel: yLabel
      },
      relation: r,
      relationId: r.relation.id,
      type: arcType,
      circleVisible: circleVisible
    }

    return arc;
  }

  private elaborateStartedArc(r: any, lineTowers: Array<any>, sourceSpanLimit: number, targetSpanLimit: number, startIndex: number, lineArcs: Array<any>, isFromLeftToRight: boolean) {
    const arcType = "startedArc";

    // ComputeStartAndEndXPosition
    const xPositionRes = this.computeStartAndEndXPosition(sourceSpanLimit, targetSpanLimit, startIndex);
    const startArcX = xPositionRes.startArcX;
    let endArcX = xPositionRes.endArcX;

    // ElaborateArcLabel
    const arcLabelRes = this.elaborateArcLabel(r.relation.name)
    const labelText = arcLabelRes.labelText;
    const textWidth = arcLabelRes.textWidth;
    let labelWidth = arcLabelRes.labelWidth;

    let startFirstSegment = startArcX;

    if (isFromLeftToRight) {
      startFirstSegment += this.visualConfig.arcAngleOffset;
      endArcX = this.svg.nativeElement.clientWidth;
      // endSecondSegment -= this.visualConfig.arcAngleOffset;
    }
    else {
      startFirstSegment -= this.visualConfig.arcAngleOffset;
      endArcX = this.visualConfig.stdTextOffsetX;
      // endSecondSegment += this.visualConfig.arcAngleOffset;
    }

    let endSecondSegment = endArcX;

    const arcCenter = Math.abs(endSecondSegment - startFirstSegment) / 2;

    const arcSize = Math.abs(endArcX - startArcX);
    const circleVisible = labelWidth >= arcSize || textWidth == 0;

    if (circleVisible) {
      labelWidth = this.visualConfig.arcCircleLabelPlaceholderWidth;
    }

    const signChange = isFromLeftToRight ? 1 : -1;
    const endFirstSegment = startFirstSegment + signChange * (arcCenter - labelWidth / 2);
    let startSecondSegment = endFirstSegment + signChange * labelWidth;

    if (startSecondSegment < this.visualConfig.stdTextOffsetX) {
      startSecondSegment = this.visualConfig.stdTextOffsetX;
      endSecondSegment = this.visualConfig.stdTextOffsetX - 1;
    }

    const labelStartX = Math.min(startSecondSegment, endFirstSegment);
    const labelEndX = Math.max(startSecondSegment, endFirstSegment);
    const startXText = startFirstSegment + signChange * arcCenter

    const yOffset = this.computeArcOffset(lineTowers, sourceSpanLimit, targetSpanLimit, lineArcs, startArcX, endArcX, arcType);

    // let sAnn = this.findAnnotationInTowers(r.sourceAnn.id, lineTowers);
    // let tAnn = this.findAnnotationInTowers(r.targetAnn.id, lineTowers);

    // let yAnnOffset = Math.max(sAnn.yOffset, tAnn.yOffset);
    // yOffset -= yAnnOffset;

    const yLabel = yOffset;

    const arc = {
      start: {
        x: startArcX,
        y: r.sourceTower.yTowerOffset,
      },
      end: {
        x: endArcX,
        y: 0,
      },
      yArcOffset: yOffset,
      yAnnOffset: 0,
      firstSegment: {
        start: startFirstSegment,
        end: endFirstSegment
      },
      secondSegment: {
        start: startSecondSegment,
        end: endSecondSegment
      },
      label: {
        start: labelStartX,
        end: labelEndX,
        width: labelWidth,
        text: labelText,
        startXText: startXText,
        yArcLabel: yLabel
      },
      relation: r,
      relationId: r.relation.id,
      type: arcType,
      circleVisible: circleVisible
    }

    return arc;
  }

  /**
   * @private
   * Metodo che recupera un'annotazione fra quelle semplificate sulla base dell'id
   * @param id {number} identificativo dell'annotazione
   * @returns {any} annotazione estratta dalle annotazioni semplificate
   */
  private findAnnotationById(id: number) {
    return this.simplifiedAnns.find((an: any) => an.id == id);
  }

  /**
   * @private
   * Metodo che recupera un'annotazione dalle tower utilizzando l'id
   * @param id {number} identificativo numerico dell'annotazione
   * @param lineTowers {Array<any>} lista ?
   * @returns {any} annotazione corrispondente nella tower ?
   */
  private findAnnotationInTowers(id: number, lineTowers: Array<any>) {
    var t = lineTowers.find((t: any) => t.tower.some((ann: any) => ann.id == id));

    var ann = undefined;

    if (t && t.tower) {
      ann = t.tower.find((ann: any) => ann.id == id);
    }

    return ann;
  }

  /**
   * @private
   * Metodo che recupera la tower contenente una data annotazione
   * @param id {number} identificativo numerico dell'annotazione
   * @param lineTowers {Array<any>} lista ?
   * @returns {any} tower contenente l'annotazione
   */
  private findTowerByAnnotationId(id: number, lineTowers: Array<any>) {
    var t = lineTowers.find((t: any) => t.tower.some((ann: any) => ann.id == id));
    return t;
  }

  private generateArcPath(ar: any): { firstSegmentPath: string; secondSegmentPath: string; } {
    let firstArcSegment = "";
    let secondArcSegment = "";

    switch (ar.type) {
      case "includedArc": {
        const moveToArcStart = "M " + ar.start.x + " " + ar.start.y;
        const moveToFirstStart = "L " + ar.firstSegment.start + " " + ar.yArcOffset;
        const lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

        const moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
        const lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;
        const moveToArcEnd = "L " + ar.end.x + " " + ar.end.y;

        firstArcSegment = moveToArcStart + " " + moveToFirstStart + " " + lineFirstSegment;
        secondArcSegment = moveToSecondStart + " " + lineSecondSegment + " " + moveToArcEnd;
        break;
      }

      case "startedArc": {
        const moveToArcStart = "M " + ar.start.x + " " + ar.start.y;
        const moveToFirstStart = "L " + ar.firstSegment.start + " " + ar.yArcOffset;
        const lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

        const moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
        const lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;

        firstArcSegment = moveToArcStart + " " + moveToFirstStart + " " + lineFirstSegment;
        secondArcSegment = moveToSecondStart + " " + lineSecondSegment;
        break;
      }

      case "endedArc": {
        const moveToFirstStart = "M " + ar.firstSegment.start + " " + ar.yArcOffset;
        const lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

        const moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
        const lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;
        const moveToArcEnd = "L " + ar.end.x + " " + ar.end.y;

        firstArcSegment = moveToFirstStart + " " + lineFirstSegment;
        secondArcSegment = moveToSecondStart + " " + lineSecondSegment + " " + moveToArcEnd;
        break;
      }

      case "passingArc": {
        const moveToFirstStart = "M " + ar.firstSegment.start + " " + ar.yArcOffset;
        const lineFirstSegment = "L " + ar.firstSegment.end + " " + ar.yArcOffset;

        const moveToSecondStart = "M " + ar.secondSegment.start + " " + ar.yArcOffset;
        const lineSecondSegment = "L " + ar.secondSegment.end + " " + ar.yArcOffset;

        firstArcSegment = moveToFirstStart + " " + lineFirstSegment;
        secondArcSegment = moveToSecondStart + " " + lineSecondSegment;
        break;
      }

      default: {
        break;
      }
    }

    return {
      firstSegmentPath: firstArcSegment,
      secondSegmentPath: secondArcSegment
    };
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
   * @returns {{startIndex: number, endIndex: number}|undefined} indici iniziale e finale della selezione se presente
   */
  private getCurrentTextSelection() {
    const selection = window.getSelection();

    if (selection != null && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(this.svg.nativeElement);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      this.selectionStart = [...preSelectionRange.toString()].length;
      this.selectionEnd = this.selectionStart + [...range.toString()].length;
    } else {
      this.selectionStart = undefined;
      this.selectionEnd = undefined;
    }

    if (this.selectionStart === undefined || this.selectionEnd === undefined || this.selectionStart >= this.selectionEnd) {
      return undefined;
    }

    return {
      startIndex: this.selectionStart,
      endIndex: this.selectionEnd,
    };
  }

  private getMaxArcOffset(array: Array<any>) {
    return Math.max(...array.map(o => (o.yArcOffset + o.yAnnOffset)));
  }

  private getMaxArcOffsetInRange(array: Array<any>, startX: number, endX: number) {
    const min = Math.min(startX, endX);
    const max = Math.max(startX, endX);

    const filteredArcs = array.filter((ar: any) => (ar.start.x >= min && ar.end.x <= max) ||
      (ar.start.x < min && ar.end.x >= min && ar.end.x <= max) ||
      (ar.start.x > max && ar.end.x >= min && ar.end.x <= max) ||
      (ar.start.x >= min && ar.start.x <= max && ar.end.x < min) ||
      (ar.start.x >= min && ar.start.x <= max && ar.end.x > max) ||
      (ar.start.x < min && ar.end.x > max));

    return this.getMaxArcOffset(filteredArcs);
  }

  private getMaxTowerPosition(array: any[]) {
    return Math.max(...array.map(o => (o.towerHeight + o.yTowerOffset)))
  }

  private getMaxTowerAroundAnns(lineTowers: Array<any>, start: number, end: number) {
    const filteredTowers = lineTowers.filter((t: any) => (t.spanCoordinates.start >= start && t.spanCoordinates.end <= end) || (t.spanCoordinates.start < start && t.spanCoordinates.end > start) || (t.spanCoordinates.start < end && t.spanCoordinates.end > end));

    return this.getMaxTowerPosition(filteredTowers);
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

    return {
      lineTowers: lineTowers,
      lineHighLights: lineHighlights
    };
  }

  /**
   * @private
   * Metodo che gestisce la renderizzazione degli archi per una line
   * @param startIndex {number} indice iniziale
   * @param endIndex {number} indice finale
   * @param lineTowers {Array<any>} lista ?
   * @returns {any[]} lista degli archi per la line
   */
  private renderArcsForLine(startIndex: number, endIndex: number, lineTowers: Array<any>) {
    const lineArcs = new Array();
    const relationsIncludedInLine = new Array();
    const relationsStartedInLine = new Array();
    const relationsEndedInLine = new Array();
    const relationsPassignThroughLine = new Array();

    for (const ar of this.simplifiedArcs) {
      if (!ar.srcAnnotationId || !ar.targetAnnotationId) {
        break;
      }

      const sourceAnn = this.findAnnotationById(ar.srcAnnotationId);
      const targetAnn = this.findAnnotationById(ar.targetAnnotationId);

      const sourceTower = this.findTowerByAnnotationId(ar.srcAnnotationId, lineTowers);
      const targetTower = this.findTowerByAnnotationId(ar.targetAnnotationId, lineTowers);

      if (!sourceAnn || !targetAnn) {
        break;
      }

      if (sourceAnn.span.start >= startIndex && sourceAnn.span.start <= endIndex &&
        targetAnn.span.end >= startIndex && targetAnn.span.end <= endIndex && sourceTower && targetTower) {
        relationsIncludedInLine.push({
          relation: ar,
          sourceAnn: sourceAnn,
          targetAnn: targetAnn,
          sourceTower: sourceTower,
          targetTower: targetTower,
          leftToRight: sourceAnn.span.start <= targetAnn.span.start
        });
      }

      if (sourceAnn.span.start >= startIndex && sourceAnn.span.start <= endIndex &&
        (targetAnn.span.end < startIndex || targetAnn.span.end > endIndex) && sourceTower) {
        relationsStartedInLine.push({
          relation: ar,
          sourceAnn: sourceAnn,
          targetAnn: targetAnn,
          sourceTower: sourceTower,
          targetTower: targetTower,
          leftToRight: sourceAnn.span.start <= targetAnn.span.start
        });
      }

      if (targetAnn.span.end >= startIndex && targetAnn.span.end <= endIndex &&
        (sourceAnn.span.start < startIndex || sourceAnn.span.start > endIndex) && targetTower) {
        relationsEndedInLine.push({
          relation: ar,
          sourceAnn: sourceAnn,
          targetAnn: targetAnn,
          sourceTower: sourceTower,
          targetTower: targetTower,
          leftToRight: sourceAnn.span.start <= targetAnn.span.start
        });
      }

      if (((sourceAnn.span.start < startIndex && sourceAnn.span.start < startIndex && targetAnn.span.start > endIndex && targetAnn.span.end > endIndex) ||
        (sourceAnn.span.start > endIndex && sourceAnn.span.start > endIndex && targetAnn.span.start < startIndex && targetAnn.span.end < startIndex))
        && !sourceTower && !targetTower) {
        relationsPassignThroughLine.push({
          relation: ar,
          sourceAnn: sourceAnn,
          targetAnn: targetAnn,
          sourceTower: sourceTower,
          targetTower: targetTower,
          leftToRight: sourceAnn.span.start <= targetAnn.span.start
        });
      }
    }

    relationsIncludedInLine.sort((a: any, b: any) =>
      (Math.abs(a.sourceAnn.span.start - a.targetAnn.span.start) - Math.abs(b.sourceAnn.span.start - b.targetAnn.span.start)) ||
      (Math.min(a.sourceAnn.span.start, a.targetAnn.span.start) - Math.min(b.sourceAnn.span.start, b.targetAnn.span.start))
    );

    relationsStartedInLine.sort((a: any, b: any) => a.leftToRight ?
      a.sourceAnn.span.end - b.sourceAnn.span.end :
      a.sourceAnn.span.start - b.sourceAnn.span.start
    );

    relationsEndedInLine.sort((a: any, b: any) => a.leftToRight ?
      a.targetAnn.span.start - b.targetAnn.span.start :
      a.targetAnn.span.end - b.targetAnn.span.end
    );

    relationsEndedInLine.reverse();

    relationsPassignThroughLine.sort((a: any, b: any) =>
      Math.min(Math.abs(a.sourceAnn.span.end - a.targetAnn.span.start), Math.abs(b.sourceAnn.span.end - b.targetAnn.span.start)) ||
      Math.min(Math.min(a.sourceAnn.span.start, a.targetAnn.span.start), Math.min(b.sourceAnn.span.start, b.targetAnn.span.start))
    );

    relationsIncludedInLine.forEach(r => {
      let arc: any;

      arc = this.elaborateInLineArc(
        r,
        lineTowers,
        r.leftToRight ? r.sourceAnn.span.end : r.sourceAnn.span.start,
        r.leftToRight ? r.targetAnn.span.start : r.targetAnn.span.end,
        startIndex,
        lineArcs,
        r.leftToRight
      );

      lineArcs.push(arc);
    })

    relationsStartedInLine.forEach(r => {
      let arc: any;

      arc = this.elaborateStartedArc(
        r,
        lineTowers,
        r.leftToRight ? r.sourceAnn.span.end : r.sourceAnn.span.start,
        r.leftToRight ? endIndex : startIndex,
        startIndex,
        lineArcs,
        r.leftToRight
      );

      lineArcs.push(arc);
    })

    relationsEndedInLine.forEach(r => {
      let arc: any;

      arc = this.elaborateEndedArc(
        r,
        lineTowers,
        r.leftToRight ? startIndex : endIndex,
        r.leftToRight ? r.targetAnn.span.start : r.targetAnn.span.end,
        startIndex,
        lineArcs,
        r.leftToRight
      );

      lineArcs.push(arc);
    })

    relationsPassignThroughLine.forEach(r => {
      let arc: any;

      arc = this.elaboratePassingArc(
        r,
        lineTowers,
        r.leftToRight ? startIndex : endIndex,
        r.leftToRight ? r.targetAnn.span.start : r.targetAnn.span.end,
        startIndex,
        lineArcs,
        r.leftToRight
      );

      lineArcs.push(arc);
    })

    return lineArcs;
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
}



