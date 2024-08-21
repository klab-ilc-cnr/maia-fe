import { AfterViewInit, Component, ComponentRef, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, TreeNode } from 'primeng/api';
import { Observable, Subject, catchError, lastValueFrom, take, takeUntil } from 'rxjs';
import { TextChoice } from 'src/app/models/tile/text-choice-element.model';
import { TileType } from 'src/app/models/tile/tile-type.model';
import { Tile } from 'src/app/models/tile/tile.model';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { CorpusTileContent } from './../../models/tile/corpus-tile-content';
import { ScrollingDirectionType, WorkspaceTextWindowComponent } from './workspace-text-window/workspace-text-window.component';
// import { WorkspaceMenuComponent } from '../workspace-menu/workspace-menu.component';
import { HttpErrorResponse } from '@angular/common/http';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { Layer } from 'src/app/models/layer/layer.model';
import { LexicalEntryOld, LexicalEntryTypeOld } from 'src/app/models/lexicon/lexical-entry.model';
import { SearchResultRow } from 'src/app/models/search/search-result';
import { CorpusElement } from 'src/app/models/texto/corpus-element';
import { DictionaryEditorTileContent } from 'src/app/models/tile/dictionary-editor-tile-content.model';
import { DictionaryExplorerTileContent } from 'src/app/models/tile/dictionary-explorer-tile-content.model';
import { LexiconEditTileContent } from 'src/app/models/tile/lexicon-edit-tile-content.model';
import { LexiconTileContent } from 'src/app/models/tile/lexicon-tile-content.model';
import { SearchTileContent } from 'src/app/models/tile/search-tile-content.model';
import { TextTileContent } from 'src/app/models/tile/text-tile-content.model';
import { Workspace } from 'src/app/models/workspace.model';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LoaderService } from 'src/app/services/loader.service';
import { StorageService } from 'src/app/services/storage.service';
import { environment } from 'src/environments/environment';
import { WorkspaceCorpusExplorerComponent } from './workspace-corpus-explorer/workspace-corpus-explorer.component';
import { WorkspaceDictionaryEditorTileComponent } from './workspace-dictionary-editor-tile/workspace-dictionary-editor-tile.component';
import { WorkspaceDictionaryTileComponent } from './workspace-dictionary-tile/workspace-dictionary-tile.component';
import { WorkspaceLexiconEditTileComponent } from './workspace-lexicon-edit-tile/workspace-lexicon-edit-tile.component';
import { WorkspaceLexiconTileComponent } from './workspace-lexicon-tile/workspace-lexicon-tile.component';
import { WorkspaceSearchTileComponent } from './workspace-search-tile/workspace-search-tile.component';
import { WorkspaceTextSelectorComponent } from './workspace-text-selector/workspace-text-selector.component';
import { WorkspaceOntologyExplorerComponent } from './workspace-ontology-explorer/workspace-ontology-explorer.component';
import { OntologyClass } from 'src/app/models/ontology/ontology-class.model';
import { OntologyViewerTileContent } from 'src/app/models/tile/ontology-viewer-tile-content.model';
import { OntologyExplorerTileContent } from 'src/app/models/tile/ontology-explorer-tile-content.model';
import { WorkspaceOntologyViewerComponent } from './workspace-ontology-viewer/workspace-ontology-viewer.component';
import { EventsConstants } from 'src/app/constants/events-constants';
// import { CorpusTileContent } from '../models/tileContent/corpus-tile-content';

/**Variabile dell'istanza corrente del workspace */
let currentWorkspaceInstance: any; //TODO verificare effettivo utilizzo

/**Componente base del workspace */
@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  /**
   * @private
   * Identificativo per un nuovo workspace
   */
  private newId = 'new';

  /**
   * @private
   * Definisce se è un nuovo workspace
   */
  private newWorkspace = false;
  /**
   * @private
   * Identificativo del workspace
   */
  private workspaceId: string | undefined = undefined;

  /**
   * @private
   * Prefisso del titolo di un tile di testo
   */
  private textTilePrefix = 'textTile_';

  /**
   * @private
   * Prefisso dell'ID di un tile di modifica del lessico
   */
  private lexiconEditTilePrefix = 'lexiconEditTile_';

  private dictionaryEditorTilePrefix = 'dictionaryEditTile_'

  private ontologyViewTilePrefix = 'ontologyViewTile_';

  /**
   * @private
   * Definisce il lavoro è stato salvato
   */
  private workSaved = false;
  //private mainPanel: any;
  //private openPanels: Map<string, any> = new Map(); //PROBABILMENTE SI PUò DEPRECARE, USARE STOREDTILES
  /**
   * @private
   * Id del contenitore dei pannelli nel template
   */
  private workspaceContainer = "#panelsContainer";

  //private storedData: any;
  //private storedTiles: Map<string, Tile<any>> = new Map();
  /**
   * @private
   * Nome della proprietà del localstorage che memorizza i tile
   */
  private storageName = `${this.storageService.tokenPrefix}_storedTiles`;

  /**Sottoscrizione per tracciare emissioni da Common Service */
  // private subscription!: Subscription;

  /**Lista degli elementi di menu di primeng */
  public items: MenuItem[] = [];
  /**Lista dei layer visibili */
  public visibleLayers: Layer[] = [];

  workspaceName!: string;

  /**Riferimento al contenitore die pannelli */
  @ViewChild('panelsContainer') public container!: ElementRef;
  /**Riferimento al contenitore del menu del workspace */
  @ViewChild('workspaceMenuContainer') public wsMenuContainer!: ElementRef;

  // @HostListener allows us to also guard against browser refresh, close, etc.
  /**
   * Metodo che verifica la presenza di modifiche pendenti, se non ve ne sono è possibile navigare altrove direttamente, altrimenti viene visualizzato un popup di conferma.
   * L'hostlistener permette di intercettare anche refresh, chiusura e altri eventi del browser
   * @returns {Observable<boolean>|boolean} definisce se ci sono modifiche pendenti
   */
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    //this.mainPanel.close();
    //this.openPanels.forEach((panel, id) => panel.close());
    this.saveWork(null);

    // if (this.workSaved) {

    //Chiudo tutti i pannelli aperti anche i modal
    jsPanel
      .getPanels(function (this: any) {
        return this.classList.contains('jsPanel');
      })
      .forEach((panel: { close: () => any; }) => panel.close());

    localStorage.removeItem(this.storageName)
    // }

    // return this.workSaved;
    return true;
  }

  /**
   * Metodo che intercetta il ridimensionamento della finestra e richiama la modifica delle dimensioni del contenitore
   * @param event {{target:any}} evento
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: { target: any; }) {
    //this.mainPanel.maximize();
    // console.log('Mappa panels');
    //console.log(this.openPanels);
    // console.log(jsPanel.getPanels());

    this.resizeContainerHeight()
  }

  @HostListener("document:jspaneldragstop", ["$event"]) checkIsNotOverflowingContainer(event: any) {
    // let overlaps = event.panel.overlaps(this.workspaceContainer, "paddingbox", event);
    if (event.panel.offsetTop < 0) {
      event.panel.reposition({
        my: 'left-top',
        at: 'left-top',
        of: '#panelsContainer'
      });
    }
  }

  /**
   * Costruttore per WorkspaceComponent
   * @param router {Router} servizi per la navigazione fra le viste
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param cd {ChangeDetectorRef} fornisce funzionalità di verifica di modifiche per la visualizzazione //TODO verificare se possiamo rimuovere
   * @param vcr {ViewContainerRef} contenitore dove un o più view possono essere attaccate a un componente
   * @param workspaceService {WorkspaceService} servizi relativi ai workspace
   * @param renderer {Renderer2} classe che può essere estesa per implementare renderizzazioni personalizzate
   * @param commonService {CommonService} servizi comuni
   */
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private vcr: ViewContainerRef,
    private workspaceService: WorkspaceService,
    private renderer: Renderer2,
    private commonService: CommonService,
    private storageService: StorageService,
    private lexiconService: LexiconService,
    private dictionaryService: DictionaryService,
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per il recupero iniziale dei dati e per sottoscrivere i comportamenti del jsPanel */
  ngOnInit(): void {

    this.commonService.notifyObservable$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((res) => {
      if ('option' in res) {
        switch (res.option) {
          case EventsConstants.onLexiconTreeElementDoubleClickEvent: {
            const selectedSubTree = structuredClone(res.value[0]);
            const showLabelName = structuredClone(res.value[1]);
            this.openLexiconEditTile(selectedSubTree, showLabelName);
            break;
          }
          case EventsConstants.onSearchResultTableDoubleClickEvent: {
            const searchResultRow: SearchResultRow = structuredClone(res.value[0]);
            this.openTextPanel(searchResultRow.textId, searchResultRow.text, searchResultRow.rowIndex, searchResultRow.kwic, searchResultRow.kwicOffset);
            break;
          }
          case EventsConstants.onDictionaryEntryDblClickEvent: {
            this.openDictionaryEditPanel(res.value);
            break;
          }
          case EventsConstants.onOntologyClassElementDoubleClickEvent: {
            const selectedSubTree = structuredClone(res.value[0]);
            this.openOntologyClassViewerTile(selectedSubTree);
            break;
          }
          default:
            break;
        }
      }
    });

    this.items = [
      {
        label: 'Corpus',
        styleClass: 'p-button-raised p-button-text',
        command: (event) => { this.openExploreCorpusPanel(event) }
      },
      {
        label: 'Lexicon',
        command: (event) => { this.openLexiconPanel(event) }
      },
      {
        label: 'Ontology',
        command: (event) => { this.openOntologyExplorerPanel(event) }
      },
      {
        label: 'Search',
        command: (event) => { this.openSearchPanel(event) }
      },
      {
        label: 'Dictionary',
        command: (event) => { this.openDictionaryPanel(event) }
      }
    ];
    if (environment.demoHide) {
      this.items.splice(2, 1); /**remove ontology from menu */
    }

    this.activeRoute.paramMap.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((params) => {
      this.workspaceId = params.get('id') ?? undefined;

      if (!this.workspaceId) {
        this.router.navigate(['workspaces']);
        return;
      }

      // this.loaderService.show();
      // this.layerService.retrieveLayers().subscribe({
      //   next: (layers: Layer[]) => {
      //     this.visibleLayers = layers; //TODO da gestire
      //     this.loaderService.hide();

      if (this.workspaceId === this.newId) {
        this.newWorkspace = true;
        return;
      }

      if (this.workspaceId != null && this.workspaceId != undefined) {
        this.newWorkspace = false;
        this.loaderService.show();
        this.workspaceService.loadWorkspaceStatus(Number(this.workspaceId)).pipe(
          take(1),
        ).subscribe((data) => {
          console.info('load workspace status data', data)
          data.tiles?.forEach(tile => tile.tileConfig = JSON.parse(tile.tileConfig));
          this.restoreTiles(data);
          this.loaderService.hide();
        }
        );
        return;
      }
    }
      // })
      // }
    );

    if (this.workspaceId && this.workspaceId !== this.newId) {
      this.workspaceService.getWorkspaceName(+this.workspaceId).pipe(take(1)).subscribe(res => {
        this.workspaceName = res;
      })
    }

    jsPanel.extend({
      //mappa key:idPannello, value: tipo e id del tipo, es. testi, ontologie, lessico.
      lexiconEditTileMap: new Map<number, Tile<LexiconEditTileContent>>(),
      textTileMap: new Map<number, Tile<TextTileContent>>(),
      dictionaryEditTileMap: new Map<number, Tile<DictionaryEditorTileContent>>(),
      tileMap: new Map<number, Tile<any>>(),
      componentsList: new Array<any>(),
      // addToPanelsMap: function () {
      //   currentWorkspaceInstance.openPanels.set(this.id, this);

      //   return this;
      // },
      addToTileMap: function (tile: Tile<any>) {
        switch (tile.type as TileType) {
          case TileType.TEXT:
          case TileType.CORPUS:
          case TileType.LAYERS_LIST:
          case TileType.LEXICON:
          case TileType.SEARCH:
          case TileType.LEXICON_EDIT:
          case TileType.DICTIONARY:
          case TileType.DICTIONARY_EDIT:
          case TileType.ONTOLOGY_EXPLORER:
          case TileType.ONTOLOGY_CLASS_VIEWER:
            this.tileMap.set(this.id, tile);
            break;

          default:
            console.error("type " + tile.type + " not implemented");
        }

        return this;
      },
      removeFromTileMap: function (panelId: number, type: TileType) {
        switch (type) {
          case TileType.TEXT:
          case TileType.CORPUS:
          case TileType.LAYERS_LIST:
          case TileType.SEARCH:
          case TileType.LEXICON:
          case TileType.LEXICON_EDIT:
          case TileType.DICTIONARY:
          case TileType.DICTIONARY_EDIT:
          case TileType.ONTOLOGY_EXPLORER:
          case TileType.ONTOLOGY_CLASS_VIEWER:
            this.tileMap.delete(panelId);
            break;

          default:
            console.error("type " + type + " not implemented");
        }

        return this;
      },
      addComponentToList: function (panelId: string, componentRef: ComponentRef<any>, tileType: TileType) {
        this.componentsList.push({
          id: panelId,
          component: componentRef,
          tileType: tileType
        });
      },
      removeComponentFromList: function (panelId: string) {
        const index = this.componentsList.findIndex((item: any) => item.id == panelId);
        this.componentsList.splice(index, 1);
      },
      deleteTileContent: function (panelId: number, type: TileType) {
        switch (type) {
          case TileType.TEXT:
            this.textTileMap.delete(panelId);
            break;
          case TileType.LEXICON_EDIT:
            this.lexiconEditTileMap.delete(panelId);
            break;
          case TileType.DICTIONARY_EDIT:
            this.dictionaryEditTileMap.delete(panelId);
            break;
          default:
            console.error("type ${type} not implemented");
        }

        return this;
      },
      getLexiconEditTileMap: function () {
        return this.lexiconEditTileMap;
      },
      getTextTileMap: function () {
        return this.textTileMap;
      },
      getDictionaryEditTileMap: function () {
        return this.dictionaryEditTileMap;
      },
      getTileMap: function () {
        return this.tileMap;
      },
      getComponentsList: function () {
        return this.componentsList;
      }
    })
  }

  /**Metodo dell'interfaccia AfterViewInit, utilizzato per inizializzare il currentWorkspaceInstance e ridimensioare il contenitore */
  ngAfterViewInit(): void {
    currentWorkspaceInstance = this;

    this.resizeContainerHeight()
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per eliminare eventuali sottoscrizioni */
  ngOnDestroy(): void {
    // this.subscription.unsubscribe();
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * Metodo che visualizza il pannello di esplorazione del corpus
   * @param event {any} evento di click su esplora corpus
   * @returns {void}
   */
  openExploreCorpusPanel(event: any) {
    const ecPanelId = 'corpusExplorerTile'

    const panelExist = jsPanel.getPanels().find( //verifica se il panel è già presente
      (x: { id: string; }) => x.id === ecPanelId
    );

    if (panelExist) {
      panelExist.front() //presumibilmente sposta la vista in primo piano
      return; //esce senza eseguire ulteriori azioni, pannello unico non sono possibili pannelli multipli
    }

    const res = this.generateCorpusExplorerPanelConfiguration(ecPanelId);

    const corpusExplorerTileConfig = res.panelConfig;

    const corpusTileElement = jsPanel.create(corpusExplorerTileConfig);
    corpusTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    corpusTileElement.titlebar.style.fontSize = '14px'

    corpusTileElement
      .resize({
        height: window.innerHeight / 2
      })
      .reposition();
    //.addToPanelsMap();
    const { content, ...text } = corpusExplorerTileConfig;

    corpusExplorerTileConfig.content = undefined;

    const tileObject: Tile<CorpusTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: undefined,
      tileConfig: corpusExplorerTileConfig,
      type: TileType.CORPUS
    };


    corpusTileElement.addToTileMap(tileObject);
    corpusTileElement.addComponentToList(res.id, res.component, res.tileType);
  }

  /**
   * Metodo che apre il pannello di annotazione di un testo
   * @param textId {number} identificativo numerico del testo
   * @param title {string} titolo del testo
   * @returns {void}
   */
  openTextPanel(textId: number, title: string, startingRowIndex?: number, kwic?: string, kwicOffsetStart?: number) {
    const modalTextSelect = jsPanel.getPanels(function (this: any) {
      return this.classList.contains('jsPanel-modal');
    })
      .find((x: { id: string; }) => x.id === 'modalTextSelect')

    if (modalTextSelect) {
      modalTextSelect.close();
    }

    const panelId = this.textTilePrefix + textId

    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === panelId
    );

    if (panelExist) { //caso di pannello già presente
      if (startingRowIndex) {
        const textTileComponent = panelExist.getComponentsList().find((c: any) => c.id === panelExist.id);
        this.setChangeSectionOperationInTextTile(textTileComponent.component, startingRowIndex, kwic!, kwicOffsetStart!);
        textTileComponent.component.instance.loadInitialData();
      }

      panelExist.front();
      return;
    }

    const res = this.generateTextTilePanelConfiguration(panelId, textId, title, startingRowIndex ?? 0);

    if (startingRowIndex) {
      this.setChangeSectionOperationInTextTile(res.component, startingRowIndex, kwic!, kwicOffsetStart!);
    }

    const textTileConfig = res.panelConfig;

    const textTileElement = jsPanel.create(textTileConfig); //crea il pannello di annotazione del testo
    textTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    textTileElement.titlebar.style.fontSize = '14px'


    textTileElement
      .resize({
        height: window.innerHeight / 3 * 2,
        width: window.innerWidth / 3 * 2
      })
      .reposition();
    const { content, ...text } = textTileConfig;

    textTileConfig.content = undefined;

    const txtTileContent: TextTileContent = { contentId: textId };

    const tileObject: Tile<TextTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: txtTileContent,
      tileConfig: textTileConfig,
      type: TileType.TEXT
    };

    textTileElement.addToTileMap(tileObject);
    textTileElement.addComponentToList(res.id, res.component, res.tileType);

    // textTile.options.onclosed.push(function (this: any, panel: any, closedByUser: boolean) {
    //   currentWorkspaceInstance.openPanels.delete(panel.id);
    //   this.deleteTileContent(panel.id, TileType.TEXT);
    // });
  }

  /**
   * Metodo che gestisce l'apertura di un pannello di esplorazione del lessico
   * @param event {any} evento di clic su apri pannello di esplorazione del lessico
   * @returns {void}
   */
  openLexiconPanel(event: any) {
    const lexiconPanelId = 'lexiconTile'

    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === lexiconPanelId
    );

    if (panelExist) { //caso pannello di esplorazione del lessico esistente
      panelExist.front()
      return;
    }

    const result = this.generateLexiconPanelConfiguration(lexiconPanelId);

    const lexiconTileConfig = result.panelConfig;

    const lexiconTileElement = jsPanel.create(lexiconTileConfig);
    lexiconTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    lexiconTileElement.titlebar.style.fontSize = '14px'


    lexiconTileElement
      .resize({
        height: window.innerHeight / 2
      })
      .reposition();

    const { content, ...text } = lexiconTileConfig;

    lexiconTileConfig.content = undefined;

    const tileObject: Tile<LexiconTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: undefined,
      tileConfig: lexiconTileConfig,
      type: TileType.LEXICON
    };


    lexiconTileElement.addToTileMap(tileObject);
    lexiconTileElement.addComponentToList(result.id, result.component, result.tileType);
  }

  /**
   * Metodo che apre un pannello di modifica di un'entrata lessicale
   * @param selectedSubTree {TreeNode<LexicalEntryOld>} sottonodo entrata lessicale selezionato
   * @param showLabelName {boolean} definisce se visualizzare la label come nome
   * @returns {void}
   */
  openLexiconEditTile(selectedSubTree: TreeNode<LexicalEntryOld>, showLabelName: boolean) {
    // var lexiconEditTileId = 'lexiconEditTile';
    const lexicalEntryTree = selectedSubTree.data?.type === LexicalEntryTypeOld.LEXICAL_ENTRY ? selectedSubTree : selectedSubTree.parent?.parent;
    const idAfterHash = lexicalEntryTree?.data?.instanceName?.split('#')[1];
    const lexiconEditTileId = this.lexiconEditTilePrefix + idAfterHash;
    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === lexiconEditTileId
    );

    if (panelExist) {
      panelExist.front(); //metto il pannello in primo piano
      return;
    }

    const result = this.generateLexiconEditTileConfiguration(lexiconEditTileId, selectedSubTree, showLabelName);

    const lexiconEditTileConfig = result.panelConfig;

    const lexiconEditTileElement = jsPanel.create(lexiconEditTileConfig);
    lexiconEditTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    lexiconEditTileElement.titlebar.style.fontSize = '14px'

    lexiconEditTileElement
      .resize({
        height: window.innerHeight / 1.5
      })
      .reposition();

    const { content, ...text } = lexiconEditTileConfig;

    lexiconEditTileConfig.content = undefined;
    const lexiconEditTileContent: LexiconEditTileContent = { contentId: lexicalEntryTree?.data?.instanceName }  //NOTE For multiple panels, it is critical to pass the content id into the related content property (so that the data can be retrieved without display errors).

    const tileObject: Tile<LexiconEditTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: lexiconEditTileContent,
      tileConfig: lexiconEditTileConfig,
      type: TileType.LEXICON_EDIT
    };

    lexiconEditTileElement.addToTileMap(tileObject);
    lexiconEditTileElement.addComponentToList(result.id, result.component, result.tileType);
  }

  /**
 * Opens the search tile
 * @param event {any}
 * @returns {void}
 */
  openSearchPanel(event: any) {
    const searchPanelId = 'searchTile'

    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === searchPanelId
    );

    if (panelExist) {
      panelExist.front()
      return;
    }

    const result = this.generateSearchPanelConfiguration(searchPanelId);

    const searchTileConfig = result.panelConfig;

    const searchTileElement = jsPanel.create(searchTileConfig);
    searchTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    searchTileElement.titlebar.style.fontSize = '14px'

    searchTileElement
      .resize({
        height: 500
      })
      .reposition();

    const { content, ...text } = searchTileConfig;

    searchTileConfig.content = undefined;

    const tileObject: Tile<SearchTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: undefined,
      tileConfig: searchTileConfig,
      type: TileType.SEARCH
    };


    searchTileElement.addToTileMap(tileObject);
    searchTileElement.addComponentToList(result.id, result.component, result.tileType);
  }

  openDictionaryPanel(event: any) {
    const dictionaryPanelId = 'dictionaryTile'

    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === dictionaryPanelId
    );

    if (panelExist) {
      panelExist.front()
      return;
    }

    const result = this.generateDictionaryPanelConfiguration(dictionaryPanelId);

    const dictionaryTileConfig = result.panelConfig;

    const dictionaryTileElement = jsPanel.create(dictionaryTileConfig);
    dictionaryTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    dictionaryTileElement.titlebar.style.fontSize = '14px'

    dictionaryTileElement
      .resize({
        height: 500
      })
      .reposition();

    const { content, ...text } = dictionaryTileConfig;

    dictionaryTileConfig.content = undefined;

    const tileObject: Tile<DictionaryExplorerTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: undefined,
      tileConfig: dictionaryTileConfig,
      type: TileType.DICTIONARY
    };


    dictionaryTileElement.addToTileMap(tileObject);
    dictionaryTileElement.addComponentToList(result.id, result.component, result.tileType);
  }

  openOntologyExplorerPanel(event: any) {
    const ontologyExplorerPanelId = 'ontologyExplorerTile'

    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === ontologyExplorerPanelId
    );

    if (panelExist) {
      panelExist.front()
      return;
    }

    const result = this.generateOntologyExplorerPanelConfiguration(ontologyExplorerPanelId);

    const ontologyExplorerTileConfig = result.panelConfig;

    const ontologyTileElement = jsPanel.create(ontologyExplorerTileConfig);
    ontologyTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    ontologyTileElement.titlebar.style.fontSize = '14px'


    ontologyTileElement
      .resize({
        height: window.innerHeight / 2
      })
      .reposition();

    const { content, ...text } = ontologyExplorerTileConfig;

    ontologyExplorerTileConfig.content = undefined;

    const tileObject: Tile<OntologyExplorerTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: undefined,
      tileConfig: ontologyExplorerTileConfig,
      type: TileType.ONTOLOGY_EXPLORER
    };


    ontologyTileElement.addToTileMap(tileObject);
    ontologyTileElement.addComponentToList(result.id, result.component, result.tileType);
  }

  /**
   * Opens an Ontology view panel
   * @param selectedSubTree 
   * @param showLabelName 
   * @returns 
   */
  openOntologyClassViewerTile(ontologyNode: TreeNode<OntologyClass>) {
    const ontologyViewTileId = this.ontologyViewTilePrefix + ontologyNode?.data?.shortId;
    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === ontologyViewTileId
    );

    if (panelExist) {
      panelExist.front(); //metto il pannello in primo piano
      return;
    }

    const result = this.generateOntologyClassViewerTileConfiguration(ontologyViewTileId, ontologyNode);

    const ontologyViewTileConfig = result.panelConfig;

    const ontologyViewTileElement = jsPanel.create(ontologyViewTileConfig);
    ontologyViewTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    ontologyViewTileElement.titlebar.style.fontSize = '14px'

    ontologyViewTileElement
      .resize({
        height: window.innerHeight / 1.5
      })
      .reposition();

    const { content, ...text } = ontologyViewTileConfig;

    ontologyViewTileConfig.content = undefined;
    const ontologyClassViewTileContent: OntologyViewerTileContent = { contentId: ontologyNode.data?.id }  //NOTE For multiple panels, it is critical to pass the content id into the related content property (so that the data can be retrieved without display errors).

    const tileObject: Tile<OntologyViewerTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: ontologyClassViewTileContent,
      tileConfig: ontologyViewTileConfig,
      type: TileType.ONTOLOGY_CLASS_VIEWER
    };

    ontologyViewTileElement.addToTileMap(tileObject);
    ontologyViewTileElement.addComponentToList(result.id, result.component, result.tileType);
  }

  /**
   * Method that handles retrieving data of a dictionary entry and opening the edit panel
   * @param dictionaryEntryId {string} dictionary entry identifier
   * @returns {Promise<void>}
   */
  async openDictionaryEditPanel(dictionaryEntryId: string) {
    const dictionaryEntry = await lastValueFrom(this.dictionaryService.retrieveDictionaryEntryById(dictionaryEntryId));
    const idAfterHash = dictionaryEntryId.split('#')[1];
    const dictionaryEditTileId = this.dictionaryEditorTilePrefix + idAfterHash;
    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === dictionaryEditTileId
    );

    if (panelExist) {
      panelExist.front(); //metto il pannello in primo piano
      return;
    }

    const result = this.generateDictionaryEditTileConfiguration(dictionaryEditTileId, dictionaryEntry);
    const dictionaryEditTileConfig = result.panelConfig;
    const dictionaryEditTileElement = jsPanel.create(dictionaryEditTileConfig);
    dictionaryEditTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    dictionaryEditTileElement.titlebar.style.fontSize = '14px'

    dictionaryEditTileElement
      .resize({
        height: window.innerHeight / 1.5
      })
      .reposition();

    const { content, ...text } = dictionaryEditTileConfig;

    dictionaryEditTileConfig.content = undefined;
    const dictionaryEditTileContent: DictionaryEditorTileContent = { contentId: dictionaryEntry.id }  //NOTE For multiple panels, it is critical to pass the content id into the related content property (so that the data can be retrieved without display errors).

    const tileObject: Tile<DictionaryEditorTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: dictionaryEditTileContent,
      tileConfig: dictionaryEditTileConfig,
      type: TileType.DICTIONARY_EDIT
    };

    dictionaryEditTileElement.addToTileMap(tileObject);
    dictionaryEditTileElement.addComponentToList(result.id, result.component, result.tileType);
  }

  /**
   * Metodo che dato lo status del workspace lo riapre con le medesime caratteristiche
   * @param workspaceStatus {Workspace} status del workspace
   * @returns {void}
   */
  async restoreTiles(workspaceStatus: Workspace) {
    this.loaderService.show();

    let storedData: any = workspaceStatus.layout;
    const storedTiles: Array<Tile<any>> = workspaceStatus.tiles!;
    // console.log('restored layout', storedData, storedTiles, workspaceStatus);

    if (storedTiles.length == 0) {
      return;
    }

    const iterableStoredData = JSON.parse(storedData); //TODO verificare il workaround utilizzato per il ricalcolo delle dimensioni dei panel in caso di cambio schermo (da grande a piccolo)
    let tempStoredData = [];
    for (const tile of iterableStoredData) {
      const tempTile = { ...tile };
      const width = +tile.width.toString().replace('px', '');
      const height = +tile.height.toString().replace('px', '');
      if (width > window.innerWidth) {
        tempTile.width = window.innerWidth + 'px'
        tempTile.left = '0px'
      }
      if (height > window.innerHeight) {
        tempTile.height = (window.innerHeight * 0.8) + 'px'
        tempTile.left = '0px'
      }
      tempStoredData.push(tempTile)
    }
    storedData = JSON.stringify(tempStoredData)

    //IMPORTANTE Ripristino i dati nel localstorage PRIMA di fare restore,
    //il localstorage verrà letto dalla funzione jsPanel.layout.restore()
    localStorage.setItem(this.storageName, storedData)

    let currPanelElement;
    let componentRef;
    //Creazione dinamica oggetto, secondo la struttura richiesta da jsPanel
    for (const [index, tile] of storedTiles.entries()) {
      switch (tile.type as TileType) {
        case TileType.TEXT:
          const currentTextTileStoredHeight = parseInt(tempStoredData.find(e => e.id === tile.tileConfig.id).height.replace('px', ''));
          var textTileComponent = this.generateTextTilePanelConfiguration(tile.tileConfig.id, tile.content?.contentId!, tile.tileConfig.headerTitle, 0, currentTextTileStoredHeight);

          //IMPORTANTE il merge delle config così da aggiunge le callback di risposta agli eventi,
          //che non vengono incluse dalla funzione layout.save di jspanel e salvate nel db
          const mergedConfig = { ...textTileComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfig,
            storagename: this.storageName,
          });

          componentRef = textTileComponent.component

          break;
        case TileType.LEXICON_EDIT: {
          const lexEntryId = environment.lexoBaseIRI + tile.tileConfig.id.replace(this.lexiconEditTilePrefix, '');
          const lexicalEntry = await lastValueFrom(this.lexiconService.getLexicalEntry(tile.content.contentId));
          console.info(lexicalEntry)
          const lexEntryNode = <TreeNode<LexicalEntryOld>>{
            data: {
              name: lexicalEntry.label,
              instanceName: lexicalEntry.lexicalEntry,
              label: lexicalEntry.label,
              note: lexicalEntry['note'],
              creator: lexicalEntry['creator'],
              creationDate: lexicalEntry['creationDate'] ? new Date(lexicalEntry['creationDate']).toLocaleString() : '',
              lastUpdate: lexicalEntry['lastUpdate'] ? new Date(lexicalEntry['lastUpdate']).toLocaleString() : '',
              status: lexicalEntry['status'],
              uri: lexicalEntry['lexicalEntry'],
              type: LexicalEntryTypeOld.LEXICAL_ENTRY,
              sub: lexicalEntry.pos
            },
            children: [{
              data: {
                name: 'form (0)',
                instanceName: '_form_' + lexicalEntry.lexicalEntry,
                type: LexicalEntryTypeOld.FORMS_ROOT
              }
            },
            {
              data: {
                name: 'sense (0)',
                instanceName: '_sense_' + lexicalEntry.lexicalEntry,
                type: LexicalEntryTypeOld.SENSES_ROOT
              }
            }]
          };
          const lexiconEditTileComponent = this.generateLexiconEditTileConfiguration(tile.id || lexEntryId, lexEntryNode, true);

          //IMPORTANTE il merge delle config così da aggiunge le callback di risposta agli eventi,
          //che non vengono incluse dalla funzione layout.save di jspanel e salvate nel db
          const mergedConfig = { ...lexiconEditTileComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfig,
            storagename: this.storageName,
          });

          componentRef = lexiconEditTileComponent.component

          break;
        }

        case TileType.CORPUS:
          const corupusComponent = this.generateCorpusExplorerPanelConfiguration(tile.tileConfig.id);
          const mergedConfigCorpus = { ...corupusComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfigCorpus,
            storagename: this.storageName,
          });

          componentRef = corupusComponent.component;

          break;

        case TileType.SEARCH:
          const searchComponent = this.generateSearchPanelConfiguration(tile.tileConfig.id);
          const mergedConfigSearch = { ...searchComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfigSearch,
            storagename: this.storageName,
          });

          componentRef = searchComponent.component;

          break;

        case TileType.LEXICON:
          const lexiconComponent = this.generateLexiconPanelConfiguration(tile.tileConfig.id);
          const mergedConfigLexicon = { ...lexiconComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfigLexicon,
            storagename: this.storageName,
          });

          componentRef = lexiconComponent.component;

          //ATTENZIONE gli handler del componente jspanel headerControls non vengono ripristinati dalla funzione di restore,
          // è necessario reinserirlo manualmente
          currPanelElement.options.headerControls.add.handler = function (panel: any, control: any) {
            currentWorkspaceInstance.commonService.notifyOther({ option: EventsConstants.tag_clicked_lexicon, value: 'clicked' });
          }
          break;

        case TileType.DICTIONARY: {
          const dictionaryComponent = this.generateDictionaryPanelConfiguration(tile.tileConfig.id);
          const mergedConfigDictionary = { ...dictionaryComponent.panelConfig, ...tile.tileConfig };
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfigDictionary,
            storagename: this.storageName
          });
          componentRef = dictionaryComponent.component;
          break;
        }

        case TileType.DICTIONARY_EDIT: {
          const dictionaryEntry = await lastValueFrom(this.dictionaryService.retrieveDictionaryEntryById(tile.content.contentId).pipe(take(1)));
          const dictionaryEditTileComponent = this.generateDictionaryEditTileConfiguration(tile.id!, dictionaryEntry);
          const mergedConfig = { ...dictionaryEditTileComponent.panelConfig, ...tile.tileConfig };
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfig,
            storagename: this.storageName,
          });

          componentRef = dictionaryEditTileComponent.component

          break;
        }

        case TileType.ONTOLOGY_EXPLORER:
          const ontologyComponent = this.generateOntologyExplorerPanelConfiguration(tile.tileConfig.id);
          const mergedOntologyConfig = { ...ontologyComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedOntologyConfig,
            storagename: this.storageName,
          });

          componentRef = ontologyComponent.component;

          //ATTENZIONE gli handler del componente jspanel headerControls non vengono ripristinati dalla funzione di restore,
          // è necessario reinserirlo manualmente
          currPanelElement.options.headerControls.add.handler = function (panel: any, control: any) {
            currentWorkspaceInstance.commonService.notifyOther({ option: EventsConstants.ontology_explorer_tag_clicked, value: 'clicked' });
          }
          break;

        case TileType.ONTOLOGY_CLASS_VIEWER:
          //FIXME RICHIAMARE IL SERVIZIO CORRETTO
          const ontologyEntry: TreeNode<OntologyClass> = { data: undefined };
          const ontologyClassComponent = this.generateOntologyClassViewerTileConfiguration(tile.tileConfig.id, ontologyEntry);
          const mergedOntologyClassConfig = { ...ontologyClassComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedOntologyClassConfig,
            storagename: this.storageName,
          });

          componentRef = ontologyClassComponent.component;

          //ATTENZIONE gli handler del componente jspanel headerControls non vengono ripristinati dalla funzione di restore,
          // è necessario reinserirlo manualmente
          currPanelElement.options.headerControls.add.handler = function (panel: any, control: any) {
            currentWorkspaceInstance.commonService.notifyOther({ option: EventsConstants.tag_clicked_ontology_class_viewer_tile, value: 'clicked' });
          }
          break;

        default:
          console.error("type " + tile.type + " not implemented");
      }
      currPanelElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
      currPanelElement.titlebar.style.fontSize = '14px'
      currPanelElement.addToTileMap(tile);
      currPanelElement.addComponentToList(tile.tileConfig.id, componentRef, tile.type);

    }

    /* for (const [tileId, tile] of storedTiles.entries()) {
      let currPanelElement = jsPanel.getPanels().find(
        (x: { id: string; }) => x.id === tile.tileConfig.id
      );

      currPanelElement.addContent(tile, this);
    }; */

    this.loaderService.hide();
  }

  /**
   * Metodo che recupera la lista dei testi come elementi per la scelta
   * @returns {TextChoice[]} lista dei testi come elementi selezionabili
   */
  retrieveTextList(): TextChoice[] {
    const textList: Array<TextChoice> = [];

    this.loaderService.show();
    this.workspaceService.retrieveTextChoiceList().subscribe({
      next: (data) => {
        //data.forEach(el => textList.push({title:el.title, status:el.status, createdBy: el.createdBy, updatedOn:el.updatedOn}))
        //textList=data;
        //textList = JSON.parse(JSON.stringify(data));
        data.forEach(el => textList.push(el));
        this.loaderService.hide();
      }
    });

    return textList;
  }

  /**
   * Metodo che esegue il salvataggio dello stato del workspace
   * @param event {any} evento di click sul salvataggio
   */
  saveWork(event: any) {
    //console.log(this.openPanels);
    //this.workSaved = true;

    // save panel layout
    const storedData = jsPanel.layout.save({
      selector: '.jsPanel-standard',
      storagename: this.storageName
    });

    //this.storedTiles = new Map(jsPanel.extensions.getTextTileMap()); //PER TEST, POI VERRà PRESO DAL DB

    const openTiles = jsPanel.extensions.getTileMap();
    this.loaderService.show();
    this.workspaceService.saveWorkspaceStatus(Number(this.workspaceId!), storedData, openTiles).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.loaderService.hide();
        return this.commonService.throwHttpErrorAndMessage(error, 'Error saving workspace status');
      })
    ).subscribe(() => {
      this.workSaved = true;
      this.loaderService.hide();
    });

    // close panels, here we simply close all panels in the document
    // for (const panel of jsPanel.getPanels()) {
    //   panel.close();
    // }

    // for demo purpose only log stored data to the console
    // or use your browser's dev tools to inspect localStorage
    // console.log('stored data', storedData);
  }

  //TODO verificare perché non sembra sia utilizzato
  /**
   * Componente creato in maniera dinamica, con gestione manuale degli input e degli eventi
   * @param textList {Array<any>} lista dei testi
   * @param workspaceComponent {any} ?
   * @returns {any} elemento html del selettore di testo
   */
  workspaceTextSelectorComponentToHtml(textList: Array<any>, workspaceComponent: any) {
    const componentRef = this.vcr.createComponent(WorkspaceTextSelectorComponent);

    componentRef.instance.textChoiceList = textList;

    componentRef.instance.onTextSelectEvent
      .subscribe(event => {
        console.log(event.target.getAttribute('data-type'));

        const textId = event.target.parentElement.id;
        const title = event.target.parentElement.querySelector("[data-type='title']").textContent;
        this.openTextPanel(textId, title)
      });

    const element = componentRef.location.nativeElement;
    return element;
  }

  /**
   * Sets the variables of the text tile component, needed for the changing section operation
   * @param textTileComponent angular component
   * @param startingRowIndex 
   */
  private setChangeSectionOperationInTextTile(textTileComponent: ComponentRef<WorkspaceTextWindowComponent>, startingRowIndex: number, kwic: string, kwicOffsetStart: number) {
    const kwicOffsetEnd = kwicOffsetStart + kwic.length;
    textTileComponent.instance.startingRowIndex = startingRowIndex;
    textTileComponent.instance.scrollingDirection = ScrollingDirectionType.ChangingSection;
    textTileComponent.instance.setHighlightSelectionFromSearch(kwicOffsetStart, kwicOffsetEnd, kwic);
  }

  /**
   * @private
   * Metodo che genera la configurazione per il panel explorer corpus incluso il componente
   * @param ecPanelId {string} identificativo del pannello explorer corpus
   * @returns configurazione del pannello
   */
  private generateCorpusExplorerPanelConfiguration(ecPanelId: string) {
    const componentRef = this.vcr.createComponent(WorkspaceCorpusExplorerComponent);

    const subs = componentRef.instance.onTextSelectEvent //mappa l'evento di selezione di un testo nell'ec
      .subscribe((resource: CorpusElement) => {
        console.info('onTextSelectEvent ricevuto', resource);
        const textId = resource.id;
        const title = resource.name ?? '';
        this.openTextPanel(textId, title?.toLowerCase());
      }
      );

    const element = componentRef.location.nativeElement;

    const config = {
      id: ecPanelId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Corpus Explorer',
      maximizedMargin: 5,
      dragit: { snap: false },
      syncMargins: true,
      theme: {
        bgPanel: '#CCE1F2',
        bgContent: '#fff',
        colorHeader: 'black',
        colorContent: `#${jsPanel.colorNames.gray700}`,
        border: 'thin solid #CCE1F2',
        borderRadius: '.33rem',
      },
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        //currentWorkspaceInstance.openPanels.delete(panel.id);
        this.removeFromTileMap(panel.id, TileType.CORPUS);
        this.removeComponentFromList(panel.id);
        subs.unsubscribe();
      },
      onfronted: function (this: any, panel: any, status: any) {
        //componentRef.instance.reload()
        // const panelIDs = jsPanel.getPanels(function () {
        //   return panel.classList.contains('jsPanel-standard');
        // }).map((panel: any) => panel.id);
        // console.log(panelIDs)
      }
    };

    return {
      id: ecPanelId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.CORPUS
    };
  }

  /**
   * @private
   * Metodo che genera la configurazione del pannello di annotazione di un testo, incluso il componente relativo
   * @param panelId {string} identificativo del pannello
   * @param textId {number} identificativo numerico del testo
   * @param title {string} titolo del testo
   * @returns configurazione del pannello di annotazione di un testo
   */
  private generateTextTilePanelConfiguration(panelId: string, textId: number, title: string, startingRowIndex: number, textTileStoredHeight?: number) {
    const componentRef = this.vcr.createComponent(WorkspaceTextWindowComponent);
    componentRef.instance.textId = textId;
    componentRef.instance.startingRowIndex = startingRowIndex;
    componentRef.instance.height = textTileStoredHeight ?? window.innerHeight / 3 * 2;
    // componentRef.instance.visibleLayers = this.visibleLayers;

    const element = componentRef.location.nativeElement;

    const config = this.generateTextTileConfig(panelId, title, element, componentRef)

    return {
      id: panelId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.TEXT
    };
  }

  /**
   * @private
   * Metodo che ridimensiona l'altezza del contenitore del workspace
   */
  private resizeContainerHeight() {
    const height = window.innerHeight - (this.wsMenuContainer.nativeElement.offsetHeight + 1);
    this.renderer.setStyle(this.container.nativeElement, 'height', `${height}px`);
  }

  /**
   * @private
   * Metodo che genera la configurazione del tile di testo
   * @param panelId {string} identificativo del pannello
   * @param title {string} titolo del testo
   * @param textWindowComponent {any} accesso diretto al native element
   * @param componentRef {any} componentRef di WorkspaceTextWindowComponent
   * @returns configurazione del tile di testo
   */
  private generateTextTileConfig(panelId: string, title: string, textWindowComponent: any, componentRef: any) {
    const config =
    {
      id: panelId,
      container: this.workspaceContainer,
      headerTitle: 'Text - ' + title.toLowerCase(),
      content: textWindowComponent,
      maximizedMargin: 5,
      dragit: { snap: false },
      syncMargins: true,
      theme: {
        bgPanel: '#CCE1F2',
        colorHeader: 'black',
        border: 'thin solid #CCE1F2',
        borderRadius: '.33rem',
      },
      css: {
        content: 'overflowYHiddenTextTile',   // adds the classes to ".jsPanel-content"
      },
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        //currentWorkspaceInstance.openPanels.delete(panel.id);
        //this.deleteTileContent(panel.id, TileType.TEXT);
        // console.log(this, panel, closedByUser)
        this.removeFromTileMap(panel.id, TileType.TEXT);
        this.removeComponentFromList(panel.id);
      },
      onfronted: function (this: any, panel: any, status: any) {
        //componentRef.instance.reload()
        // console.log('panel', this, panel, status)
      },
      onmaximized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onminimized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onnormalized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onsmallified: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onunsmallified: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      resizeit: {
        minWidth: 600,
        resize: (panel: any, paneldata: any, event: any) => {
          componentRef.instance.updateHeight(paneldata.height)
        },
        stop: (panel: any, paneldata: any, event: any) => {
          componentRef.instance.updateTextEditorSize();
        }
      }
    };
    return config;
  }

  /**
   * @private
   * Metodo che genera la configurazione del pannello di esplorazione del lessico
   * @param lexiconPanelId {string} identificativo del pannello di esplorazione del lessico
   * @returns configurazione del pannello di esplorazione del lessico
   */
  private generateLexiconPanelConfiguration(lexiconPanelId: string) {
    const componentRef = this.vcr.createComponent(WorkspaceLexiconTileComponent);

    const element = componentRef.location.nativeElement;

    const config = {
      id: lexiconPanelId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Lexicon Explorer',
      maximizedMargin: 5,
      dragit: { snap: false },
      contentOverflow: 'hidden',
      syncMargins: true,
      theme: {
        bgPanel: '#C6F8E5',
        colorHeader: 'black',
        border: 'thin solid #C6F8E5',
        borderRadius: '.33rem',
      },
      panelSize: {
        width: () => window.innerWidth * 0.2,
        height: '60vh'
      },
      resizeit: {
        minWidth: 250
      },
      headerControls: {
        add: {
          html: '<span class="pi pi-tag"></span>',
          name: 'tag',
          handler: (panel: any, control: any) => {
            this.commonService.notifyOther({ option: EventsConstants.tag_clicked_lexicon, value: 'clicked' });
          }
        }
      },
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        this.removeFromTileMap(panel.id, TileType.LEXICON);
        this.removeComponentFromList(panel.id);
      },
      onfronted: function (this: any, panel: any, status: any) {
        // const panelIDs = jsPanel.getPanels(function () {
        //   return panel.classList.contains('jsPanel-standard');
        // }).map((panel: any) => panel.id);
        // console.log(panelIDs)
      }
    };

    return {
      id: lexiconPanelId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.LEXICON
    };
  }

  /**
   * @private
   * Metodo che genera la configurazione del pannello di edit del lessico
   * @param lexiconEditTileId {string} identificativo del tile di edit del lessico
   * @param selectedSubTree {TreeNode<LexicalEntryOld>} sottonodo entrata lessicale selezionato
   * @param showLabelName {boolean} definisce se visualizzare la label come nome
   */
  private generateLexiconEditTileConfiguration(lexiconEditTileId: string, selectedSubTree: TreeNode<LexicalEntryOld>, showLabelName: boolean) {
    const componentRef = this.vcr.createComponent(WorkspaceLexiconEditTileComponent);

    componentRef.instance.selectedType = selectedSubTree.data!.type!;
    componentRef.instance.selectedNode = selectedSubTree;
    componentRef.instance.panelId = lexiconEditTileId;

    const lexicalEntryTree = selectedSubTree.data?.type === LexicalEntryTypeOld.LEXICAL_ENTRY ? selectedSubTree : selectedSubTree.parent?.parent;

    switch (selectedSubTree.data!.type) {
      case LexicalEntryTypeOld.LEXICAL_ENTRY:
        selectedSubTree.expanded = false;
        componentRef.instance.lexicalEntryTree = [selectedSubTree];
        break;
      case LexicalEntryTypeOld.FORM:
      case LexicalEntryTypeOld.SENSE:
        componentRef.instance.lexicalEntryTree = [selectedSubTree.parent!.parent!];
        break;
    }
    componentRef.instance.showLabelName = showLabelName; //tirato fuori dallo switch perché si ripeteva

    const element = componentRef.location.nativeElement;

    const config = {
      id: lexiconEditTileId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Lexicon Editor - ' + lexicalEntryTree?.data?.label,
      maximizedMargin: 5,
      dragit: { snap: false },
      syncMargins: true,
      theme: {
        bgPanel: '#C6F8E5',
        colorHeader: 'black',
        border: 'thin solid #C6F8E5',
        borderRadius: '.33rem',
      },
      panelSize: {
        width: () => window.innerWidth * 0.5,
        height: '60vh'
      },
      headerControls: {
        add: {
          html: '<span class="pi pi-tag"></span>',
          name: 'tag',
          handler: () => {
            this.commonService.notifyOther({ option: EventsConstants.tag_clicked_lexicon_edit, value: 'clicked' });
          }
        }
      },
      onclosed: function (this: any, panel: any) {
        this.removeFromTileMap(panel.id, TileType.LEXICON_EDIT);
        this.removeComponentFromList(panel.id);
      },
      onfronted: function (this: any, panel: any) {
        const panelIDs = jsPanel.getPanels(function () {
          return panel.classList.contains('jsPanel-standard');
        }).map((panel: any) => panel.id);
      }
    };

    return {
      id: lexiconEditTileId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.LEXICON_EDIT
    };

  }

  /**
   * @private
   * Generates search tile configurations
   * @param searchPanelId {string} search tile identifier
   * @returns search tile configurations
   */
  private generateSearchPanelConfiguration(searchPanelId: string) {
    const componentRef = this.vcr.createComponent(WorkspaceSearchTileComponent);

    const element = componentRef.location.nativeElement;

    const config = {
      id: searchPanelId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Search',
      maximizedMargin: 5,
      dragit: { snap: false },
      contentOverflow: 'hidden',
      syncMargins: true,
      theme: {
        bgPanel: '#FBF7D5',
        colorHeader: 'black',
        border: 'thin solid #FBF7D5',
        borderRadius: '.33rem',
      },
      panelSize: {
        width: () => window.innerWidth * 0.6
      },
      resizeit: {
        minWidth: 830,
        minHeight: 500,
        resize: (panel: any, paneldata: any, event: any) => {
          componentRef.instance.updateHeight(paneldata.height, paneldata.width);
        }
      },
      onmaximized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        const panelW = Number.parseFloat(panel.style.width.split('px')[0]);
        componentRef.instance.updateHeight(panelH, panelW);
      },
      onminimized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        const panelW = Number.parseFloat(panel.style.width.split('px')[0]);
        componentRef.instance.updateHeight(panelH, panelW);;
      },
      onnormalized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        const panelW = Number.parseFloat(panel.style.width.split('px')[0]);
        componentRef.instance.updateHeight(panelH, panelW);
      },
      onsmallified: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        const panelW = Number.parseFloat(panel.style.width.split('px')[0]);
        componentRef.instance.updateHeight(panelH, panelW);
      },
      onunsmallified: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        const panelW = Number.parseFloat(panel.style.width.split('px')[0]);
        componentRef.instance.updateHeight(panelH, panelW);
      },
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        this.removeFromTileMap(panel.id, TileType.SEARCH);
        this.removeComponentFromList(panel.id);
      }
    };

    return {
      id: searchPanelId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.SEARCH
    };
  }

  private generateDictionaryPanelConfiguration(dictionaryPanelId: string) {
    const componentRef = this.vcr.createComponent(WorkspaceDictionaryTileComponent);

    const element = componentRef.location.nativeElement;

    const config = {
      id: dictionaryPanelId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Dictionary Explorer',
      maximizedMargin: 5,
      dragit: { snap: false },
      contentOverflow: 'hidden',
      syncMargins: true,
      theme: {
        bgPanel: '#F9DED7',
        colorHeader: 'black',
        border: 'thin solid #F9DED7',
        borderRadius: '.33rem',
      },
      panelSize: {
        width: () => window.innerWidth * 0.2,
        height: '60vh'
      },
      resizeit: {
        minWidth: 250
      },
      // headerControls: {
      //   add: {
      //     html: '<span class="pi pi-tag"></span>',
      //     name: 'tag',
      //     handler: (panel: any, control: any) => {
      //       this.commonService.notifyOther({ option: 'tag_clicked', value: 'clicked' });
      //     }
      //   }
      // },
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        this.removeFromTileMap(panel.id, TileType.DICTIONARY);
        this.removeComponentFromList(panel.id);
      },
      onfronted: function (this: any, panel: any, status: any) {
        // const panelIDs = jsPanel.getPanels(function () {
        //   return panel.classList.contains('jsPanel-standard');
        // }).map((panel: any) => panel.id);
        // console.log(panelIDs)
      }
    };

    return {
      id: dictionaryPanelId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.DICTIONARY
    };
  }

  /**
   * Generates the edit panel of a dictionary entry with the appropriate configurations
   * @param dictionaryEditTileId {string} panel identifier
   * @param dictionaryEntry {DictionaryEntry} 
   * @returns panel configuration
   */
  private generateDictionaryEditTileConfiguration(dictionaryEditTileId: string, dictionaryEntry: DictionaryEntry) {
    const componentRef = this.vcr.createComponent(WorkspaceDictionaryEditorTileComponent);
    componentRef.instance.panelId = dictionaryEditTileId;
    componentRef.instance.dictionaryEntry = dictionaryEntry;

    const element = componentRef.location.nativeElement;

    const config = {
      id: dictionaryEditTileId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Dictionary Editor - ' + dictionaryEntry.label,
      maximizedMargin: 5,
      dragit: { snap: false },
      syncMargins: true,
      theme: {
        bgPanel: '#F9DED7',
        colorHeader: 'black',
        border: 'thin solid #F9DED7',
        borderRadius: '.33rem',
      },
      panelSize: {
        width: () => window.innerWidth * 0.5,
        height: '60vh'
      },
      // headerControls: {
      //   add: {
      //     html: '<span class="pi pi-tag"></span>',
      //     name: 'tag',
      //     handler: () => {
      //       this.commonService.notifyOther({ option: 'tag_clicked_edit_tile', value: 'clicked' });
      //     }
      //   }
      // },
      onclosed: function (this: any, panel: any) {
        this.removeFromTileMap(panel.id, TileType.DICTIONARY_EDIT);
        this.removeComponentFromList(panel.id);
      },
      onfronted: function (this: any, panel: any) {
        const panelIDs = jsPanel.getPanels(function () {
          return panel.classList.contains('jsPanel-standard');
        }).map((panel: any) => panel.id);
      }
    };

    return {
      id: dictionaryEditTileId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.DICTIONARY_EDIT
    };
  }

  /**
 * @private
 * Generate the configurations for the ontology panel
 * @param ontologyPanelId {string} panel identifier
 * panel configuration
 */
  private generateOntologyExplorerPanelConfiguration(ontologyPanelId: string) {
    const componentRef = this.vcr.createComponent(WorkspaceOntologyExplorerComponent);

    const element = componentRef.location.nativeElement;

    const config = {
      id: ontologyPanelId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Ontology Explorer',
      maximizedMargin: 5,
      dragit: { snap: false },
      contentOverflow: 'hidden',
      syncMargins: true,
      theme: {
        bgPanel: '#eceae4',
        colorHeader: 'black',
        border: 'thin solid #eceae4',
        borderRadius: '.33rem',
      },
      panelSize: {
        width: () => window.innerWidth * 0.28,
        height: '60vh',
      },
      resizeit: {
        minWidth: 250,
        resize: (panel: any, paneldata: any, event: any) => {
          componentRef.instance.updateHeight(paneldata.height);
        }
      },
      onmaximized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateHeight(panelH);
      },
      onminimized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateHeight(panelH);;
      },
      onnormalized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateHeight(panelH);
      },
      onsmallified: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateHeight(panelH);
      },
      onunsmallified: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateHeight(panelH);
      },
      headerControls: {
        add: {
          html: '<span class="pi pi-tag"></span>',
          name: 'tag',
          handler: (panel: any, control: any) => {
            this.commonService.notifyOther({ option: EventsConstants.ontology_explorer_tag_clicked, value: 'clicked' });
          }
        }
      },
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        this.removeFromTileMap(panel.id, TileType.ONTOLOGY_EXPLORER);
        this.removeComponentFromList(panel.id);
      },
    };

    return {
      id: ontologyPanelId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.ONTOLOGY_EXPLORER
    };
  }

  /**
   * 
   * @param OntologyViewerTileId 
   * @param selectedSubTree 
   * @param showLabelName 
   * @returns 
   */
  private generateOntologyClassViewerTileConfiguration(OntologyViewerTileId: string, selectedNode: TreeNode<OntologyClass>) {
    const componentRef = this.vcr.createComponent(WorkspaceOntologyViewerComponent);

    componentRef.instance.visibleTileType = TileType.ONTOLOGY_CLASS_VIEWER;
    // componentRef.instance.selectedNode = selectedNode;
    // componentRef.instance.panelId = OntologyViewerTileId;
    // componentRef.instance.showLabelName = showLabelName; //tirato fuori dallo switch perché si ripeteva
    const name = selectedNode.data?.label ?? selectedNode.data?.shortId

    const element = componentRef.location.nativeElement;

    const config = {
      id: OntologyViewerTileId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Ontology Viewer - <span class="ontology-dot"></span>' + name,
      maximizedMargin: 5,
      dragit: { snap: false },
      syncMargins: true,
      theme: {
        bgPanel: '#ECEAE4',
        colorHeader: 'black',
        border: 'thin solid #ECEAE4',
        borderRadius: '.33rem',
      },
      panelSize: {
        width: () => window.innerWidth * 0.5,
        height: '60vh'
      },
      headerControls: {
        add: {
          html: '<span class="pi pi-tag"></span>',
          name: 'tag',
          handler: () => {
            this.commonService.notifyOther({ option: EventsConstants.tag_clicked_ontology_class_viewer_tile, value: 'clicked' });
          }
        }
      },
      onclosed: function (this: any, panel: any) {
        this.removeFromTileMap(panel.id, TileType.LEXICON_EDIT);
        this.removeComponentFromList(panel.id);
      },
      onfronted: function (this: any, panel: any) {
        const panelIDs = jsPanel.getPanels(function () {
          return panel.classList.contains('jsPanel-standard');
        }).map((panel: any) => panel.id);
      }
    };

    return {
      id: OntologyViewerTileId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.ONTOLOGY_CLASS_VIEWER
    };

  }
}

